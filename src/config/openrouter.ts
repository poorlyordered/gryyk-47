export const OPENROUTER_CONFIG = {
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: 'xai/grok-beta', // Correct OpenRouter format (no hyphen in xai)
  headers: {
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Gryyk-47 EVE Online AI Assistant'
  }
};
