/**
 * Translation Tool
 * 
 * This tool provides translation capabilities between Southeast Asian languages
 * using Sea-lion models with cultural context awareness.
 */

import { z } from 'zod';
import { ToolDefinition, SeaLionModel } from '../types/index.js';
import { SeaLionClient } from '../services/sealionClient.js';
import { logger } from '../utils/logger.js';

// Supported Southeast Asian languages
const SupportedLanguages = [
  'english', 'indonesian', 'thai', 'vietnamese', 'filipino', 
  'malay', 'burmese', 'khmer', 'lao', 'tamil', 'chinese'
] as const;

// Input schema for translation tool
const TranslationSchema = z.object({
  text: z.string().min(1, 'Text to translate cannot be empty').max(5000, 'Text too long for translation'),
  source_language: z.enum(SupportedLanguages, {
    errorMap: () => ({ message: `Source language must be one of: ${SupportedLanguages.join(', ')}` })
  }),
  target_language: z.enum(SupportedLanguages, {
    errorMap: () => ({ message: `Target language must be one of: ${SupportedLanguages.join(', ')}` })
  }),
  model: z.enum(['v3', 'v3.5'], {
    errorMap: () => ({ message: 'Model must be either v3 or v3.5' })
  }).default('v3.5'),
  preserve_cultural_context: z.boolean().default(true).describe('Maintain cultural nuances in translation'),
  formal_register: z.boolean().default(false).describe('Use formal language register')
}).strict();

type TranslationArgs = z.infer<typeof TranslationSchema>;

/**
 * Handle translation requests
 */
async function handleTranslation(
  args: TranslationArgs,
  client: SeaLionClient
): Promise<string> {
  logger.info('Starting translation', { 
    from: args.source_language, 
    to: args.target_language,
    model: args.model 
  });

  if (args.source_language === args.target_language) {
    return `The text is already in ${args.target_language}. Original text: ${args.text}`;
  }

  try {
    // Select the appropriate model
    const modelName = args.model === 'v3.5' 
      ? SeaLionModel.V3_5_8B_R 
      : SeaLionModel.V3_9B_IT;

    // Construct translation prompt with cultural context
    const culturalContext = args.preserve_cultural_context 
      ? ' Please preserve cultural nuances, idioms, and context-specific meanings.'
      : '';
    
    const formalRegister = args.formal_register 
      ? ' Use formal language register appropriate for professional or academic contexts.'
      : '';

    const systemPrompt = `You are an expert translator specializing in Southeast Asian languages and cultures. 
    You understand the cultural nuances, idioms, and context-specific meanings of each language.${culturalContext}${formalRegister}`;

    const userPrompt = `Translate the following text from ${args.source_language} to ${args.target_language}:

"${args.text}"

Provide only the translation without additional explanations.`;

    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      {
        role: 'user' as const,
        content: userPrompt
      }
    ];

    const requestParams: any = {
      model: modelName,
      messages,
      max_tokens: Math.max(args.text.length * 2, 256),
      temperature: 0.3 // Lower temperature for more consistent translations
    };

    // Add thinking mode for v3.5 to improve translation quality
    if (args.model === 'v3.5') {
      requestParams.extra_body = {
        chat_template_kwargs: {
          thinking_mode: 'on'
        }
      };
    }

    const translation = await client.generateText(requestParams);
    
    logger.info('Translation completed successfully');
    return translation.trim();
  } catch (error) {
    logger.error('Translation failed:', error);
    throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create the translation tool definition
 */
export function createTranslationTool(): ToolDefinition {
  return {
    name: 'sealion_translate',
    description: `Translate text between Southeast Asian languages using Sea-lion models. 
    Supports: ${SupportedLanguages.join(', ')}. 
    Preserves cultural context and nuances specific to Southeast Asian cultures.`,
    inputSchema: TranslationSchema,
    handler: handleTranslation
  };
}
