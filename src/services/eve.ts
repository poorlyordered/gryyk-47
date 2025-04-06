import { jwtDecode } from 'jwt-decode';

interface EveJWT {
  sub: string;
  name: string;
  owner: string;
  characterID: number;
  scp?: string[];
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
      "publicData"
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
  const response = await fetch('/.netlify/functions/auth-verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ accessToken })
  });

  if (!response.ok) {
    throw new Error('Failed to fetch character info');
  }

  return response.json();
}
