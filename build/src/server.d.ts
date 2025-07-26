/**
 * Sea-lion MCP Server Implementation
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
     * Start the MCP server
     */
    start(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map