import { Mastra } from '@mastra/core';
import { openai } from '@ai-sdk/openai';

// OpenRouter configuration using your existing API key
const openrouterConfig = {
  apiKey: process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:5173',
    'X-Title': 'Gryyk-47 EVE Online AI Assistant'
  }
};

// Create OpenAI provider configured for OpenRouter
const openrouterProvider = openai({
  apiKey: openrouterConfig.apiKey,
  baseURL: openrouterConfig.baseURL,
  defaultHeaders: openrouterConfig.headers
});

// Initialize Mastra with OpenRouter integration
export const mastra = new Mastra({
  providers: {
    openrouter: openrouterProvider
  },
  memory: {
    provider: 'memory', // In-memory for now, can upgrade to persistent later
  },
  logger: {
    type: 'CONSOLE',
    level: 'INFO'
  }
});

export default mastra;