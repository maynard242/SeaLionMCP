/**
 * Sea-lionMCP Server Implementation
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
            name: 'sea-lionmcp',
            version: '1.0.0',
            description: 'Sea-lionMCP: MCP server providing access to Sea-lion Southeast Asian language models'
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
                inputSchema: this.convertZodToJsonSchema(tool.inputSchema)
            }));
            logger.debug('Listing tools:', toolList.map(t => t.name));
            return { tools: toolList };
        });
        // Handle tool execution requests
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            logger.info(`Executing tool: ${name}`);
            // Check rate limiting first
            if (!this.rateLimiter.allowRequest()) {
                throw new McpError(ErrorCode.InternalError, 'Rate limit exceeded. Please wait before making another request.');
            }
            // Validate tool name exists
            const tool = this.tools.get(name);
            if (!tool) {
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }
            // Validate arguments are provided
            if (!args || typeof args !== 'object') {
                throw new McpError(ErrorCode.InvalidParams, 'Tool arguments are required and must be an object');
            }
            try {
                // Validate input arguments with schema
                const validatedArgs = tool.inputSchema.parse(args);
                // Sanitize input to prevent injection attacks
                const sanitizedArgs = this.sanitizeInput(validatedArgs);
                // Execute the tool with sanitized input
                const result = await tool.handler(sanitizedArgs, this.sealionClient);
                // Sanitize output to prevent information leaks
                const sanitizedResult = this.sanitizeOutput(result);
                logger.info(`Tool ${name} executed successfully`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: typeof sanitizedResult === 'string' ? sanitizedResult : JSON.stringify(sanitizedResult, null, 2)
                        }
                    ]
                };
            }
            catch (error) {
                logger.error(`Error executing tool ${name}:`, error);
                if (error instanceof z.ZodError) {
                    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
                }
                if (error instanceof McpError) {
                    throw error;
                }
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * Sanitize input to prevent injection attacks
     */
    sanitizeInput(input) {
        if (typeof input === 'string') {
            // Remove potentially dangerous characters and scripts
            return input
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .replace(/['"]/g, '')
                .trim();
        }
        if (Array.isArray(input)) {
            return input.map(item => this.sanitizeInput(item));
        }
        if (input && typeof input === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(input)) {
                sanitized[key] = this.sanitizeInput(value);
            }
            return sanitized;
        }
        return input;
    }
    /**
     * Sanitize output to prevent information leaks
     */
    sanitizeOutput(output) {
        if (typeof output === 'string') {
            // Remove potential sensitive information patterns
            return output
                .replace(/SEALION_API_KEY|API_KEY/gi, '[REDACTED]')
                .replace(/sk-[a-zA-Z0-9]{32,}/g, '[REDACTED]')
                .replace(/Bearer\s+[a-zA-Z0-9_-]+/gi, 'Bearer [REDACTED]')
                .replace(/password[:\s=]+[^\s]+/gi, 'password: [REDACTED]');
        }
        return output;
    }
    /**
     * Convert Zod schema to JSON Schema for MCP compatibility
     */
    convertZodToJsonSchema(zodSchema) {
        // Basic conversion for common Zod types to JSON Schema
        // This is a simplified implementation for the main types we use
        try {
            // Get the shape of the schema if it's an object
            if (zodSchema instanceof z.ZodObject) {
                const shape = zodSchema.shape;
                const properties = {};
                const required = [];
                for (const [key, value] of Object.entries(shape)) {
                    const fieldSchema = value;
                    properties[key] = this.zodFieldToJsonSchema(fieldSchema);
                    // Check if field is required (not optional)
                    if (!(fieldSchema instanceof z.ZodOptional) && !(fieldSchema instanceof z.ZodDefault)) {
                        required.push(key);
                    }
                }
                return {
                    type: 'object',
                    properties,
                    required: required.length > 0 ? required : undefined,
                    additionalProperties: false
                };
            }
            return { type: 'object' };
        }
        catch (error) {
            logger.warn('Failed to convert Zod schema to JSON Schema:', error);
            return { type: 'object' };
        }
    }
    /**
     * Convert individual Zod field to JSON Schema
     */
    zodFieldToJsonSchema(field) {
        if (field instanceof z.ZodString) {
            return { type: 'string' };
        }
        else if (field instanceof z.ZodNumber) {
            return { type: 'number' };
        }
        else if (field instanceof z.ZodBoolean) {
            return { type: 'boolean' };
        }
        else if (field instanceof z.ZodEnum) {
            return {
                type: 'string',
                enum: field.options
            };
        }
        else if (field instanceof z.ZodOptional) {
            return this.zodFieldToJsonSchema(field.unwrap());
        }
        else if (field instanceof z.ZodDefault) {
            const inner = this.zodFieldToJsonSchema(field.removeDefault());
            return {
                ...inner,
                default: field._def.defaultValue()
            };
        }
        return { type: 'string' }; // Fallback
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
            logger.info('Sea-lionMCP Server is running and ready to accept connections');
        }
        catch (error) {
            logger.error('Failed to start server:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=server.js.map