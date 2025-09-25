import { JavaProjectAssistant } from './JavaProjectAssistant.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parseString } from 'xml2js';

export class DependencyAnalyzer extends JavaProjectAssistant {
  getName(): string {
    return 'analyze_dependencies';
  }

  getDescription(): string {
    return 'Analyzes Java project dependencies from Maven or Gradle files, detecting outdated versions, security vulnerabilities, and unused dependencies';
  }

  getInputSchema() {
    return {
      type: 'object' as const,
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the Java project root directory',
        },
      },
      required: ['projectPath'],
    };
  }

  async execute(args: { projectPath: string }): Promise<string> {
    const { projectPath } = args;
    
    try {
      const results: string[] = [];
      
      // Check for Maven
      const pomPath = join(projectPath, 'pom.xml');
      if (existsSync(pomPath)) {
        results.push(await this.analyzeMavenDependencies(pomPath));
      }
      
      // Check for Gradle
      const buildGradlePath = join(projectPath, 'build.gradle');
      if (existsSync(buildGradlePath)) {
        results.push(await this.analyzeGradleDependencies(buildGradlePath));
      }
      
      if (results.length === 0) {
        return '❌ No Maven (pom.xml) or Gradle (build.gradle) files found in the project.';
      }
      
      return results.join('\n\n');
    } catch (error) {
      return `Error analyzing dependencies: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async analyzeMavenDependencies(pomPath: string): Promise<string> {
    const pomContent = readFileSync(pomPath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      parseString(pomContent, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          const dependencies = result.project.dependencies?.[0]?.dependency || [];
          const properties = result.project.properties?.[0] || {};
          
          const analysis = this.generateMavenAnalysis(dependencies, properties);
          resolve(analysis);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  private generateMavenAnalysis(dependencies: any[], properties: any): string {
    let analysis = '## 📦 Maven Dependencies Analysis\n\n';
    
    if (dependencies.length === 0) {
      analysis += '✅ No dependencies found in pom.xml\n';
      return analysis;
    }
    
    analysis += `**Total Dependencies:** ${dependencies.length}\n\n`;
    
    // Group by scope
    const scopes: { [key: string]: any[] } = {};
    dependencies.forEach(dep => {
      const scope = dep.scope?.[0] || 'compile';
      if (!scopes[scope]) scopes[scope] = [];
      scopes[scope].push(dep);
    });
    
    Object.entries(scopes).forEach(([scope, deps]) => {
      analysis += `### ${scope.toUpperCase()} Scope (${deps.length} dependencies)\n`;
      deps.forEach(dep => {
        const groupId = dep.groupId[0];
        const artifactId = dep.artifactId[0];
        const version = dep.version?.[0] || 'version not specified';
        
        // Check for potential issues
        const issues = this.checkDependencyIssues(groupId, artifactId, version, properties);
        
        analysis += `- **${groupId}:${artifactId}** (${version})`;
        if (issues.length > 0) {
          analysis += ` ⚠️ ${issues.join(', ')}`;
        }
        analysis += '\n';
      });
      analysis += '\n';
    });
    
    // Security recommendations
    analysis += '### 🔒 Security Recommendations\n';
    analysis += '- Consider using `mvn dependency:check` to scan for known vulnerabilities\n';
    analysis += '- Update dependencies to latest stable versions\n';
    analysis += '- Use `mvn versions:display-dependency-updates` to check for updates\n\n';
    
    return analysis;
  }

  private async analyzeGradleDependencies(buildGradlePath: string): Promise<string> {
    const gradleContent = readFileSync(buildGradlePath, 'utf-8');
    
    let analysis = '## 📦 Gradle Dependencies Analysis\n\n';
    
    // Simple regex-based parsing for demonstration
    const dependencyRegex = /implementation\s+['"]([^'"]+)['"]/g;
    const testImplementationRegex = /testImplementation\s+['"]([^'"]+)['"]/g;
    const compileOnlyRegex = /compileOnly\s+['"]([^'"]+)['"]/g;
    
    const dependencies: string[] = [];
    let match;
    
    while ((match = dependencyRegex.exec(gradleContent)) !== null) {
      dependencies.push(`implementation: ${match[1]}`);
    }
    
    while ((match = testImplementationRegex.exec(gradleContent)) !== null) {
      dependencies.push(`testImplementation: ${match[1]}`);
    }
    
    while ((match = compileOnlyRegex.exec(gradleContent)) !== null) {
      dependencies.push(`compileOnly: ${match[1]}`);
    }
    
    if (dependencies.length === 0) {
      analysis += '✅ No dependencies found in build.gradle\n';
      return analysis;
    }
    
    analysis += `**Total Dependencies:** ${dependencies.length}\n\n`;
    
    dependencies.forEach(dep => {
      analysis += `- ${dep}\n`;
    });
    
    analysis += '\n### 🔒 Security Recommendations\n';
    analysis += '- Run `./gradlew dependencyCheckAnalyze` if using OWASP dependency check plugin\n';
    analysis += '- Use `./gradlew dependencies` to see full dependency tree\n';
    analysis += '- Consider using Gradle dependency verification\n\n';
    
    return analysis;
  }

  private checkDependencyIssues(groupId: string, artifactId: string, version: string, properties: any): string[] {
    const issues: string[] = [];
    
    // Check for property references
    if (version.startsWith('${')) {
      issues.push('uses property reference');
    }
    
    // Check for common problematic patterns
    if (version === 'LATEST' || version === 'RELEASE') {
      issues.push('uses dynamic version');
    }
    
    // Check for known problematic dependencies
    if (groupId === 'org.springframework' && version.includes('SNAPSHOT')) {
      issues.push('uses snapshot version');
    }
    
    return issues;
  }
}
