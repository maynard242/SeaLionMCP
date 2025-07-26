#!/usr/bin/env node
/**
 * Sea-lion MCP Server Entry Point
 *
 * This file serves as the main entry point for the Sea-lion MCP server.
 * It sets up the server and starts listening for MCP protocol messages.
 */
import { SeaLionMCPServer } from './src/server.js';
import { logger } from './src/utils/logger.js';
async function main() {
    try {
        logger.info('Starting Sea-lion MCP Server...');
        const server = new SeaLionMCPServer();
        await server.start();
        logger.info('Sea-lion MCP Server started successfully');
    }
    catch (error) {
        logger.error('Failed to start Sea-lion MCP Server:', error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});
main().catch((error) => {
    logger.error('Unhandled error in main:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map