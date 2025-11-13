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

/**
 * AI Chat endpoint using AI SDK with streaming support
 *
 * This endpoint uses streamText() and returns the AI SDK data stream format
 * that the useChat() hook expects on the frontend.
 */
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
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    // Use x-ai/grok-code-fast-1 (Grok Code Fast model)
    const { messages, model = 'x-ai/grok-code-fast-1', temperature = 0.7, maxTokens = 2000 } = body;

    // Validation
    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Messages array is required' })
      };
    }

    if (!OPENROUTER_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'An error occurred.',
          details: 'OpenRouter API key not configured'
        })
      };
    }

    // Use AI SDK's streamText with OpenRouter model
    let result;

    try {
      result = streamText({
        model: openrouter(model),
        messages,
        temperature,
        maxTokens,
      });
    } catch (streamError) {
      console.error('streamText error:', streamError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'An error occurred.',
          details: streamError instanceof Error ? streamError.message : 'Failed to create stream'
        })
      };
    }

    // Convert to Response object with proper AI SDK data stream format
    const response = result.toDataStreamResponse();

    // Since Netlify Functions don't support true streaming responses,
    // we need to buffer the entire stream and return it
    const reader = response.body?.getReader();
    if (!reader) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'An error occurred.',
          details: 'No response body from AI model'
        })
      };
    }

    // Buffer the entire response
    const chunks: Uint8Array[] = [];
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
    } catch (readError) {
      console.error('Stream read error:', readError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'An error occurred.',
          details: 'Failed to read stream'
        })
      };
    }

    // Combine chunks and decode
    const decoder = new TextDecoder();
    const fullResponse = chunks.map(chunk => decoder.decode(chunk, { stream: true })).join('');

    // Return with proper headers from AI SDK response
    const responseHeaders: Record<string, string> = {
      ...headers,
    };

    // Copy AI SDK headers
    response.headers.forEach((value: string, key: string) => {
      responseHeaders[key] = value;
    });

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: fullResponse,
    };

  } catch (error) {
    console.error('AI Chat error:', error);

    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'An error occurred.',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : typeof error
      })
    };
  }
};
