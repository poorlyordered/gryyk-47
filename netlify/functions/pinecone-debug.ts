import type { Handler } from '@netlify/functions';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

/**
 * Debug endpoint to check Pinecone configuration
 */
const handler: Handler = async (event) => {
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const INDEX_HOST = process.env.INDEX_HOST;
  const INDEX_NAME = 'chat-history';

  // Return configuration status (mask sensitive values)
  const config = {
    INDEX_NAME,
    INDEX_HOST: INDEX_HOST || 'NOT SET',
    INDEX_HOST_length: INDEX_HOST?.length || 0,
    PINECONE_API_KEY_set: !!PINECONE_API_KEY,
    PINECONE_API_KEY_length: PINECONE_API_KEY?.length || 0,
    PINECONE_API_KEY_preview: PINECONE_API_KEY ? `${PINECONE_API_KEY.substring(0, 8)}...` : 'NOT SET',
    OPENAI_API_KEY_set: !!OPENAI_API_KEY,
    OPENAI_API_KEY_length: OPENAI_API_KEY?.length || 0,
    timestamp: new Date().toISOString()
  };

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(config, null, 2)
  };
};

export { handler };
