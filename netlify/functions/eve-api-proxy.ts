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
  } catch (_authError) {
    console.error('Authentication error:', _authError);
    const errorMessage = _authError instanceof Error ? _authError.message : String(_authError);
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: ' + errorMessage }) };
  }
  const { token } = authResult;

  const requestBody = JSON.parse(event.body || '{}');
  const { endpoint, corporationId, regionId, typeId, characterId, systemId } = requestBody;

  if (!endpoint) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required parameter: endpoint' }) };
  }

  // Enhanced router to handle comprehensive ESI endpoints
  try {
    let data;
    
    switch (endpoint) {
      case 'corporation_info':
        data = await fetchEsiData(token, `/corporations/${corporationId}/`);
        break;
        
      case 'corporation_members':
        data = await fetchEsiData(token, `/corporations/${corporationId}/members/`);
        break;
        
      case 'corporation_wallets':
        data = await fetchEsiData(token, `/corporations/${corporationId}/wallets/`);
        break;
        
      case 'market_orders': {
        if (!regionId) {
          return { statusCode: 400, body: JSON.stringify({ error: 'regionId required for market_orders' }) };
        }
        const ordersUrl = typeId
          ? `/markets/${regionId}/orders/?type_id=${typeId}`
          : `/markets/${regionId}/orders/`;
        data = await fetchEsiData(token, ordersUrl);
        break;
      }
        
      case 'market_history':
        if (!regionId || !typeId) {
          return { statusCode: 400, body: JSON.stringify({ error: 'regionId and typeId required for market_history' }) };
        }
        data = await fetchEsiData(token, `/markets/${regionId}/history/?type_id=${typeId}`);
        break;
        
      case 'character_info':
        if (!characterId) {
          return { statusCode: 400, body: JSON.stringify({ error: 'characterId required for character_info' }) };
        }
        data = await fetchEsiData(token, `/characters/${characterId}/`);
        break;
        
      case 'system_info':
        if (!systemId) {
          return { statusCode: 400, body: JSON.stringify({ error: 'systemId required for system_info' }) };
        }
        data = await fetchEsiData(token, `/universe/systems/${systemId}/`);
        break;
        
      case 'corporation_bundle': {
        // Special endpoint that fetches multiple data points
        const [corpInfo, members, wallets] = await Promise.all([
          fetchEsiData(token, `/corporations/${corporationId}/`),
          fetchEsiData(token, `/corporations/${corporationId}/members/`),
          fetchEsiData(token, `/corporations/${corporationId}/wallets/`)
        ]);
        data = {
          corporation: corpInfo,
          members,
          wallets,
          timestamp: new Date().toISOString()
        };
        break;
      }
        
      case 'strategic_intelligence':
        // Custom endpoint for strategic analysis - just return the provided data
        data = requestBody.data;
        break;
        
      default:
        return { statusCode: 400, body: JSON.stringify({ error: `Invalid ESI endpoint: ${endpoint}` }) };
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