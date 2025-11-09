import type { Handler } from '@netlify/functions';
import { MemoryService } from '../../mastra/services/memory-service';
import { GryykOrchestrator } from '../../mastra/services/orchestrator';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

// Singleton instances
let memoryService: MemoryService | null = null;
let orchestrator: GryykOrchestrator | null = null;

/**
 * Initialize orchestrator on cold start
 */
async function getOrchestrator(): Promise<GryykOrchestrator> {
  if (!orchestrator) {
    if (!MONGODB_URI) {
      throw new Error('MongoDB URI not configured');
    }

    memoryService = new MemoryService(MONGODB_URI);
    await memoryService.connect();

    orchestrator = new GryykOrchestrator(memoryService);
    console.log('🤖 Gryyk-47 orchestrator initialized');
  }

  return orchestrator;
}

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
    const {
      messages,
      sessionId,
      corporationId,
      model,
      stream: _stream = false
    } = JSON.parse(event.body || '{}');

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

    // Get orchestrator instance
    const orch = await getOrchestrator();

    // Extract user query from last message
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // Execute orchestrated request
    const response = await orch.processQuery({
      query: userQuery,
      sessionId,
      corporationId: corporationId || 'default-corp',
      userContext: {
        conversationHistory: messages.slice(0, -1), // All except last message
        model: model || 'anthropic/claude-3.5-sonnet'
      }
    });

    // Return response
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        response: response.response,
        specialistsConsulted: response.specialistsConsulted,
        confidence: response.confidence,
        memories: response.memories,
        sessionId: response.sessionId
      })
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
