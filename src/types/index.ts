/**
 * Type definitions for the Sea-lion MCP server
 */

import { z } from 'zod';

/**
 * Available Sea-lion models
 */
export enum SeaLionModel {
  V3_9B_IT = 'aisingapore/Gemma-SEA-LION-v3-9B-IT',
  V3_5_8B_R = 'aisingapore/Llama-SEA-LION-v3.5-8B-R'
}

/**
 * Tool definition interface
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  handler: (args: any, client: any) => Promise<string>;
}

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * API error response
 */
export interface ApiError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * Sea-lion API response types
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  extra_body?: {
    chat_template_kwargs?: {
      thinking_mode?: 'on' | 'off';
    };
  };
}

/**
 * Supported Southeast Asian languages
 */
export type SupportedLanguage = 
  | 'english'
  | 'indonesian'
  | 'thai'
  | 'vietnamese'
  | 'filipino'
  | 'malay'
  | 'burmese'
  | 'khmer'
  | 'lao'
  | 'tamil'
  | 'chinese';

/**
 * Cultural analysis types
 */
export type CulturalAnalysisType = 
  | 'cultural_context'
  | 'social_norms'
  | 'business_etiquette'
  | 'language_usage'
  | 'religious_sensitivity'
  | 'generational_differences'
  | 'regional_variations';

/**
 * Southeast Asian countries
 */
export type SeaCountry = 
  | 'singapore'
  | 'malaysia'
  | 'indonesia'
  | 'thailand'
  | 'vietnam'
  | 'philippines'
  | 'myanmar'
  | 'cambodia'
  | 'laos'
  | 'brunei';
