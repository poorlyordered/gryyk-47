import { Handler } from '@netlify/functions';
import { ragService } from '../../mastra/services/rag-service';

export const handler: Handler = async (event, _context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { type, data } = JSON.parse(event.body || '{}');

    if (!type || !data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Type and data are required' })
      };
    }

    // Initialize RAG system if not already done
    if (!ragService.isInitialized()) {
      await ragService.initialize();
    }

    let result;
    switch (type) {
      case 'esi':
        await ragService.ingestESIData(data.endpoint, data.response);
        result = { message: `ESI data ingested from ${data.endpoint}` };
        break;

      case 'market':
        await ragService.ingestMarketData(Array.isArray(data) ? data : [data]);
        result = { message: `Market data ingested (${Array.isArray(data) ? data.length : 1} items)` };
        break;

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Unknown ingestion type' })
        };
    }

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
        ...result,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('RAG ingestion error:', error);
    
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