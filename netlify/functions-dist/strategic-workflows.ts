import { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';
import { authenticateEveUser, AuthenticatedUser } from './auth-middleware';
import fetch from 'node-fetch';

// Ensure environment variables are loaded
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Fetches all strategic matrix documents for a given corporation.
 * @param client - The MongoDB client.
 * @param corporationId - The ID of the corporation.
 * @returns A summary of the strategic context.
 */
const getStrategicMatrixContext = async (client: MongoClient, corporationId: string) => {
  console.log(`Fetching strategic context for corporation ID: ${corporationId}`);
  
  const strategicMatrixCollection = client.db('Gryyk-47').collection('strategic-matrix');
  
  const documents = await strategicMatrixCollection.find({ corporationId }).toArray();
  
  if (documents.length === 0) {
    return {
      summary: "No strategic documents found for this corporation. The Strategic Matrix is empty.",
      documents: [],
    };
  }

  // Create a summary for the AI prompt
  const summary = `Found ${documents.length} strategic documents. Key areas covered are: ${documents.map(d => d.documentType).join(', ')}.`;

  return {
    summary,
    documents,
  };
};

export const handler: Handler = async (event) => {
  if (!MONGODB_URI) {
    return { statusCode: 500, body: JSON.stringify({ error: 'MongoDB URI not configured' }) };
  }
  
  let authResult: AuthenticatedUser;
  try {
    authResult = await authenticateEveUser(event.headers);
  } catch (authError) {
    const errorMessage = authError instanceof Error ? authError.message : String(authError);
    return { statusCode: 401, body: JSON.stringify({ error: `Unauthorized: ${errorMessage}` }) };
  }

  try {
    const { token } = authResult;
    const { corporationId } = JSON.parse(event.body || '{}');

    if (!corporationId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'corporationId is required' }) };
    }
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    // Fetch both matrix context and live EVE data in parallel
    const [matrixContext, eveData] = await Promise.all([
      getStrategicMatrixContext(client, corporationId),
      fetch(`${process.env.URL}/.netlify/functions/eve-api-proxy`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ endpoint: 'corporation_info', corporationId }),
      }).then(res => res.json())
    ]);

    await client.close();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        ...matrixContext,
        liveEveData: {
          corporationInfo: eveData,
        }
      }),
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Server error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error: ' + errorMessage }) };
  }
};