#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { JavaProjectAssistant } from './tools/JavaProjectAssistant.js';
import { DependencyAnalyzer } from './tools/DependencyAnalyzer.js';
import { TestGenerator } from './tools/TestGenerator.js';
import { CodeQualityChecker } from './tools/CodeQualityChecker.js';
import { DocumentationGenerator } from './tools/DocumentationGenerator.js';
import { ProjectStructureAnalyzer } from './tools/ProjectStructureAnalyzer.js';

class JavaProjectAssistantMCPServer {
  private server: Server;
  private tools: JavaProjectAssistant[];

  constructor() {
    this.server = new Server(
      {
        name: 'java-project-assistant',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize tools
    this.tools = [
      new DependencyAnalyzer(),
      new TestGenerator(),
      new CodeQualityChecker(),
      new DocumentationGenerator(),
      new ProjectStructureAnalyzer(),
    ];

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = this.tools.map(tool => ({
        name: tool.getName(),
        description: tool.getDescription(),
        inputSchema: tool.getInputSchema(),
      }));

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = this.tools.find(t => t.getName() === name);
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      try {
        const result = await tool.execute(args);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Java Project Assistant MCP Server running on stdio');
  }
}

const server = new JavaProjectAssistantMCPServer();
server.run().catch(console.error);
