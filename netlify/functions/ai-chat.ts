import { Handler } from '@netlify/functions';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

// OpenRouter provider configured for AI SDK
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.URL || 'http://localhost:5173',
    'X-Title': 'Gryyk-47 EVE Online AI Assistant'
  }
});

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { messages, model = 'x-ai/grok-beta', temperature = 0.7, maxTokens = 2000 } = JSON.parse(event.body || '{}');

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Messages array is required' })
      };
    }

    // Use AI SDK's streamText with OpenRouter model
    const result = await streamText({
      model: openrouter(model),
      messages,
      temperature,
      maxTokens,
    });

    // Convert stream to data stream response format
    const response = result.toDataStreamResponse();

    // Read the stream and return as string (Netlify doesn't support true streaming)
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const chunks: Uint8Array[] = [];
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const fullResponse = chunks.map(chunk => decoder.decode(chunk)).join('');

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: fullResponse,
    };
  } catch (error) {
    console.error('AI Chat error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
