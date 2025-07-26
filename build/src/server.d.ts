/**
 * Sea-lionMCP Server Implementation
 *
 * This class implements the main MCP server functionality for Sea-lion APIs.
 * It provides tools for text generation, translation, and cultural analysis
 * using Sea-lion's Southeast Asian language models.
 */
export declare class SeaLionMCPServer {
    private server;
    private sealionClient;
    private rateLimiter;
    private tools;
    constructor();
    /**
     * Set up available tools for the MCP server
     */
    private setupTools;
    /**
     * Set up MCP protocol handlers
     */
    private setupHandlers;
    /**
     * Sanitize input to prevent injection attacks
     */
    private sanitizeInput;
    /**
     * Sanitize output to prevent information leaks
     */
    private sanitizeOutput;
    /**
     * Convert Zod schema to JSON Schema for MCP compatibility
     */
    private convertZodToJsonSchema;
    /**
     * Convert individual Zod field to JSON Schema
     */
    private zodFieldToJsonSchema;
    /**
     * Start the MCP server
     */
    start(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map