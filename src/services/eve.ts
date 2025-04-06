import { jwtDecode } from 'jwt-decode';

export interface EveJWT {
  sub: string;
  name: string;
  owner: string;
  characterID: number;
  scp?: string[];
  exp?: number;
}

interface CharacterInfo {
  CharacterID: number;
  CharacterName: string;
  ExpiresOn: string;
  Scopes: string;
  TokenType: string;
  CharacterOwnerHash: string;
  IntellectualProperty: string;
}

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
  characterId: string;
}

export const verifyToken = async (token: string): Promise<{characterId: string} | null> => {
  try {
    const decoded = jwtDecode<EveJWT>(token);
    return {
      characterId: decoded.characterID.toString()
    };
  } catch (err) {
    console.error('Token verification failed:', err);
    return null;
  }
};

export const exchangeRefreshToken = async (refreshToken: string): Promise<TokenData> => {
  // TODO: Implement actual EVE SSO token exchange
  // For now return mock data with required fields
  return {
    accessToken: 'mock-access-token',
    refreshToken: refreshToken,
    expiresAt: Date.now() + 3600 * 1000,
    scopes: ['esi-characters.read_standings.v1'],
    characterId: '123456789' // Mock character ID
  };
};
/**
 * Generate the EVE SSO OAuth2 authorization URL
 */
export function generateAuthUrl(state: string = ''): string {
  const baseUrl = 'https://login.eveonline.com/v2/oauth/authorize';
  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: 'https://gryyk-47.netlify.app/callback',
    client_id: '171210e5cb0541db8069ec6c4db7f0d5',
    scope: [
      "publicData",
      "esi-characters.read_contacts.v1",
      "esi-characters.write_contacts.v1",
      "esi-characters.read_loyalty.v1",
      "esi-characters.read_chat_channels.v1",
      "esi-characters.read_medals.v1",
      "esi-characters.read_standings.v1",
      "esi-characters.read_agents_research.v1",
      "esi-characters.read_blueprints.v1",
      "esi-characters.read_corporation_roles.v1",
      "esi-characters.read_fatigue.v1",
      "esi-characters.read_notifications.v1",
      "esi-characters.read_titles.v1",
      "esi-characters.read_fw_stats.v1"
    ].join(' '),
    state
  });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeAuthCode(code: string): Promise<TokenData> {
  const tokenUrl = 'https://login.eveonline.com/v2/oauth/token';
  const credentials = btoa('171210e5cb0541db8069ec6c4db7f0d5:2U15oaS3SN1D2x0l3gHXGHXAV4oa3SoOZsXUDuBy');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://gryyk-47.netlify.app/callback'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to exchange auth code');
  }

  const data = await response.json();
  console.debug('exchangeAuthCode: token response', data);

  const decoded = jwtDecode<EveJWT>(data.access_token);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scopes: typeof data.scope === 'string' ? data.scope.split(' ') : [],
    characterId: decoded.characterID
      ? decoded.characterID.toString()
      : (decoded.sub?.split(':').pop() ?? '')
  };
}

/**
 * Get character info from EVE SSO using access token
 */
export async function getCharacterInfo(accessToken: string): Promise<CharacterInfo> {
  try {
    console.log('🔍 Using mock implementation for character info');
    
    // Since we can't access the EVE SSO API directly due to CORS,
    // and the Netlify function is not working, we'll create a mock response
    // This is a temporary solution until the Netlify function is fixed
    
    // Decode the JWT token to get the character ID
    const decoded = jwtDecode<EveJWT>(accessToken);
    const characterId = decoded.characterID ||
      (decoded.sub ? parseInt(decoded.sub.split(':').pop() || '0') : 0);
    
    // Create a mock response based on the JWT token
    const mockResponse: CharacterInfo = {
      CharacterID: characterId,
      CharacterName: decoded.name || 'Unknown Character',
      ExpiresOn: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour from now
      Scopes: decoded.scp ? decoded.scp.join(' ') : '',
      TokenType: 'Character',
      CharacterOwnerHash: decoded.owner || '',
      IntellectualProperty: 'EVE'
    };
    
    console.log('🔍 Mock character info:', mockResponse);
    return mockResponse;
  } catch (error) {
    console.error('🔍 Mock character info error:', error);
    throw new Error('Failed to fetch character info');
  }
}
