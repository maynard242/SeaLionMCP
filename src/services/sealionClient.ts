/**
 * Sea-lion API Client
 * 
 * This service handles all communication with the Sea-lion API endpoints.
 * It provides a clean interface for text generation and other Sea-lion capabilities.
 */

import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
import { SeaLionModel } from '../types/index.js';

export class SeaLionClient {
  private client: OpenAI;
  private apiKey: string;
  private baseURL: string;

  constructor() {
    // Get configuration from environment variables
    this.apiKey = process.env.SEALION_API_KEY || process.env.API_KEY || '';
    this.baseURL = process.env.SEALION_BASE_URL || 'https://api.sea-lion.ai/v1';

    if (!this.apiKey) {
      logger.warn('Sea-lion API key not found in environment variables. Please set SEALION_API_KEY or API_KEY.');
    }

    // Initialize OpenAI client with Sea-lion endpoint
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL
    });

    logger.info('Sea-lion client initialized', { baseURL: this.baseURL });
  }

  /**
   * Test connection to Sea-lion API
   */
  async testConnection(): Promise<void> {
    try {
      if (!this.apiKey) {
        throw new Error('API key is required for Sea-lion connection');
      }

      // Test with a simple request
      await this.generateText({
        model: SeaLionModel.V3_9B_IT,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 5,
        temperature: 0.1
      });

      logger.info('Sea-lion API connection test successful');
    } catch (error) {
      logger.error('Sea-lion API connection test failed:', error);
      throw new Error(`Failed to connect to Sea-lion API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate text using Sea-lion models
   */
  async generateText(params: {
    model: string;
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
    max_tokens?: number;
    temperature?: number;
    extra_body?: any;
  }): Promise<string> {
    try {
      logger.debug('Making text generation request', { 
        model: params.model, 
        messageCount: params.messages.length 
      });

      const requestParams: any = {
        model: params.model,
        messages: params.messages,
        max_tokens: params.max_tokens || 512,
        temperature: params.temperature || 0.7
      };

      // Add extra_body if provided (for v3.5 thinking mode)
      if (params.extra_body) {
        requestParams.extra_body = params.extra_body;
      }

      const completion = await this.client.chat.completions.create(requestParams);

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from Sea-lion API');
      }

      logger.debug('Text generation successful', { 
        responseLength: content.length,
        model: params.model 
      });

      return content;
    } catch (error) {
      logger.error('Text generation request failed:', error);
      
      // Handle common API errors
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Invalid API key. Please check your Sea-lion API credentials.');
        } else if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please wait before making another request.');
        } else if (error.message.includes('500')) {
          throw new Error('Sea-lion API server error. Please try again later.');
        }
      }
      
      throw new Error(`Sea-lion API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return Object.values(SeaLionModel);
  }

  /**
   * Check if a model is available
   */
  isModelAvailable(model: string): boolean {
    return this.getAvailableModels().includes(model);
  }
}
