/**
 * Text Generation Tool
 * 
 * This tool provides text generation capabilities using Sea-lion models.
 * It supports both standard and reasoning modes, with model switching.
 */

import { z } from 'zod';
import { ToolDefinition, SeaLionModel } from '../types/index.js';
import { SeaLionClient } from '../services/sealionClient.js';
import { logger } from '../utils/logger.js';

// Input schema for text generation tool
const TextGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(10000, 'Prompt too long'),
  model: z.enum(['v3', 'v3.5'], { 
    errorMap: () => ({ message: 'Model must be either v3 or v3.5' })
  }).default('v3.5'),
  max_tokens: z.number().int().min(1, 'Max tokens must be at least 1').max(4096, 'Max tokens cannot exceed 4096').default(512),
  temperature: z.number().min(0, 'Temperature must be at least 0').max(2, 'Temperature cannot exceed 2').default(0.7),
  thinking_mode: z.boolean().default(true).describe('Enable reasoning mode for v3.5 models'),
  system_prompt: z.string().max(5000, 'System prompt too long').optional().describe('Optional system prompt for context')
}).strict();

type TextGenerationArgs = z.infer<typeof TextGenerationSchema>;

/**
 * Handle text generation requests
 */
async function handleTextGeneration(
  args: TextGenerationArgs,
  client: SeaLionClient
): Promise<string> {
  logger.info('Starting text generation', { model: args.model, thinking_mode: args.thinking_mode });

  try {
    // Select the appropriate model based on version
    const modelName = args.model === 'v3.5' 
      ? SeaLionModel.V3_5_8B_R 
      : SeaLionModel.V3_9B_IT;

    // Prepare messages
    const messages = [];
    
    if (args.system_prompt) {
      messages.push({
        role: 'system' as const,
        content: args.system_prompt
      });
    }
    
    messages.push({
      role: 'user' as const,
      content: args.prompt
    });

    // Prepare request parameters
    const requestParams: any = {
      model: modelName,
      messages,
      max_tokens: args.max_tokens,
      temperature: args.temperature
    };

    // Add thinking mode configuration for v3.5 models
    if (args.model === 'v3.5') {
      requestParams.extra_body = {
        chat_template_kwargs: {
          thinking_mode: args.thinking_mode ? 'on' : 'off'
        }
      };
    }

    const response = await client.generateText(requestParams);
    
    logger.info('Text generation completed successfully');
    return response;
  } catch (error) {
    logger.error('Text generation failed:', error);
    throw new Error(`Text generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create the text generation tool definition
 */
export function createTextGenerationTool(): ToolDefinition {
  return {
    name: 'sealion_generate_text',
    description: 'Generate text using Sea-lion Southeast Asian language models. Supports both standard and reasoning modes with model switching between v3 and v3.5.',
    inputSchema: TextGenerationSchema,
    handler: handleTextGeneration
  };
}
