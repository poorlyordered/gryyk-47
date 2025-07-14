import type { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

const MONGODB_URI = 'mongodb+srv://netgleb:zzNvxXyOLBOeKqdM@gryyk-47.hsipgxw.mongodb.net/?retryWrites=true&w=majority&appName=Gryyk-47';
const DB_NAME = 'gryyk47';
const COLLECTION = 'eve_sso_scopes';

const handler: Handler = async (event) => {
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
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { characterId } = JSON.parse(event.body || '{}');
    if (!characterId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing characterId' }),
      };
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    // Find all SSO records for this character, most recent first
    const records = await collection
      .find({ characterId: characterId.toString() })
      .sort({ timestamp: -1 })
      .toArray();

    await client.close();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ records }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
    };
  }
};

export { handler };