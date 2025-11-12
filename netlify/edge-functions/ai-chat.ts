import { streamText } from 'https://esm.sh/ai@3.4.29';
import { createOpenAI } from 'https://esm.sh/@ai-sdk/openai@0.0.66';

/**
 * AI Chat Edge Function - supports true streaming responses
 *
 * Edge Functions run on Deno at the edge and support streaming responses,
 * which is required for the AI SDK's useChat() hook to work properly.
 */
export default async (request: Request, context: any) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get API key from environment
    const OPENROUTER_API_KEY = Deno.env.get('VITE_OPENROUTER_API_KEY') ||
                                Deno.env.get('OPENROUTER_API_KEY');

    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'An error occurred.',
          details: 'OpenRouter API key not configured'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { messages, model = 'x-ai/grok-beta', temperature = 0.7, maxTokens = 2000 } = body;

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Configure OpenRouter provider
    const openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: OPENROUTER_API_KEY,
      headers: {
        'HTTP-Referer': context.site?.url || 'http://localhost:5173',
        'X-Title': 'Gryyk-47 EVE Online AI Assistant'
      }
    });

    // Create streaming response using AI SDK
    const result = streamText({
      model: openrouter(model),
      messages,
      temperature,
      maxTokens,
    });

    // Return the streaming response directly - Edge Functions support this!
    return result.toDataStreamResponse({
      headers: corsHeaders
    });

  } catch (error) {
    console.error('AI Chat Edge Function error:', error);

    return new Response(
      JSON.stringify({
        error: 'An error occurred.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

export const config = {
  path: '/.netlify/functions/ai-chat'
};
