import { openai } from '@ai-sdk/openai';
import { OPENROUTER_CONFIG } from '../config/openrouter';

/**
 * OpenRouter provider configured for Vercel AI SDK
 * Uses OpenAI-compatible API format
 */
export const openrouter = openai({
  apiKey: OPENROUTER_CONFIG.apiKey,
  baseURL: OPENROUTER_CONFIG.baseUrl,
  defaultHeaders: OPENROUTER_CONFIG.headers as Record<string, string>,
});

/**
 * Create a language model instance for a specific OpenRouter model
 * @param modelId - The OpenRouter model ID (e.g., 'x-ai/grok-code-fast-1', 'anthropic/claude-3.5-sonnet')
 */
export const createOpenRouterModel = (modelId: string) => {
  return openrouter(modelId);
};

/**
 * Get the default model instance
 */
export const getDefaultModel = () => {
  return createOpenRouterModel(OPENROUTER_CONFIG.defaultModel);
};
