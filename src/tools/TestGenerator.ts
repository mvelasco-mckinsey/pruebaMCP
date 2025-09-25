import { JavaProjectAssistant } from './JavaProjectAssistant.js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

export class TestGenerator extends JavaProjectAssistant {
  getName(): string {
    return 'generate_tests';
  }

  getDescription(): string {
    return 'Generates unit test templates for Java classes based on existing code structure and dependencies';
  }

  getInputSchema() {
    return {
      type: 'object' as const,
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the Java project root directory',
        },
        className: {
          type: 'string',
          description: 'Name of the class to generate tests for (optional, if not provided will analyze all classes)',
        },
        testFramework: {
          type: 'string',
          enum: ['junit5', 'junit4', 'testng'],
          description: 'Testing framework to use',
          default: 'junit5',
        },
      },
      required: ['projectPath'],
    };
  }

  async execute(args: { projectPath: string; className?: string; testFramework?: string }): Promise<string> {
    const { projectPath, className, testFramework = 'junit5' } = args;
    
    try {
      const javaFiles = this.findJavaFiles(projectPath);
      
      if (javaFiles.length === 0) {
        return '❌ No Java files found in the project.';
      }
      
      if (className) {
        const targetFile = javaFiles.find(file => 
          file.toLowerCase().includes(className.toLowerCase())
        );
        if (targetFile) {
          return await this.generateTestForClass(targetFile, testFramework);
        } else {
          return `❌ Class "${className}" not found in the project.`;
        }
      } else {
        return await this.generateTestsForAllClasses(javaFiles, testFramework);
      }
    } catch (error) {
      return `Error generating tests: ${error instanceof Error ? error.message : String(error)}`;
    }
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
    const skipDirs = ['target', 'build', 'node_modules', '.git', '.idea', 'out'];
    return skipDirs.includes(dirName);
  }

  private async generateTestForClass(filePath: string, testFramework: string): Promise<string> {
    const content = readFileSync(filePath, 'utf-8');
    const analysis = this.analyzeJavaClass(content);
    
    let result = `## 🧪 Test Generation for ${analysis.className}\n\n`;
    result += `**File:** \`${filePath}\`\n`;
    result += `**Framework:** ${testFramework.toUpperCase()}\n\n`;
    
    result += '### 📋 Class Analysis\n';
    result += `- **Package:** ${analysis.package || 'default'}\n`;
    result += `- **Public Methods:** ${analysis.publicMethods.length}\n`;
    result += `- **Dependencies:** ${analysis.dependencies.length}\n\n`;
    
    result += '### 🧪 Generated Test Template\n\n';
    result += '```java\n';
    result += this.generateTestCode(analysis, testFramework);
    result += '\n```\n\n';
    
    result += '### 📝 Test Recommendations\n';
    result += this.generateTestRecommendations(analysis);
    
    return result;
  }

  private async generateTestsForAllClasses(javaFiles: string[], testFramework: string): Promise<string> {
    let result = `## 🧪 Test Generation Analysis\n\n`;
    result += `**Framework:** ${testFramework.toUpperCase()}\n`;
    result += `**Classes Found:** ${javaFiles.length}\n\n`;
    
    const classesWithTests: string[] = [];
    const classesWithoutTests: string[] = [];
    
    for (const filePath of javaFiles) {
      const content = readFileSync(filePath, 'utf-8');
      const analysis = this.analyzeJavaClass(content);
      
      const testPath = this.getTestFilePath(filePath);
      if (existsSync(testPath)) {
        classesWithTests.push(analysis.className);
      } else {
        classesWithoutTests.push(analysis.className);
      }
    }
    
    result += '### 📊 Test Coverage Summary\n';
    result += `- **Classes with tests:** ${classesWithTests.length}\n`;
    result += `- **Classes without tests:** ${classesWithoutTests.length}\n\n`;
    
    if (classesWithoutTests.length > 0) {
      result += '### 🚨 Classes Missing Tests\n';
      classesWithoutTests.forEach(className => {
        result += `- ${className}\n`;
      });
      result += '\n';
    }
    
    result += '### 🛠️ Next Steps\n';
    result += '1. Use the `generate_tests` tool with a specific class name to generate detailed test templates\n';
    result += '2. Consider adding tests for the classes listed above\n';
    result += '3. Run existing tests to ensure they pass\n\n';
    
    return result;
  }

  private analyzeJavaClass(content: string): any {
    const lines = content.split('\n');
    let packageName = '';
    let className = '';
    const publicMethods: string[] = [];
    const dependencies: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Extract package
      if (trimmed.startsWith('package ')) {
        packageName = trimmed.replace('package ', '').replace(';', '').trim();
      }
      
      // Extract class name
      if (trimmed.includes('class ') && !className) {
        const match = trimmed.match(/class\s+(\w+)/);
        if (match) className = match[1];
      }
      
      // Extract public methods
      if (trimmed.includes('public ') && trimmed.includes('(') && !trimmed.includes('class')) {
        const methodMatch = trimmed.match(/public\s+[\w<>\[\]]+\s+(\w+)\s*\(/);
        if (methodMatch) {
          publicMethods.push(methodMatch[1]);
        }
      }
      
      // Extract imports (dependencies)
      if (trimmed.startsWith('import ')) {
        const importMatch = trimmed.match(/import\s+([^;]+)/);
        if (importMatch) {
          dependencies.push(importMatch[1]);
        }
      }
    }
    
    return { packageName, className, publicMethods, dependencies };
  }

  private generateTestCode(analysis: any, testFramework: string): string {
    const packageName = analysis.packageName;
    const className = analysis.className;
    
    let testCode = '';
    
    if (packageName) {
      testCode += `package ${packageName};\n\n`;
    }
    
    // Add imports based on framework
    if (testFramework === 'junit5') {
      testCode += `import org.junit.jupiter.api.Test;\n`;
      testCode += `import org.junit.jupiter.api.BeforeEach;\n`;
      testCode += `import org.junit.jupiter.api.DisplayName;\n`;
      testCode += `import static org.junit.jupiter.api.Assertions.*;\n\n`;
    } else if (testFramework === 'junit4') {
      testCode += `import org.junit.Test;\n`;
      testCode += `import org.junit.Before;\n`;
      testCode += `import static org.junit.Assert.*;\n\n`;
    } else if (testFramework === 'testng') {
      testCode += `import org.testng.annotations.Test;\n`;
      testCode += `import org.testng.annotations.BeforeMethod;\n`;
      testCode += `import static org.testng.Assert.*;\n\n`;
    }
    
    testCode += `public class ${className}Test {\n\n`;
    
    // Add setup method
    if (testFramework === 'junit5') {
      testCode += `    @BeforeEach\n`;
      testCode += `    void setUp() {\n`;
      testCode += `        // Setup code here\n`;
      testCode += `    }\n\n`;
    } else if (testFramework === 'junit4') {
      testCode += `    @Before\n`;
      testCode += `    public void setUp() {\n`;
      testCode += `        // Setup code here\n`;
      testCode += `    }\n\n`;
    } else if (testFramework === 'testng') {
      testCode += `    @BeforeMethod\n`;
      testCode += `    public void setUp() {\n`;
      testCode += `        // Setup code here\n`;
      testCode += `    }\n\n`;
    }
    
    // Generate test methods for public methods
        analysis.publicMethods.forEach((method: string) => {
      if (testFramework === 'junit5') {
        testCode += `    @Test\n`;
        testCode += `    @DisplayName("Should test ${method} method")\n`;
        testCode += `    void test${this.capitalize(method)}() {\n`;
        testCode += `        // Given\n`;
        testCode += `        // When\n`;
        testCode += `        // Then\n`;
        testCode += `        // TODO: Implement test logic\n`;
        testCode += `        assertTrue(true, "Test not implemented yet");\n`;
        testCode += `    }\n\n`;
      } else {
        testCode += `    @Test\n`;
        testCode += `    public void test${this.capitalize(method)}() {\n`;
        testCode += `        // Given\n`;
        testCode += `        // When\n`;
        testCode += `        // Then\n`;
        testCode += `        // TODO: Implement test logic\n`;
        testCode += `        assertTrue(true);\n`;
        testCode += `    }\n\n`;
      }
    });
    
    testCode += '}';
    
    return testCode;
  }

  private generateTestRecommendations(analysis: any): string {
    let recommendations = '';
    
    recommendations += `- **${analysis.publicMethods.length} public methods** need test coverage\n`;
    
    if (analysis.dependencies.length > 5) {
      recommendations += '- Consider using **mocking frameworks** (Mockito, EasyMock) for complex dependencies\n';
    }
    
    recommendations += '- Add **edge case testing** for boundary conditions\n';
    recommendations += '- Include **exception testing** for error scenarios\n';
    recommendations += '- Consider **parameterized tests** for methods with multiple inputs\n';
    
    return recommendations;
  }

  private getTestFilePath(originalPath: string): string {
    const pathParts = originalPath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const testFileName = fileName.replace('.java', 'Test.java');
    
    // Try common test directory patterns
    const possiblePaths = [
      originalPath.replace('/src/main/java/', '/src/test/java/').replace(fileName, testFileName),
      originalPath.replace('/src/', '/test/').replace(fileName, testFileName),
      originalPath.replace('.java', 'Test.java'),
    ];
    
    return possiblePaths[0]; // Return the first possible path
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
