/**
 * Sea-lion MCP Server Implementation
 *
 * This class implements the main MCP server functionality for Sea-lion APIs.
 * It provides tools for text generation, translation, and cultural analysis
 * using Sea-lion's Southeast Asian language models.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SeaLionClient } from './services/sealionClient.js';
import { createTextGenerationTool } from './tools/textGeneration.js';
import { createTranslationTool } from './tools/translation.js';
import { createCulturalAnalysisTool } from './tools/culturalAnalysis.js';
import { logger } from './utils/logger.js';
import { RateLimiter } from './utils/rateLimiter.js';
export class SeaLionMCPServer {
    server;
    sealionClient;
    rateLimiter;
    tools;
    constructor() {
        // Initialize the MCP server with metadata
        this.server = new Server({
            name: 'sealion-mcp-server',
            version: '1.0.0',
            description: 'MCP server providing access to Sea-lion Southeast Asian language models'
        }, {
            capabilities: {
                tools: {}
            }
        });
        // Initialize services
        this.sealionClient = new SeaLionClient();
        this.rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute
        this.tools = new Map();
        this.setupTools();
        this.setupHandlers();
    }
    /**
     * Set up available tools for the MCP server
     */
    setupTools() {
        const tools = [
            createTextGenerationTool(),
            createTranslationTool(),
            createCulturalAnalysisTool()
        ];
        for (const tool of tools) {
            this.tools.set(tool.name, tool);
        }
        logger.info(`Registered ${this.tools.size} tools:`, Array.from(this.tools.keys()));
    }
    /**
     * Set up MCP protocol handlers
     */
    setupHandlers() {
        // Handle tool listing requests
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const toolList = Array.from(this.tools.values()).map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
            }));
            logger.debug('Listing tools:', toolList.map(t => t.name));
            return { tools: toolList };
        });
        // Handle tool execution requests
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            logger.info(`Executing tool: ${name}`);
            // Check rate limiting
            if (!this.rateLimiter.allowRequest()) {
                throw new McpError(ErrorCode.InternalError, 'Rate limit exceeded. Please wait before making another request.');
            }
            // Find the requested tool
            const tool = this.tools.get(name);
            if (!tool) {
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }
            try {
                // Validate input arguments
                const validatedArgs = tool.inputSchema.parse(args);
                // Execute the tool
                const result = await tool.handler(validatedArgs, this.sealionClient);
                logger.info(`Tool ${name} executed successfully`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            catch (error) {
                logger.error(`Error executing tool ${name}:`, error);
                if (error instanceof z.ZodError) {
                    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
                }
                if (error instanceof McpError) {
                    throw error;
                }
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * Start the MCP server
     */
    async start() {
        try {
            // Test Sea-lion API connection if API key is available
            try {
                await this.sealionClient.testConnection();
                logger.info('Sea-lion API connection verified');
            }
            catch (apiError) {
                logger.warn('Sea-lion API connection failed - server will start but tools may not work without valid API key:', apiError);
            }
            // Create stdio transport for local development
            const transport = new StdioServerTransport();
            // Connect the server to the transport
            await this.server.connect(transport);
            logger.info('Sea-lion MCP Server is running and ready to accept connections');
        }
        catch (error) {
            logger.error('Failed to start server:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=server.js.map