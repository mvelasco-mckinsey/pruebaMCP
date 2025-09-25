import { JavaProjectAssistant } from './JavaProjectAssistant.js';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

export class ProjectStructureAnalyzer extends JavaProjectAssistant {
  getName(): string {
    return 'analyze_project_structure';
  }

  getDescription(): string {
    return 'Analyzes Java project structure, architecture patterns, package organization, and provides recommendations for improvement';
  }

  getInputSchema() {
    return {
      type: 'object' as const,
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the Java project root directory',
        },
        includeArchitecture: {
          type: 'boolean',
          description: 'Include architecture pattern analysis',
          default: true,
        },
        includeMetrics: {
          type: 'boolean',
          description: 'Include detailed project metrics',
          default: true,
        },
      },
      required: ['projectPath'],
    };
  }

  async execute(args: { projectPath: string; includeArchitecture?: boolean; includeMetrics?: boolean }): Promise<string> {
    const { projectPath, includeArchitecture = true, includeMetrics = true } = args;
    
    try {
      if (!existsSync(projectPath)) {
        return `❌ Project path does not exist: ${projectPath}`;
      }
      
      const javaFiles = this.findJavaFiles(projectPath);
      
      if (javaFiles.length === 0) {
        return '❌ No Java files found in the project.';
      }
      
      const analysis = await this.analyzeProjectStructure(javaFiles, projectPath);
      
      let result = `## 🏗️ Project Structure Analysis\n\n`;
      result += `**Project Path:** ${projectPath}\n`;
      result += `**Total Java Files:** ${javaFiles.length}\n\n`;
      
      result += '### 📁 Directory Structure\n';
      result += this.generateDirectoryTree(projectPath);
      
      result += '\n### 📦 Package Analysis\n';
      result += this.generatePackageAnalysis(analysis);
      
      if (includeArchitecture) {
        result += '\n### 🏛️ Architecture Analysis\n';
        result += this.generateArchitectureAnalysis(analysis);
      }
      
      if (includeMetrics) {
        result += '\n### 📊 Project Metrics\n';
        result += this.generateProjectMetrics(analysis);
      }
      
      result += '\n### 🎯 Recommendations\n';
      result += this.generateRecommendations(analysis);
      
      return result;
    } catch (error) {
      return `Error analyzing project structure: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async analyzeProjectStructure(javaFiles: string[], projectPath: string): Promise<any> {
    const packages: { [key: string]: any } = {};
    const classes: any[] = [];
    const interfaces: any[] = [];
    const enums: any[] = [];
    const directoryStructure: any = {};
    
    // Analyze directory structure
    this.analyzeDirectoryStructure(projectPath, directoryStructure);
    
    // Analyze Java files
    for (const filePath of javaFiles) {
      const content = readFileSync(filePath, 'utf-8');
      const analysis = this.analyzeJavaFile(content, filePath);
      
      if (analysis.package) {
        if (!packages[analysis.package]) {
          packages[analysis.package] = {
            name: analysis.package,
            classes: [],
            interfaces: [],
            enums: [],
            totalMethods: 0,
            totalFields: 0,
            fileCount: 0,
          };
        }
        
        packages[analysis.package].fileCount++;
        packages[analysis.package].totalMethods += analysis.methods.length;
        packages[analysis.package].totalFields += analysis.fields.length;
        
        if (analysis.type === 'class') {
          packages[analysis.package].classes.push(analysis);
          classes.push(analysis);
        } else if (analysis.type === 'interface') {
          packages[analysis.package].interfaces.push(analysis);
          interfaces.push(analysis);
        } else if (analysis.type === 'enum') {
          packages[analysis.package].enums.push(analysis);
          enums.push(analysis);
        }
      }
    }
    
    return {
      packages,
      classes,
      interfaces,
      enums,
      directoryStructure,
      totalFiles: javaFiles.length,
    };
  }

  private analyzeDirectoryStructure(dir: string, structure: any, depth: number = 0): void {
    if (depth > 5) return; // Limit depth to avoid infinite recursion
    
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          structure[entry.name] = {
            type: 'directory',
            children: {},
            fileCount: 0,
          };
          this.analyzeDirectoryStructure(fullPath, structure[entry.name].children, depth + 1);
        } else if (entry.isFile() && entry.name.endsWith('.java')) {
          structure[entry.name] = {
            type: 'file',
            size: statSync(fullPath).size,
          };
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  private generateDirectoryTree(projectPath: string, maxDepth: number = 3): string {
    let tree = '';
    
    try {
      const entries = readdirSync(projectPath, { withFileTypes: true });
      const filteredEntries = entries.filter(entry => !this.shouldSkipDirectory(entry.name));
      
      filteredEntries.slice(0, 20).forEach((entry, index) => {
        const isLast = index === filteredEntries.length - 1;
        tree += this.generateTreeEntry(entry, projectPath, '', isLast, 0, maxDepth);
      });
      
      if (filteredEntries.length > 20) {
        tree += '... (showing first 20 entries)\n';
      }
    } catch (error) {
      tree += 'Unable to read directory structure\n';
    }
    
    return tree;
  }

  private generateTreeEntry(entry: any, basePath: string, prefix: string, isLast: boolean, depth: number, maxDepth: number): string {
    const connector = isLast ? '└── ' : '├── ';
    const entryName = entry.name;
    const size = entry.isFile() ? ` (${(statSync(join(basePath, entryName)).size / 1024).toFixed(1)}KB)` : '';
    
    let result = `${prefix}${connector}${entryName}${size}\n`;
    
    if (entry.isDirectory() && depth < maxDepth) {
      try {
        const subEntries = readdirSync(join(basePath, entryName), { withFileTypes: true });
        const filteredSubEntries = subEntries.filter(subEntry => !this.shouldSkipDirectory(subEntry.name));
        
        filteredSubEntries.slice(0, 10).forEach((subEntry, index) => {
          const isSubLast = index === filteredSubEntries.length - 1;
          const newPrefix = prefix + (isLast ? '    ' : '│   ');
          result += this.generateTreeEntry(subEntry, join(basePath, entryName), newPrefix, isSubLast, depth + 1, maxDepth);
        });
        
        if (filteredSubEntries.length > 10) {
          result += `${prefix}${isLast ? '    ' : '│   '}... (${filteredSubEntries.length - 10} more entries)\n`;
        }
      } catch (error) {
        // Skip subdirectories that can't be read
      }
    }
    
    return result;
  }

  private generatePackageAnalysis(analysis: any): string {
    const packages = Object.values(analysis.packages);
    let result = '';
    
    if (packages.length === 0) {
      result += 'No packages found (all classes in default package)\n';
      return result;
    }
    
    result += `**Total Packages:** ${packages.length}\n\n`;
    
    // Sort packages by number of classes
    const sortedPackages = packages.sort((a: any, b: any) => b.classes.length - a.classes.length);
    
    sortedPackages.slice(0, 10).forEach((pkg: any) => {
      result += `#### ${pkg.name}\n`;
      result += `- **Files:** ${pkg.fileCount}\n`;
      result += `- **Classes:** ${pkg.classes.length}\n`;
      result += `- **Interfaces:** ${pkg.interfaces.length}\n`;
      result += `- **Enums:** ${pkg.enums.length}\n`;
      result += `- **Methods:** ${pkg.totalMethods}\n`;
      result += `- **Fields:** ${pkg.totalFields}\n\n`;
    });
    
    if (packages.length > 10) {
      result += `... and ${packages.length - 10} more packages\n\n`;
    }
    
    // Package organization analysis
    const packageDepths = packages.map((pkg: any) => pkg.name.split('.').length);
    const avgDepth = packageDepths.reduce((sum, depth) => sum + depth, 0) / packageDepths.length;
    
    result += '### Package Organization\n';
    result += `- **Average package depth:** ${avgDepth.toFixed(1)} levels\n`;
    result += `- **Deepest package:** ${Math.max(...packageDepths)} levels\n`;
    
    if (avgDepth > 4) {
      result += '⚠️ Consider flattening package structure\n';
    } else if (avgDepth < 2) {
      result += '⚠️ Consider adding more package organization\n';
    }
    
    return result;
  }

  private generateArchitectureAnalysis(analysis: any): string {
    let result = '';
    
    // Analyze common architectural patterns
    const patterns = this.detectArchitecturalPatterns(analysis);
    
    result += '### Detected Patterns\n';
    patterns.forEach(pattern => {
      result += `- **${pattern.name}:** ${pattern.description}\n`;
    });
    
    result += '\n### Architecture Metrics\n';
    
    // Calculate architectural metrics
    const totalClasses = analysis.classes.length;
    const totalInterfaces = analysis.interfaces.length;
    const totalEnums = analysis.enums.length;
    
    result += `- **Class/Interface Ratio:** ${(totalClasses / Math.max(totalInterfaces, 1)).toFixed(1)}:1\n`;
    result += `- **Abstraction Level:** ${(totalInterfaces / Math.max(totalClasses + totalInterfaces, 1) * 100).toFixed(1)}%\n`;
    
    // Analyze inheritance patterns
    const inheritanceAnalysis = this.analyzeInheritancePatterns(analysis.classes);
    result += `- **Average inheritance depth:** ${inheritanceAnalysis.avgDepth.toFixed(1)}\n`;
    result += `- **Classes with deep inheritance:** ${inheritanceAnalysis.deepInheritance}\n`;
    
    // Package coupling analysis
    const couplingAnalysis = this.analyzePackageCoupling(analysis.packages);
    result += `- **High coupling packages:** ${couplingAnalysis.highCoupling}\n`;
    
    return result;
  }

  private generateProjectMetrics(analysis: any): string {
    let result = '';
    
    const totalMethods = Object.values(analysis.packages).reduce((sum: number, pkg: any) => sum + pkg.totalMethods, 0);
    const totalFields = Object.values(analysis.packages).reduce((sum: number, pkg: any) => sum + pkg.totalFields, 0);
    const totalClasses = analysis.classes.length;
    
    result += `- **Total Classes:** ${totalClasses}\n`;
    result += `- **Total Interfaces:** ${analysis.interfaces.length}\n`;
    result += `- **Total Enums:** ${analysis.enums.length}\n`;
    result += `- **Total Methods:** ${totalMethods}\n`;
    result += `- **Total Fields:** ${totalFields}\n`;
    result += `- **Average methods per class:** ${(totalMethods / Math.max(totalClasses, 1)).toFixed(1)}\n`;
    result += `- **Average fields per class:** ${(totalFields / Math.max(totalClasses, 1)).toFixed(1)}\n`;
    
    // Complexity metrics
    const complexityMetrics = this.calculateComplexityMetrics(analysis);
    result += `- **Average class complexity:** ${complexityMetrics.avgComplexity.toFixed(1)}\n`;
    result += `- **Most complex classes:** ${complexityMetrics.complexClasses.join(', ')}\n`;
    
    return result;
  }

  private generateRecommendations(analysis: any): string {
    let recommendations = '';
    
    const packages = Object.values(analysis.packages);
    const totalClasses = analysis.classes.length;
    const totalInterfaces = analysis.interfaces.length;
    
    // Package organization recommendations
    if (packages.length === 0) {
      recommendations += '- ⚠️ **Create proper package structure** - All classes are in default package\n';
    } else if (packages.length > 20) {
      recommendations += '- ⚠️ **Consider consolidating packages** - Too many packages may indicate over-engineering\n';
    }
    
    // Interface recommendations
    const interfaceRatio = totalInterfaces / Math.max(totalClasses + totalInterfaces, 1);
    if (interfaceRatio < 0.1) {
      recommendations += '- 💡 **Add more interfaces** - Low abstraction level, consider using interfaces for better design\n';
    }
    
    // Method complexity recommendations
    const avgMethodsPerClass = Object.values(analysis.packages).reduce((sum: number, pkg: any) => sum + pkg.totalMethods, 0) / Math.max(totalClasses, 1);
    if (avgMethodsPerClass > 15) {
      recommendations += '- ⚠️ **Reduce class complexity** - Classes have too many methods, consider splitting\n';
    }
    
    // Package size recommendations
    const largePackages = packages.filter((pkg: any) => pkg.fileCount > 20);
    if (largePackages.length > 0) {
      recommendations += '- ⚠️ **Split large packages** - Some packages have too many classes\n';
    }
    
    // General recommendations
    recommendations += '- 🎯 **Follow naming conventions** - Ensure consistent package and class naming\n';
    recommendations += '- 📁 **Organize by feature** - Consider organizing packages by business functionality\n';
    recommendations += '- 🔄 **Reduce coupling** - Minimize dependencies between packages\n';
    
    return recommendations;
  }

  private detectArchitecturalPatterns(analysis: any): any[] {
    const patterns: any[] = [];
    
    // Check for common patterns based on class and interface analysis
    const hasControllers = analysis.classes.some((cls: any) => cls.className.toLowerCase().includes('controller'));
    const hasServices = analysis.classes.some((cls: any) => cls.className.toLowerCase().includes('service'));
    const hasRepositories = analysis.classes.some((cls: any) => cls.className.toLowerCase().includes('repository'));
    
    if (hasControllers && hasServices && hasRepositories) {
      patterns.push({
        name: 'MVC/Service Layer Pattern',
        description: 'Detected Controller-Service-Repository pattern',
      });
    }
    
    const hasFactories = analysis.classes.some((cls: any) => cls.className.toLowerCase().includes('factory'));
    if (hasFactories) {
      patterns.push({
        name: 'Factory Pattern',
        description: 'Factory classes detected',
      });
    }
    
    const hasBuilders = analysis.classes.some((cls: any) => cls.className.toLowerCase().includes('builder'));
    if (hasBuilders) {
      patterns.push({
        name: 'Builder Pattern',
        description: 'Builder classes detected',
      });
    }
    
    return patterns;
  }

  private analyzeInheritancePatterns(classes: any[]): any {
    // Simplified inheritance analysis
    const inheritanceDepths: number[] = [];
    let deepInheritance = 0;
    
    classes.forEach(cls => {
      // This is a simplified analysis - in a real implementation, you'd parse the extends clause
      const depth = 1; // Default depth
      inheritanceDepths.push(depth);
      
      if (depth > 3) {
        deepInheritance++;
      }
    });
    
    const avgDepth = inheritanceDepths.reduce((sum, depth) => sum + depth, 0) / inheritanceDepths.length;
    
    return {
      avgDepth,
      deepInheritance,
    };
  }

  private analyzePackageCoupling(packages: any): any {
    // Simplified coupling analysis
    const highCoupling = Object.values(packages).filter((pkg: any) => pkg.fileCount > 15).length;
    
    return {
      highCoupling,
    };
  }

  private calculateComplexityMetrics(analysis: any): any {
    // Simplified complexity calculation
    const complexities: number[] = [];
    const complexClasses: string[] = [];
    
    Object.values(analysis.packages).forEach((pkg: any) => {
      pkg.classes.forEach((cls: any) => {
        const complexity = cls.methods.length + cls.fields.length;
        complexities.push(complexity);
        
        if (complexity > 20) {
          complexClasses.push(cls.className);
        }
      });
    });
    
    const avgComplexity = complexities.reduce((sum, comp) => sum + comp, 0) / complexities.length;
    
    return {
      avgComplexity,
      complexClasses: complexClasses.slice(0, 5), // Top 5 most complex
    };
  }

  private analyzeJavaFile(content: string, filePath: string): any {
    const lines = content.split('\n');
    let packageName = '';
    let className = '';
    let type = 'class';
    const methods: any[] = [];
    const fields: any[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Extract package
      if (trimmed.startsWith('package ')) {
        packageName = trimmed.replace('package ', '').replace(';', '').trim();
      }
      
      // Extract class/interface/enum
      if (trimmed.includes('class ') || trimmed.includes('interface ') || trimmed.includes('enum ')) {
        if (trimmed.includes('interface ')) {
          type = 'interface';
          const match = trimmed.match(/interface\s+(\w+)/);
          if (match) className = match[1];
        } else if (trimmed.includes('enum ')) {
          type = 'enum';
          const match = trimmed.match(/enum\s+(\w+)/);
          if (match) className = match[1];
        } else {
          type = 'class';
          const match = trimmed.match(/class\s+(\w+)/);
          if (match) className = match[1];
        }
      }
      
      // Extract methods
      if (trimmed.includes('(') && trimmed.includes(')') && 
          (trimmed.includes('public ') || trimmed.includes('private ') || trimmed.includes('protected '))) {
        const methodMatch = trimmed.match(/(public|private|protected)\s+([\w<>\[\]]+)\s+(\w+)\s*\(/);
        if (methodMatch) {
          methods.push({
            visibility: methodMatch[1],
            returnType: methodMatch[2],
            name: methodMatch[3],
          });
        }
      }
      
      // Extract fields
      if (trimmed.includes(';') && !trimmed.includes('(') && 
          (trimmed.includes('public ') || trimmed.includes('private ') || trimmed.includes('protected '))) {
        const fieldMatch = trimmed.match(/(public|private|protected)\s+([\w<>\[\]]+)\s+(\w+)\s*[=;]/);
        if (fieldMatch) {
          fields.push({
            visibility: fieldMatch[1],
            type: fieldMatch[2],
            name: fieldMatch[3],
          });
        }
      }
    }
    
    return {
      package: packageName,
      className,
      type,
      methods,
      fields,
      filePath,
    };
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
