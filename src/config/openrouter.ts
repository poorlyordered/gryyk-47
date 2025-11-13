export const OPENROUTER_CONFIG = {
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: 'x-ai/grok-code-fast-1', // Grok Code Fast model
  headers: {
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Gryyk-47 EVE Online AI Assistant'
  }
};
