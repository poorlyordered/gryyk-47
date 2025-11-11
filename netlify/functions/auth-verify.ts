import type { Handler } from '@netlify/functions';
import { MongoClient, ServerApiVersion } from 'mongodb';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

const MONGODB_URI = 'mongodb+srv://netgleb:zzNvxXyOLBOeKqdM@gryyk-47.hsipgxw.mongodb.net/?retryWrites=true&w=majority&appName=Gryyk-47';
const DB_NAME = 'gryyk47';
const COLLECTION = 'eve_sso_scopes';

// Connection pooling - reuse client between invocations
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    console.log('🔍 Reusing cached MongoDB connection');
    return { client: cachedClient, db: cachedDb };
  }

  console.log('🔍 Creating new MongoDB connection');
  const client = new MongoClient(MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

const handler: Handler = async (event) => {
  console.log('🔍 Auth verify function called with method:', event.httpMethod);
  
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    console.log('🔍 Handling CORS preflight request');
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }
  
  if (event.httpMethod !== 'POST') {
    console.log('🔍 Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    console.log('🔍 Auth verify function called');
    const { accessToken } = JSON.parse(event.body || '{}');
    console.log('🔍 Access token received:', accessToken ? 'Yes' : 'No');

    if (!accessToken) {
      console.log('🔍 Missing access token');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing access token' }),
      };
    }

    console.log('🔍 Calling EVE SSO verify endpoint');
    // Use the ESI verify endpoint
    const response = await fetch('https://esi.evetech.net/verify/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('🔍 EVE SSO verify response status:', response.status);
    
    if (!response.ok) {
      console.error('🔍 EVE SSO verify failed:', response.status, response.statusText);
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Failed to verify token',
          status: response.status,
          statusText: response.statusText
        }),
      };
    }

    const data = await response.json();
    console.log('🔍 EVE SSO verify data received:', JSON.stringify(data));

    // Store SSO scope/corp/character info in MongoDB
    try {
      console.log('🔍 Connecting to MongoDB to store SSO info');
      const { db } = await connectToDatabase();
      const collection = db.collection(COLLECTION);

      // Prepare document
      const doc = {
        characterId: data.CharacterID ? data.CharacterID.toString() : null,
        characterName: data.CharacterName || null,
        corporationId: data.CorporationId ? data.CorporationId.toString() : null,
        corporationName: data.CorporationName || null,
        scopes: data.Scopes ? data.Scopes.split(' ') : [],
        timestamp: new Date().toISOString(),
        rawESIVerify: data
      };

      await collection.insertOne(doc);
      console.log('🔍 SSO scope/corp/character info stored in MongoDB');
    } catch (mongoErr) {
      console.error('🔍 Failed to store SSO info in MongoDB:', mongoErr);
      // Do not block response to client if MongoDB fails
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('🔍 Auth verify error:', error);
    // More detailed error response
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