import type { Handler } from '@netlify/functions';
import { orchestrate } from './lib/orchestration-engine';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { messages, sessionId, corporationId } = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'messages array is required' })
      };
    }

    if (!sessionId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'sessionId is required' })
      };
    }

    if (!MONGODB_URI) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'MongoDB URI not configured' })
      };
    }

    // Extract user query from last message
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // Execute orchestration
    const response = await orchestrate(
      {
        query: userQuery,
        sessionId,
        corporationId: corporationId || 'default-corp',
        conversationHistory: messages.slice(0, -1)
      },
      MONGODB_URI
    );

    // Return response
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Orchestrated chat error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
