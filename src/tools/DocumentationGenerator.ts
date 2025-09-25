import { JavaProjectAssistant } from './JavaProjectAssistant.js';
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

export class DocumentationGenerator extends JavaProjectAssistant {
  getName(): string {
    return 'generate_documentation';
  }

  getDescription(): string {
    return 'Generates comprehensive documentation for Java projects including Javadoc, API documentation, and project structure overview';
  }

  getInputSchema() {
    return {
      type: 'object' as const,
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the Java project root directory',
        },
        outputPath: {
          type: 'string',
          description: 'Path where to save the generated documentation (optional, defaults to projectPath/docs)',
        },
        documentationType: {
          type: 'string',
          enum: ['javadoc', 'api', 'overview', 'all'],
          description: 'Type of documentation to generate',
          default: 'all',
        },
        includePrivate: {
          type: 'boolean',
          description: 'Include private methods in documentation',
          default: false,
        },
      },
      required: ['projectPath'],
    };
  }

  async execute(args: { 
    projectPath: string; 
    outputPath?: string; 
    documentationType?: string; 
    includePrivate?: boolean 
  }): Promise<string> {
    const { projectPath, outputPath, documentationType = 'all', includePrivate = false } = args;
    
    try {
      const javaFiles = this.findJavaFiles(projectPath);
      
      if (javaFiles.length === 0) {
        return '❌ No Java files found in the project.';
      }
      
      const outputDir = outputPath || join(projectPath, 'docs');
      
      let result = `## 📚 Documentation Generation\n\n`;
      result += `**Project:** ${projectPath}\n`;
      result += `**Output Directory:** ${outputDir}\n`;
      result += `**Java Files:** ${javaFiles.length}\n\n`;
      
      const analysis = await this.analyzeProject(javaFiles);
      
      if (documentationType === 'all' || documentationType === 'overview') {
        const overviewDoc = this.generateProjectOverview(analysis);
        this.saveDocumentation(outputDir, 'project-overview.md', overviewDoc);
        result += '✅ Generated project overview documentation\n';
      }
      
      if (documentationType === 'all' || documentationType === 'api') {
        const apiDoc = this.generateAPIDocumentation(analysis, includePrivate);
        this.saveDocumentation(outputDir, 'api-documentation.md', apiDoc);
        result += '✅ Generated API documentation\n';
      }
      
      if (documentationType === 'all' || documentationType === 'javadoc') {
        const javadocSuggestions = this.generateJavadocSuggestions(analysis);
        this.saveDocumentation(outputDir, 'javadoc-suggestions.md', javadocSuggestions);
        result += '✅ Generated Javadoc suggestions\n';
      }
      
      result += '\n### 📁 Generated Files\n';
      result += `- \`${outputDir}/project-overview.md\` - Project structure and overview\n`;
      result += `- \`${outputDir}/api-documentation.md\` - API documentation\n`;
      result += `- \`${outputDir}/javadoc-suggestions.md\` - Javadoc improvement suggestions\n\n`;
      
      result += '### 🚀 Next Steps\n';
      result += '1. Review the generated documentation\n';
      result += '2. Add Javadoc comments to classes and methods\n';
      result += '3. Run `javadoc` command to generate HTML documentation\n';
      result += '4. Consider using tools like JavaDoc Maven plugin for automated generation\n';
      
      return result;
    } catch (error) {
      return `Error generating documentation: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async analyzeProject(javaFiles: string[]): Promise<any> {
    const packages: { [key: string]: any } = {};
    const classes: any[] = [];
    const interfaces: any[] = [];
    const enums: any[] = [];
    
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
            methods: 0,
          };
        }
        
        packages[analysis.package].classes.push(analysis);
        packages[analysis.package].methods += analysis.methods.length;
      }
      
      if (analysis.type === 'class') {
        classes.push(analysis);
      } else if (analysis.type === 'interface') {
        interfaces.push(analysis);
      } else if (analysis.type === 'enum') {
        enums.push(analysis);
      }
    }
    
    return {
      packages,
      classes,
      interfaces,
      enums,
      totalFiles: javaFiles.length,
    };
  }

  private analyzeJavaFile(content: string, filePath: string): any {
    const lines = content.split('\n');
    let packageName = '';
    let className = '';
    let type = 'class';
    const imports: string[] = [];
    const methods: any[] = [];
    const fields: any[] = [];
    let javadoc = '';
    let currentJavadoc = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Extract package
      if (line.startsWith('package ')) {
        packageName = line.replace('package ', '').replace(';', '').trim();
      }
      
      // Extract imports
      if (line.startsWith('import ')) {
        imports.push(line.replace('import ', '').replace(';', '').trim());
      }
      
      // Extract class/interface/enum
      if (line.includes('class ') || line.includes('interface ') || line.includes('enum ')) {
        if (line.includes('interface ')) {
          type = 'interface';
          const match = line.match(/interface\s+(\w+)/);
          if (match) className = match[1];
        } else if (line.includes('enum ')) {
          type = 'enum';
          const match = line.match(/enum\s+(\w+)/);
          if (match) className = match[1];
        } else {
          type = 'class';
          const match = line.match(/class\s+(\w+)/);
          if (match) className = match[1];
        }
        javadoc = currentJavadoc;
        currentJavadoc = '';
      }
      
      // Extract methods
      if (line.includes('(') && line.includes(')') && 
          (line.includes('public ') || line.includes('private ') || line.includes('protected '))) {
        const method = this.extractMethod(line, currentJavadoc);
        if (method) {
          methods.push(method);
          currentJavadoc = '';
        }
      }
      
      // Extract fields
      if (line.includes(';') && !line.includes('(') && 
          (line.includes('public ') || line.includes('private ') || line.includes('protected '))) {
        const field = this.extractField(line, currentJavadoc);
        if (field) {
          fields.push(field);
          currentJavadoc = '';
        }
      }
      
      // Collect Javadoc comments
      if (line.startsWith('/**') || line.startsWith('*') || line.includes('*/')) {
        currentJavadoc += line + '\n';
      } else if (!line.startsWith('//') && line !== '') {
        currentJavadoc = '';
      }
    }
    
    return {
      package: packageName,
      className,
      type,
      imports,
      methods,
      fields,
      javadoc,
      filePath,
    };
  }

  private extractMethod(line: string, javadoc: string): any {
    const methodMatch = line.match(/(public|private|protected)\s+([\w<>\[\]]+)\s+(\w+)\s*\(/);
    if (methodMatch) {
      return {
        visibility: methodMatch[1],
        returnType: methodMatch[2],
        name: methodMatch[3],
        javadoc: javadoc.trim(),
      };
    }
    return null;
  }

  private extractField(line: string, javadoc: string): any {
    const fieldMatch = line.match(/(public|private|protected)\s+([\w<>\[\]]+)\s+(\w+)\s*[=;]/);
    if (fieldMatch) {
      return {
        visibility: fieldMatch[1],
        type: fieldMatch[2],
        name: fieldMatch[3],
        javadoc: javadoc.trim(),
      };
    }
    return null;
  }

  private generateProjectOverview(analysis: any): string {
    let doc = '# Project Overview\n\n';
    
    doc += `**Total Files:** ${analysis.totalFiles}\n`;
    doc += `**Classes:** ${analysis.classes.length}\n`;
    doc += `**Interfaces:** ${analysis.interfaces.length}\n`;
    doc += `**Enums:** ${analysis.enums.length}\n\n`;
    
    doc += '## Package Structure\n\n';
    Object.entries(analysis.packages).forEach(([packageName, pkg]: [string, any]) => {
      doc += `### ${packageName}\n`;
      doc += `- **Classes:** ${pkg.classes.length}\n`;
      doc += `- **Methods:** ${pkg.methods}\n\n`;
      
      pkg.classes.forEach((cls: any) => {
        doc += `- **${cls.className}** (${cls.type})\n`;
      });
      doc += '\n';
    });
    
    doc += '## Architecture Overview\n\n';
    doc += 'This section provides a high-level view of the project structure:\n\n';
    
    // Generate architecture insights
    const totalMethods = Object.values(analysis.packages).reduce((sum: number, pkg: any) => sum + pkg.methods, 0);
    const avgMethodsPerClass = totalMethods / analysis.classes.length;
    
    doc += `- **Average methods per class:** ${avgMethodsPerClass.toFixed(1)}\n`;
    doc += `- **Package distribution:** ${Object.keys(analysis.packages).length} packages\n`;
    
    if (analysis.interfaces.length > 0) {
      doc += `- **Interface usage:** ${(analysis.interfaces.length / analysis.classes.length * 100).toFixed(1)}% of classes are interfaces\n`;
    }
    
    return doc;
  }

  private generateAPIDocumentation(analysis: any, includePrivate: boolean): string {
    let doc = '# API Documentation\n\n';
    
    Object.entries(analysis.packages).forEach(([packageName, pkg]: [string, any]) => {
      doc += `## Package: ${packageName}\n\n`;
      
      pkg.classes.forEach((cls: any) => {
        doc += `### ${cls.className} (${cls.type})\n\n`;
        
        if (cls.javadoc) {
          doc += '**Description:**\n';
          doc += cls.javadoc + '\n\n';
        }
        
        // Public fields
        const publicFields = cls.fields.filter((f: any) => f.visibility === 'public');
        if (publicFields.length > 0) {
          doc += '#### Public Fields\n\n';
          publicFields.forEach((field: any) => {
            doc += `- **${field.name}** (${field.type})\n`;
            if (field.javadoc) {
              doc += `  ${field.javadoc}\n`;
            }
          });
          doc += '\n';
        }
        
        // Methods
        const visibleMethods = includePrivate 
          ? cls.methods 
          : cls.methods.filter((m: any) => m.visibility === 'public');
          
        if (visibleMethods.length > 0) {
          doc += '#### Methods\n\n';
          visibleMethods.forEach((method: any) => {
            doc += `- **${method.name}()** → ${method.returnType}\n`;
            if (method.javadoc) {
              doc += `  ${method.javadoc}\n`;
            }
          });
          doc += '\n';
        }
      });
    });
    
    return doc;
  }

  private generateJavadocSuggestions(analysis: any): string {
    let doc = '# Javadoc Improvement Suggestions\n\n';
    
    let totalMethods = 0;
    let methodsWithoutJavadoc = 0;
    let totalClasses = 0;
    let classesWithoutJavadoc = 0;
    
    Object.values(analysis.packages).forEach((pkg: any) => {
      pkg.classes.forEach((cls: any) => {
        totalClasses++;
        if (!cls.javadoc || cls.javadoc.trim() === '') {
          classesWithoutJavadoc++;
        }
        
        cls.methods.forEach((method: any) => {
          totalMethods++;
          if (!method.javadoc || method.javadoc.trim() === '') {
            methodsWithoutJavadoc++;
          }
        });
      });
    });
    
    doc += '## Documentation Coverage\n\n';
    doc += `- **Classes with Javadoc:** ${totalClasses - classesWithoutJavadoc}/${totalClasses} (${((totalClasses - classesWithoutJavadoc) / totalClasses * 100).toFixed(1)}%)\n`;
    doc += `- **Methods with Javadoc:** ${totalMethods - methodsWithoutJavadoc}/${totalMethods} (${((totalMethods - methodsWithoutJavadoc) / totalMethods * 100).toFixed(1)}%)\n\n`;
    
    doc += '## Suggested Javadoc Additions\n\n';
    
    Object.entries(analysis.packages).forEach(([packageName, pkg]: [string, any]) => {
      const classesNeedingDoc = pkg.classes.filter((cls: any) => !cls.javadoc || cls.javadoc.trim() === '');
      
      if (classesNeedingDoc.length > 0) {
        doc += `### Package: ${packageName}\n\n`;
        
        classesNeedingDoc.forEach((cls: any) => {
          doc += `#### ${cls.className}\n\n`;
          doc += '**Suggested Javadoc:**\n';
          doc += '```java\n';
          doc += '/**\n';
          doc += ` * Description of ${cls.className}.\n`;
          doc += ` * \n`;
          doc += ` * @author TODO: Add author name\n`;
          doc += ` * @since TODO: Add version or date\n`;
          doc += ` */\n`;
          doc += '```\n\n';
          
          const methodsNeedingDoc = cls.methods.filter((m: any) => !m.javadoc || m.javadoc.trim() === '');
          if (methodsNeedingDoc.length > 0) {
            doc += '**Methods needing Javadoc:**\n';
            methodsNeedingDoc.forEach((method: any) => {
              doc += `- ${method.name}()\n`;
            });
            doc += '\n';
          }
        });
      }
    });
    
    doc += '## Javadoc Best Practices\n\n';
    doc += '1. **Class-level documentation:** Include purpose, usage examples, and key features\n';
    doc += '2. **Method documentation:** Describe parameters, return values, and exceptions\n';
    doc += '3. **Parameter documentation:** Use @param for each parameter\n';
    doc += '4. **Return documentation:** Use @return to describe return values\n';
    doc += '5. **Exception documentation:** Use @throws for checked exceptions\n';
    doc += '6. **Author and version:** Include @author and @since tags\n\n';
    
    return doc;
  }

  private saveDocumentation(outputDir: string, filename: string, content: string): void {
    if (!existsSync(outputDir)) {
      require('fs').mkdirSync(outputDir, { recursive: true });
    }
    
    const filePath = join(outputDir, filename);
    writeFileSync(filePath, content, 'utf-8');
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
