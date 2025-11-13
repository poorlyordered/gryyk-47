import type { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { sessionId, effectiveness, outcome } = JSON.parse(event.body || '{}');

    if (!sessionId || effectiveness === undefined) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'sessionId and effectiveness are required' })
      };
    }

    if (!MONGODB_URI) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'MongoDB URI not configured' })
      };
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    try {
      const db = client.db('gryyk47');

      // Update all agent experiences from this session
      const result = await db.collection('agent_experiences').updateMany(
        { sessionId },
        {
          $set: {
            'experience.effectiveness': effectiveness,
            'experience.outcome': outcome,
            'experience.userFeedback': outcome,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Updated ${result.modifiedCount} memories for session ${sessionId}`);

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          memoriesUpdated: result.modifiedCount
        })
      };

    } finally {
      await client.close();
    }

  } catch (error) {
    console.error('Update memory error:', error);
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
