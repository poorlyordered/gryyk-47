import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';
import { authenticateEveUser, AuthenticatedUser } from './auth-middleware';

const ESI_BASE_URL = 'https://esi.evetech.net/latest';

// A generic function to make authenticated requests to the ESI API
const fetchEsiData = async (token: string, endpoint: string) => {
  const response = await fetch(`${ESI_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`ESI request failed with status ${response.status}: ${await response.text()}`);
  }
  return response.json();
};

export const handler: Handler = async (event) => {
  let authResult: AuthenticatedUser;
  try {
    authResult = await authenticateEveUser(event.headers);
  } catch (authError) {
    console.error('Authentication error:', authError);
    const errorMessage = authError instanceof Error ? authError.message : String(authError);
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: ' + errorMessage }) };
  }
  const { token } = authResult;

  const { endpoint, corporationId } = JSON.parse(event.body || '{}');

  if (!endpoint || !corporationId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required parameters: endpoint, corporationId' }) };
  }

  // A simple router to handle different ESI endpoints
  // This can be expanded to cover more data points as needed
  try {
    let data;
    switch (endpoint) {
      case 'corporation_info':
        data = await fetchEsiData(token, `/corporations/${corporationId}/`);
        break;
      // Add more cases here for assets, wallets, members etc.
      // case 'corporation_assets':
      //   data = await fetchEsiData(user.token, `/corporations/${corporationId}/assets/`);
      //   break;
      default:
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid ESI endpoint provided' }) };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error(`ESI proxy error for endpoint ${endpoint}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { statusCode: 502, body: JSON.stringify({ error: `ESI API error: ${errorMessage}` }) };
  }
}; 