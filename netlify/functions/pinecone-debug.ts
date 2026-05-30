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
    PINECONE_API_KEY_set: !!PINECONE_API_KEY,
    OPENAI_API_KEY_set: !!OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  };

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(config, null, 2)
  };
};

export { handler };
