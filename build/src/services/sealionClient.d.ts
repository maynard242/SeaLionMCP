/**
 * Sea-lion API Client
 *
 * This service handles all communication with the Sea-lion API endpoints.
 * It provides a clean interface for text generation and other Sea-lion capabilities.
 */
export declare class SeaLionClient {
    private client;
    private apiKey;
    private baseURL;
    constructor();
    /**
     * Test connection to Sea-lion API
     */
    testConnection(): Promise<void>;
    /**
     * Generate text using Sea-lion models
     */
    generateText(params: {
        model: string;
        messages: Array<{
            role: 'system' | 'user' | 'assistant';
            content: string;
        }>;
        max_tokens?: number;
        temperature?: number;
        extra_body?: any;
    }): Promise<string>;
    /**
     * Get available models
     */
    getAvailableModels(): string[];
    /**
     * Check if a model is available
     */
    isModelAvailable(model: string): boolean;
}
//# sourceMappingURL=sealionClient.d.ts.map