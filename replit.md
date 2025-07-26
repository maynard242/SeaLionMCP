# Sea-lion MCP Server

## Overview

This is a Model Context Protocol (MCP) server implementation that provides access to Sea-lion Southeast Asian language models. The server acts as a bridge between MCP-compatible clients and the Sea-lion API, offering specialized tools for text generation, translation, and cultural analysis with a focus on Southeast Asian languages and cultures.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The system follows a modular, service-oriented architecture built on TypeScript and Node.js:

- **Entry Point**: Single server instance (`index.ts`) with graceful shutdown handling
- **Core Server**: MCP server implementation using the official MCP SDK
- **Service Layer**: Abstracted API client for Sea-lion endpoints
- **Tool Layer**: Specialized tools for different AI capabilities
- **Utility Layer**: Supporting services for logging and rate limiting

The architecture prioritizes clean separation of concerns, making it easy to add new tools or modify existing functionality without affecting other components.

## Key Components

### 1. MCP Server (`src/server.ts`)
- **Purpose**: Main server implementation handling MCP protocol communication
- **Key Features**: Tool registration, request routing, error handling
- **Design Choice**: Uses the official MCP SDK for protocol compliance and future compatibility

### 2. Sea-lion Client (`src/services/sealionClient.ts`)
- **Purpose**: Abstracts Sea-lion API communication using OpenAI-compatible interface
- **Key Features**: Connection testing, model selection, request handling
- **Design Choice**: Uses OpenAI SDK for compatibility with Sea-lion's OpenAI-compatible API

### 3. Tool Implementations
- **Text Generation** (`src/tools/textGeneration.ts`): General-purpose text generation with reasoning mode support
- **Translation** (`src/tools/translation.ts`): Southeast Asian language translation with cultural context preservation
- **Cultural Analysis** (`src/tools/culturalAnalysis.ts`): Cultural context analysis for Southeast Asian content

### 4. Utilities
- **Logger** (`src/utils/logger.ts`): Structured logging with configurable levels
- **Rate Limiter** (`src/utils/rateLimiter.ts`): Sliding window rate limiting for API protection

## Data Flow

1. **Client Request**: MCP client sends tool execution request
2. **Server Processing**: MCP server validates request and routes to appropriate tool
3. **Rate Limiting**: Request passes through rate limiter (10 requests/minute default)
4. **Tool Execution**: Tool processes request using Sea-lion client
5. **API Communication**: Sea-lion client makes HTTP request to Sea-lion API
6. **Response Processing**: Tool formats and returns response to MCP client

The system maintains stateless operation with no persistent data storage, focusing on real-time API interactions.

## External Dependencies

### Primary Dependencies
- **@modelcontextprotocol/sdk**: Official MCP SDK for protocol implementation
- **openai**: OpenAI SDK used for Sea-lion API compatibility
- **zod**: Schema validation and type safety
- **typescript**: Type system and compilation

### API Dependencies
- **Sea-lion API**: External AI service requiring API key authentication
- **Environment Variables**: 
  - `SEALION_API_KEY` or `API_KEY`: Required for authentication
  - `SEALION_BASE_URL`: Optional API endpoint override
  - `LOG_LEVEL`: Optional logging level configuration

## Deployment Strategy

### Current Setup
- **Runtime**: Node.js (ES2022 target)
- **Module System**: ESNext modules with .js imports
- **Transport**: STDIO-based communication for MCP protocol
- **Process Management**: Signal handling for graceful shutdown

### Configuration Management
- Environment variable-based configuration
- Fallback defaults for non-critical settings
- Runtime validation with clear error messages

### Scalability Considerations
- Stateless design enables horizontal scaling
- Rate limiting prevents individual instance overload
- Modular architecture supports feature expansion

The deployment strategy focuses on simplicity and reliability, with the server designed to run as a single process that can be easily managed by MCP-compatible environments.