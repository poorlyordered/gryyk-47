import type { Handler } from '@netlify/functions';
import { Pinecone } from '@pinecone-database/pinecone';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// Netlify Functions use env vars without VITE_ prefix
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const INDEX_NAME = 'chat-history';
const INDEX_HOST = process.env.INDEX_HOST; // Get from environment variable

// Initialize Pinecone client (singleton)
let pineconeClient: Pinecone | null = null;

const getPineconeClient = () => {
  if (!pineconeClient && PINECONE_API_KEY) {
    pineconeClient = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });
  }
  return pineconeClient;
};

/**
 * Get embeddings from OpenAI API
 * Note: OpenRouter doesn't support embedding models at all.
 * Using OpenAI's text-embedding-3-small (1536 dimensions).
 */
async function getEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Embedding API error:', errorText);
    throw new Error(`Embedding failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

const handler: Handler = async (event) => {
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  const client = getPineconeClient();

  if (!client) {
    console.error('Pinecone client not initialized. PINECONE_API_KEY:', PINECONE_API_KEY ? 'Present' : 'Missing');
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Pinecone not configured',
        details: 'PINECONE_API_KEY environment variable is missing'
      })
    };
  }

  if (!INDEX_HOST) {
    console.error('INDEX_HOST not configured');
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Pinecone not configured',
        details: 'INDEX_HOST environment variable is missing'
      })
    };
  }

  try {
    console.log('Initializing Pinecone index:', INDEX_NAME);
    console.log('Index host:', INDEX_HOST);

    const index = client.index(INDEX_NAME, INDEX_HOST);

    // Store conversation
    if (event.httpMethod === 'POST') {
      const { sessionId, messages, metadata } = JSON.parse(event.body || '{}');

      if (!sessionId || !messages) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }

      // Create conversation summary
      const conversationText = messages
        .filter((m: { sender: string }) => m.sender !== 'system')
        .map((m: { sender: string; content: string }) => `${m.sender}: ${m.content}`)
        .join('\n');

      // Get embedding
      const embedding = await getEmbedding(conversationText);

      // Store in Pinecone
      await index.upsert([{
        id: sessionId,
        values: embedding,
        metadata: {
          sessionId,
          corporationId: metadata?.corporationId || '',
          userId: metadata?.userId || '',
          tags: metadata?.tags || [],
          messageCount: messages.length,
          timestamp: Date.now(),
          preview: conversationText.substring(0, 500)
        }
      }]);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, sessionId })
      };
    }

    // Search similar conversations
    else if (event.httpMethod === 'GET') {
      const query = event.queryStringParameters?.query;
      const topK = parseInt(event.queryStringParameters?.topK || '5');
      const minScore = parseFloat(event.queryStringParameters?.minScore || '0.7');
      const corporationId = event.queryStringParameters?.corporationId;
      const userId = event.queryStringParameters?.userId;

      if (!query) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing query parameter' })
        };
      }

      // Get embedding for query
      console.log('Getting embedding for query:', query);
      const embedding = await getEmbedding(query);
      console.log('Embedding generated, length:', embedding.length);

      // Build filter
      const filter: Record<string, string> = {};
      if (corporationId) filter.corporationId = corporationId;
      if (userId) filter.userId = userId;

      // Query Pinecone
      console.log('Querying Pinecone index...');
      const results = await index.query({
        vector: embedding,
        topK,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        includeMetadata: true
      });

      // Filter and format results
      const matches = results.matches
        .filter(match => match.score && match.score >= minScore)
        .map(match => ({
          sessionId: match.metadata?.sessionId as string,
          score: match.score || 0,
          preview: match.metadata?.preview as string,
          timestamp: match.metadata?.timestamp as number,
          messageCount: match.metadata?.messageCount as number
        }));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(matches)
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Pinecone error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', { message: errorMessage, stack: errorStack });

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: errorMessage,
        stack: errorStack?.split('\n').slice(0, 3).join('\n') // First 3 lines of stack
      })
    };
  }
};

export { handler };
