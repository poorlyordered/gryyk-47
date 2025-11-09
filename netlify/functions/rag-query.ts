import { Handler } from '@netlify/functions';
import { ragService } from '../../mastra/services/rag-service';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { query, agentType, category, securityLevel, topK = 5 } = JSON.parse(event.body || '{}');

    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query is required' })
      };
    }

    // Initialize RAG system if not already done
    if (!ragService.isInitialized()) {
      await ragService.initialize();
    }

    // Perform the search
    const results = await ragService.search(query, {
      agentType,
      category,
      securityLevel,
      topK
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        query,
        results,
        meta: {
          agentType,
          category,
          securityLevel,
          topK,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('RAG query error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Handle CORS preflight
export const options: Handler = async () => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
  };
};