// EVE Online AI Model Configuration for OpenRouter
export const EVE_AI_MODELS = {
  // Gryyk-47 System Orchestrator - Full capability model
  orchestrator: 'x-ai/grok-4-fast', // Primary Gryyk-47 AI with full reasoning capabilities

  // Specialist agents - Efficient focused models
  specialist: 'x-ai/grok-4-fast', // All specialist agents use Grok-4 Fast
  
  // Legacy models (kept for compatibility)
  strategic: 'anthropic/claude-3.5-sonnet',
  general: 'x-ai/grok-beta',
  analytical: 'openai/gpt-4o',
  tactical: 'meta-llama/llama-3.1-70b-instruct',
  quick: 'openai/gpt-3.5-turbo'
} as const;

export type EVEModelType = keyof typeof EVE_AI_MODELS;

// Model-specific configurations
export const MODEL_CONFIGS = {
  'x-ai/grok-4-fast': {
    temperature: 0.7,
    maxTokens: 4000,
    description: 'Grok-4 Fast - High speed, high quality responses'
  },
  // Legacy configurations
  [EVE_AI_MODELS.strategic]: {
    temperature: 0.3,
    maxTokens: 4000,
    description: 'Strategic planning and complex analysis'
  },
  [EVE_AI_MODELS.general]: {
    temperature: 0.7,
    maxTokens: 2000,
    description: 'General EVE Online assistance'
  },
  [EVE_AI_MODELS.analytical]: {
    temperature: 0.1,
    maxTokens: 3000,
    description: 'Market analysis and data processing'
  },
  [EVE_AI_MODELS.tactical]: {
    temperature: 0.8,
    maxTokens: 2500,
    description: 'Fleet composition and tactical planning'
  },
  [EVE_AI_MODELS.quick]: {
    temperature: 0.5,
    maxTokens: 1000,
    description: 'Quick responses and simple queries'
  }
} as const;