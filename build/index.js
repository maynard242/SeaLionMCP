#!/usr/bin/env node
/**
 * Sea-lionMCP Server Entry Point
 *
 * This file serves as the main entry point for the Sea-lionMCP server.
 * It sets up the server and starts listening for MCP protocol messages.
 */
import { SeaLionMCPServer } from './src/server.js';
import { logger } from './src/utils/logger.js';
async function main() {
    try {
        logger.info('Starting Sea-lionMCP Server...');
        const server = new SeaLionMCPServer();
        await server.start();
        logger.info('Sea-lionMCP Server started successfully');
    }
    catch (error) {
        logger.error('Failed to start Sea-lionMCP Server:', error);
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