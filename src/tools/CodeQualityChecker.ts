import { JavaProjectAssistant } from './JavaProjectAssistant.js';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

export class CodeQualityChecker extends JavaProjectAssistant {
  getName(): string {
    return 'check_code_quality';
  }

  getDescription(): string {
    return 'Analyzes Java code quality, detects code smells, calculates complexity metrics, and provides improvement suggestions';
  }

  getInputSchema() {
    return {
      type: 'object' as const,
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the Java project root directory',
        },
        filePath: {
          type: 'string',
          description: 'Specific file to analyze (optional, if not provided will analyze all Java files)',
        },
        includeMetrics: {
          type: 'boolean',
          description: 'Include detailed code metrics in the analysis',
          default: true,
        },
      },
      required: ['projectPath'],
    };
  }

  async execute(args: { projectPath: string; filePath?: string; includeMetrics?: boolean }): Promise<string> {
    const { projectPath, filePath, includeMetrics = true } = args;
    
    try {
      if (filePath) {
        return await this.analyzeSingleFile(filePath, includeMetrics);
      } else {
        return await this.analyzeProject(projectPath, includeMetrics);
      }
    } catch (error) {
      return `Error checking code quality: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async analyzeSingleFile(filePath: string, includeMetrics: boolean): Promise<string> {
    if (!existsSync(filePath)) {
      return `❌ File not found: ${filePath}`;
    }

    const content = readFileSync(filePath, 'utf-8');
    const analysis = this.performCodeAnalysis(content, filePath);
    
    let result = `## 🔍 Code Quality Analysis\n\n`;
    result += `**File:** \`${filePath}\`\n`;
    result += `**Size:** ${(statSync(filePath).size / 1024).toFixed(2)} KB\n\n`;
    
    result += '### 📊 Metrics\n';
    result += `- **Lines of Code:** ${analysis.metrics.linesOfCode}\n`;
    result += `- **Lines with Comments:** ${analysis.metrics.commentLines}\n`;
    result += `- **Comment Ratio:** ${analysis.metrics.commentRatio.toFixed(1)}%\n`;
    result += `- **Methods:** ${analysis.metrics.methodCount}\n`;
    result += `- **Classes:** ${analysis.metrics.classCount}\n`;
    result += `- **Average Method Length:** ${analysis.metrics.avgMethodLength.toFixed(1)} lines\n\n`;
    
    result += '### ⚠️ Code Smells Detected\n';
    if (analysis.codeSmells.length === 0) {
      result += '✅ No major code smells detected!\n\n';
    } else {
      analysis.codeSmells.forEach((smell: any) => {
        result += `- **${smell.type}:** ${smell.description} (Line ${smell.line})\n`;
      });
      result += '\n';
    }
    
    result += '### 🎯 Improvement Suggestions\n';
    analysis.suggestions.forEach((suggestion: string) => {
      result += `- ${suggestion}\n`;
    });
    
    if (includeMetrics) {
      result += '\n### 📈 Detailed Metrics\n';
      result += this.generateDetailedMetrics(analysis);
    }
    
    return result;
  }

  private async analyzeProject(projectPath: string, includeMetrics: boolean): Promise<string> {
    const javaFiles = this.findJavaFiles(projectPath);
    
    if (javaFiles.length === 0) {
      return '❌ No Java files found in the project.';
    }
    
    let totalMetrics = {
      totalFiles: 0,
      totalLines: 0,
      totalMethods: 0,
      totalClasses: 0,
      commentRatio: 0,
    };
    
    const allCodeSmells: any[] = [];
    const allSuggestions: string[] = [];
    
    for (const filePath of javaFiles) {
      const content = readFileSync(filePath, 'utf-8');
      const analysis = this.performCodeAnalysis(content, filePath);
      
      totalMetrics.totalFiles++;
      totalMetrics.totalLines += analysis.metrics.linesOfCode;
      totalMetrics.totalMethods += analysis.metrics.methodCount;
      totalMetrics.totalClasses += analysis.metrics.classCount;
      totalMetrics.commentRatio += analysis.metrics.commentRatio;
      
      allCodeSmells.push(...analysis.codeSmells);
      allSuggestions.push(...analysis.suggestions);
    }
    
    totalMetrics.commentRatio /= totalMetrics.totalFiles;
    
    let result = `## 🔍 Project Code Quality Analysis\n\n`;
    result += `**Total Java Files:** ${totalMetrics.totalFiles}\n`;
    result += `**Total Lines of Code:** ${totalMetrics.totalLines.toLocaleString()}\n`;
    result += `**Total Methods:** ${totalMetrics.totalMethods.toLocaleString()}\n`;
    result += `**Total Classes:** ${totalMetrics.totalClasses.toLocaleString()}\n`;
    result += `**Average Comment Ratio:** ${totalMetrics.commentRatio.toFixed(1)}%\n\n`;
    
    result += '### ⚠️ Code Smells Summary\n';
    const smellTypes: { [key: string]: number } = {};
    allCodeSmells.forEach(smell => {
      smellTypes[smell.type] = (smellTypes[smell.type] || 0) + 1;
    });
    
    if (Object.keys(smellTypes).length === 0) {
      result += '✅ No major code smells detected across the project!\n\n';
    } else {
      Object.entries(smellTypes).forEach(([type, count]) => {
        result += `- **${type}:** ${count} occurrences\n`;
      });
      result += '\n';
    }
    
    result += '### 🎯 Top Improvement Suggestions\n';
    const uniqueSuggestions = [...new Set(allSuggestions)].slice(0, 10);
    uniqueSuggestions.forEach(suggestion => {
      result += `- ${suggestion}\n`;
    });
    
    result += '\n### 📁 Files with Most Issues\n';
    const fileIssues: { [key: string]: number } = {};
    allCodeSmells.forEach(smell => {
      const fileName = smell.file.split('/').pop();
      fileIssues[fileName] = (fileIssues[fileName] || 0) + 1;
    });
    
    const sortedFiles = Object.entries(fileIssues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    if (sortedFiles.length > 0) {
      sortedFiles.forEach(([fileName, count]) => {
        result += `- \`${fileName}\`: ${count} issues\n`;
      });
    } else {
      result += '✅ All files are in good shape!\n';
    }
    
    return result;
  }

  private performCodeAnalysis(content: string, filePath: string): any {
    const lines = content.split('\n');
    const metrics = this.calculateMetrics(lines);
    const codeSmells = this.detectCodeSmells(lines, filePath);
    const suggestions = this.generateSuggestions(metrics, codeSmells);
    
    return { metrics, codeSmells, suggestions };
  }

  private calculateMetrics(lines: string[]): any {
    let linesOfCode = 0;
    let commentLines = 0;
    let methodCount = 0;
    let classCount = 0;
    let totalMethodLength = 0;
    let currentMethodLines = 0;
    let inMethod = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (line === '') continue;
      
      // Count comment lines
      if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        commentLines++;
        continue;
      }
      
      linesOfCode++;
      
      // Count classes
      if (line.includes('class ') && !line.includes('interface')) {
        classCount++;
      }
      
      // Count methods and their length
      if (line.includes('(') && line.includes(')') && 
          (line.includes('public ') || line.includes('private ') || line.includes('protected '))) {
        if (inMethod && currentMethodLines > 0) {
          totalMethodLength += currentMethodLines;
        }
        methodCount++;
        currentMethodLines = 1;
        inMethod = true;
        braceCount = 0;
      } else if (inMethod) {
        currentMethodLines++;
        
        // Count braces to detect method end
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        
        if (braceCount <= 0 && line.includes('}')) {
          inMethod = false;
        }
      }
    }
    
    // Add last method if file ends in method
    if (inMethod && currentMethodLines > 0) {
      totalMethodLength += currentMethodLines;
    }
    
    const commentRatio = linesOfCode > 0 ? (commentLines / (linesOfCode + commentLines)) * 100 : 0;
    const avgMethodLength = methodCount > 0 ? totalMethodLength / methodCount : 0;
    
    return {
      linesOfCode,
      commentLines,
      commentRatio,
      methodCount,
      classCount,
      avgMethodLength,
    };
  }

  private detectCodeSmells(lines: string[], filePath: string): any[] {
    const codeSmells: any[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;
      
      // Long method detection
      if (line.length > 120) {
        codeSmells.push({
          type: 'Long Line',
          description: `Line too long (${line.length} characters)`,
          line: lineNumber,
          file: filePath,
        });
      }
      
      // Deep nesting detection
      const indentLevel = lines[i].length - lines[i].trimStart().length;
      if (indentLevel > 24) { // More than 6 levels of indentation (4 spaces each)
        codeSmells.push({
          type: 'Deep Nesting',
          description: 'Too many levels of nesting',
          line: lineNumber,
          file: filePath,
        });
      }
      
      // Magic numbers
      const magicNumberRegex = /\b\d{3,}\b/;
      if (magicNumberRegex.test(line) && !line.includes('//') && !line.includes('import')) {
        codeSmells.push({
          type: 'Magic Number',
          description: 'Magic number detected, consider using constants',
          line: lineNumber,
          file: filePath,
        });
      }
      
      // Empty catch blocks
      if (line.includes('catch') && i + 2 < lines.length) {
        const nextLines = lines.slice(i + 1, i + 3);
        if (nextLines.every(l => l.trim() === '' || l.trim() === '}')) {
          codeSmells.push({
            type: 'Empty Catch Block',
            description: 'Empty catch block detected',
            line: lineNumber,
            file: filePath,
          });
        }
      }
      
      // TODO comments
      if (line.includes('TODO') || line.includes('FIXME')) {
        codeSmells.push({
          type: 'Technical Debt',
          description: 'TODO/FIXME comment found',
          line: lineNumber,
          file: filePath,
        });
      }
    }
    
    return codeSmells;
  }

  private generateSuggestions(metrics: any, codeSmells: any[]): string[] {
    const suggestions: string[] = [];
    
    // Comment ratio suggestions
    if (metrics.commentRatio < 10) {
      suggestions.push('Consider adding more comments to improve code documentation');
    }
    
    // Method length suggestions
    if (metrics.avgMethodLength > 20) {
      suggestions.push('Some methods are quite long, consider breaking them into smaller functions');
    }
    
    // Code smells suggestions
    const smellTypes = [...new Set(codeSmells.map(s => s.type))];
    
    if (smellTypes.includes('Long Line')) {
      suggestions.push('Break long lines to improve readability');
    }
    
    if (smellTypes.includes('Deep Nesting')) {
      suggestions.push('Reduce nesting levels using early returns or guard clauses');
    }
    
    if (smellTypes.includes('Magic Number')) {
      suggestions.push('Replace magic numbers with named constants');
    }
    
    if (smellTypes.includes('Empty Catch Block')) {
      suggestions.push('Add proper error handling in catch blocks');
    }
    
    if (smellTypes.includes('Technical Debt')) {
      suggestions.push('Address TODO/FIXME comments to reduce technical debt');
    }
    
    // General suggestions
    if (metrics.linesOfCode > 500) {
      suggestions.push('Consider splitting large files into smaller, focused classes');
    }
    
    if (metrics.methodCount > 20) {
      suggestions.push('Large number of methods detected, consider applying Single Responsibility Principle');
    }
    
    return suggestions;
  }

  private generateDetailedMetrics(analysis: any): string {
    let metrics = '';
    
    metrics += '```\n';
    metrics += `Lines of Code: ${analysis.metrics.linesOfCode}\n`;
    metrics += `Comment Lines: ${analysis.metrics.commentLines}\n`;
    metrics += `Comment Ratio: ${analysis.metrics.commentRatio.toFixed(1)}%\n`;
    metrics += `Methods: ${analysis.metrics.methodCount}\n`;
    metrics += `Classes: ${analysis.metrics.classCount}\n`;
    metrics += `Avg Method Length: ${analysis.metrics.avgMethodLength.toFixed(1)} lines\n`;
    metrics += `Code Smells: ${analysis.codeSmells.length}\n`;
    metrics += '```\n';
    
    return metrics;
  }

  private findJavaFiles(projectPath: string): string[] {
    const javaFiles: string[] = [];
    this.scanDirectory(projectPath, javaFiles);
    return javaFiles;
  }

  private scanDirectory(dir: string, javaFiles: string[]): void {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          this.scanDirectory(fullPath, javaFiles);
        } else if (entry.isFile() && entry.name.endsWith('.java')) {
          javaFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = ['target', 'build', 'node_modules', '.git', '.idea', 'out', 'test'];
    return skipDirs.includes(dirName);
  }
}
