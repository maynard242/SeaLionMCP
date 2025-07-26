# sea-lionMCP

A Model Context Protocol (MCP) server providing access to Sea-lion Southeast Asian language models.

## Overview

sea-lionMCP is a secure, production-ready MCP server that bridges MCP-compatible clients with Sea-lion's Southeast Asian language models. It offers specialized tools for text generation, translation, and cultural analysis with a focus on Southeast Asian languages and cultures.

## Features

- **Text Generation**: Generate text using Sea-lion v3 and v3.5 models with reasoning mode support
- **Translation**: Translate between 11 Southeast Asian languages with cultural context preservation
- **Cultural Analysis**: Analyze content for Southeast Asian cultural context and sensitivities
- **Security Hardened**: Comprehensive input validation, sanitization, and rate limiting
- **MCP Protocol Compliant**: Full JSON-RPC 2.0 and MCP standard compliance

## Supported Languages

English, Indonesian, Thai, Vietnamese, Filipino, Malay, Burmese, Khmer, Lao, Tamil, Chinese

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your Sea-lion API key:**
   ```bash
   export SEALION_API_KEY=your_api_key_here
   ```

3. **Build the project:**
   ```bash
   npx tsc
   ```

4. **Run the server:**
   ```bash
   node build/index.js
   ```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
SEALION_API_KEY=your_sealion_api_key_here
SEALION_BASE_URL=https://api.sea-lion.ai/v1
LOG_LEVEL=info
```

## Available Tools

### `sealion_generate_text`
Generate text using Sea-lion models with optional reasoning mode.

### `sealion_translate`
Translate text between Southeast Asian languages with cultural context preservation.

### `sealion_cultural_analysis`
Analyze content for cultural appropriateness and regional sensitivities.

## Security

This server includes comprehensive security measures:
- Input validation and sanitization
- Rate limiting (10 requests/minute)
- Output filtering for sensitive information
- Strict parameter validation
- MCP protocol compliance

See [SECURITY.md](SECURITY.md) for detailed security information.

## Development

```bash
# Install dependencies
npm install

# Build
npx tsc

# Run in development mode
npm run dev

# Run security tests
node security-tests.js
```

## Architecture

- **TypeScript/Node.js** runtime with ES modules
- **MCP SDK** for protocol compliance
- **Zod** for schema validation
- **OpenAI SDK** for Sea-lion API compatibility
- **Modular design** with service-oriented architecture

## Contributing

1. Ensure all security tests pass
2. Update documentation for any new features
3. Follow existing code patterns and TypeScript strict mode
4. Test with both v3 and v3.5 Sea-lion models

## License

MIT License - see LICENSE file for details.

## API Documentation

For Sea-lion API documentation, visit: https://docs.sea-lion.ai