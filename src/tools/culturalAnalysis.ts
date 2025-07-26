/**
 * Cultural Analysis Tool
 * 
 * This tool provides cultural context analysis and insights for Southeast Asian
 * content using Sea-lion's specialized understanding of regional cultures.
 */

import { z } from 'zod';
import { ToolDefinition, SeaLionModel } from '../types/index.js';
import { SeaLionClient } from '../services/sealionClient.js';
import { logger } from '../utils/logger.js';

// Supported analysis types
const AnalysisTypes = [
  'cultural_context',
  'social_norms',
  'business_etiquette',
  'language_usage',
  'religious_sensitivity',
  'generational_differences',
  'regional_variations'
] as const;

// Southeast Asian countries for context
const Countries = [
  'singapore', 'malaysia', 'indonesia', 'thailand', 'vietnam', 
  'philippines', 'myanmar', 'cambodia', 'laos', 'brunei'
] as const;

// Input schema for cultural analysis tool
const CulturalAnalysisSchema = z.object({
  content: z.string().min(1, 'Content for analysis cannot be empty'),
  analysis_type: z.enum(AnalysisTypes).default('cultural_context'),
  target_country: z.enum(Countries).optional().describe('Specific Southeast Asian country for focused analysis'),
  model: z.enum(['v3', 'v3.5']).default('v3.5'),
  include_recommendations: z.boolean().default(true).describe('Include actionable recommendations'),
  detail_level: z.enum(['brief', 'detailed', 'comprehensive']).default('detailed')
});

type CulturalAnalysisArgs = z.infer<typeof CulturalAnalysisSchema>;

/**
 * Handle cultural analysis requests
 */
async function handleCulturalAnalysis(
  args: CulturalAnalysisArgs,
  client: SeaLionClient
): Promise<string> {
  logger.info('Starting cultural analysis', { 
    type: args.analysis_type,
    country: args.target_country,
    model: args.model 
  });

  try {
    // Select the appropriate model
    const modelName = args.model === 'v3.5' 
      ? SeaLionModel.V3_5_8B_R 
      : SeaLionModel.V3_9B_IT;

    // Construct analysis prompt based on type and parameters
    const countryContext = args.target_country 
      ? ` with specific focus on ${args.target_country.charAt(0).toUpperCase() + args.target_country.slice(1)}` 
      : ' across Southeast Asian cultures';

    const recommendationsNote = args.include_recommendations 
      ? ' Include practical recommendations and actionable insights.'
      : '';

    const detailInstruction = getDetailLevelInstruction(args.detail_level);

    const systemPrompt = `You are a Southeast Asian cultural expert with deep understanding of the region's diverse cultures, 
    social norms, business practices, and cultural sensitivities. You specialize in providing accurate cultural analysis 
    and context for content${countryContext}.${recommendationsNote}`;

    const userPrompt = buildAnalysisPrompt(args);

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
      max_tokens: getMaxTokensForDetail(args.detail_level),
      temperature: 0.4 // Balanced temperature for analytical content
    };

    // Use reasoning mode for v3.5 to improve analysis quality
    if (args.model === 'v3.5') {
      requestParams.extra_body = {
        chat_template_kwargs: {
          thinking_mode: 'on'
        }
      };
    }

    const analysis = await client.generateText(requestParams);
    
    logger.info('Cultural analysis completed successfully');
    return analysis.trim();
  } catch (error) {
    logger.error('Cultural analysis failed:', error);
    throw new Error(`Cultural analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build analysis prompt based on analysis type and parameters
 */
function buildAnalysisPrompt(args: CulturalAnalysisArgs): string {
  const basePrompt = `Please analyze the following content for ${args.analysis_type.replace('_', ' ')}:\n\n"${args.content}"\n\n`;
  
  const analysisInstructions = {
    cultural_context: 'Identify cultural references, meanings, and significance within Southeast Asian contexts.',
    social_norms: 'Analyze how this content relates to social norms, expectations, and behaviors.',
    business_etiquette: 'Evaluate business communication appropriateness and cultural sensitivity.',
    language_usage: 'Examine language choices, formality levels, and cultural appropriateness.',
    religious_sensitivity: 'Assess religious considerations and potential sensitivities.',
    generational_differences: 'Analyze how different generations might perceive this content.',
    regional_variations: 'Compare how this content might be received across different Southeast Asian regions.'
  };

  const instruction = analysisInstructions[args.analysis_type];
  const detailLevel = getDetailLevelInstruction(args.detail_level);
  
  return `${basePrompt}${instruction} ${detailLevel}`;
}

/**
 * Get instruction based on detail level
 */
function getDetailLevelInstruction(level: 'brief' | 'detailed' | 'comprehensive'): string {
  switch (level) {
    case 'brief':
      return 'Provide a concise analysis with key points only.';
    case 'detailed':
      return 'Provide a thorough analysis with examples and context.';
    case 'comprehensive':
      return 'Provide an in-depth analysis with extensive examples, historical context, and cross-cultural comparisons.';
  }
}

/**
 * Get max tokens based on detail level
 */
function getMaxTokensForDetail(level: 'brief' | 'detailed' | 'comprehensive'): number {
  switch (level) {
    case 'brief':
      return 256;
    case 'detailed':
      return 512;
    case 'comprehensive':
      return 1024;
  }
}

/**
 * Create the cultural analysis tool definition
 */
export function createCulturalAnalysisTool(): ToolDefinition {
  return {
    name: 'sealion_cultural_analysis',
    description: `Analyze content for Southeast Asian cultural context, social norms, and sensitivities. 
    Provides insights on cultural appropriateness, business etiquette, language usage, and regional variations 
    across ${Countries.join(', ')}.`,
    inputSchema: CulturalAnalysisSchema,
    handler: handleCulturalAnalysis
  };
}
