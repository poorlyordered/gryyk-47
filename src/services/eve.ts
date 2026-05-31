import { jwtDecode } from 'jwt-decode';
import { EVE_SSO_CONFIG } from '../config/eve';

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

interface CharacterPublicInfo {
  corporation_id: number;
  name: string;
  // Add other fields as needed
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
  const response = await fetch('/.netlify/functions/eve-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grantType: 'refresh_token',
      refreshToken
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token refresh failed:', response.status, errorText);
    throw new Error(`Failed to refresh token: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

async function getTokenErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error === 'string') {
      return data.details ? `${data.error}: ${data.details}` : data.error;
    }
  } catch (_error) {
    try {
      const text = await response.text();
      if (text) return text;
    } catch (_textError) {
      // Use fallback below.
    }
  }

  return fallback;
}
/**
 * Generate the EVE SSO OAuth2 authorization URL
 */
export function generateAuthUrl(state: string = ''): string {
  const redirectUri = import.meta.env.VITE_EVE_REDIRECT_URI || EVE_SSO_CONFIG.redirectUri;
  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: redirectUri,
    client_id: EVE_SSO_CONFIG.clientId,
    scope: [
      // Basic character data
      "publicData",

      // Character-level permissions
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
      "esi-characters.read_fw_stats.v1",

      // CEO Dashboard - Corporation Management Scopes
      "esi-corporations.read_structures.v1",
      "esi-wallet.read_corporation_wallets.v1",
      "esi-assets.read_corporation_assets.v1",
      "esi-industry.read_corporation_jobs.v1",
      "esi-contracts.read_corporation_contracts.v1",
      "esi-corporations.read_divisions.v1",
      "esi-corporations.read_facilities.v1",
      "esi-corporations.read_medals.v1",
      "esi-corporations.read_titles.v1",
      "esi-corporations.track_members.v1",

      // Market and Trading
      "esi-markets.structure_markets.v1",

      // Killmails for threat analysis
      "esi-killmails.read_corporation_killmails.v1"
    ].join(' '),
    state
  });
  return `${EVE_SSO_CONFIG.authorizeUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeAuthCode(code: string): Promise<TokenData> {
  const redirectUri = import.meta.env.VITE_EVE_REDIRECT_URI || EVE_SSO_CONFIG.redirectUri;
  const response = await fetch('/.netlify/functions/eve-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grantType: 'authorization_code',
      code,
      redirectUri
    })
  });

  if (!response.ok) {
    const message = await getTokenErrorMessage(response, 'Failed to exchange auth code');
    throw new Error(message);
  }

  const data = await response.json();
  return data;
}

/**
 * Get character info from EVE SSO using access token
 */
export async function getCharacterInfo(accessToken: string): Promise<CharacterInfo> {
  try {
    console.log('🔍 Calling Netlify function for character info');
    const response = await fetch('/.netlify/functions/auth-verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accessToken })
    });

    if (!response.ok) {
      console.error('🔍 Netlify function failed:', response.status, response.statusText);
      throw new Error('Netlify function failed');
    }

    const data = await response.json();
    console.log('🔍 Character info from Netlify function:', data);
    return data;
  } catch (error) {
    console.error('🔍 Netlify function error:', error);

    // EVE SSO access tokens are JWTs; the old verify endpoint is no longer reliable.
    try {
      console.log('🔍 Falling back to JWT decoding');
      const decoded = jwtDecode<EveJWT>(accessToken);
      const characterId = decoded.characterID ||
        (decoded.sub ? parseInt(decoded.sub.split(':').pop() || '0') : 0);

      const fallbackResponse: CharacterInfo = {
        CharacterID: characterId,
        CharacterName: decoded.name || 'Unknown Character',
        ExpiresOn: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : new Date(Date.now() + 1000 * 60 * 20).toISOString(),
        Scopes: decoded.scp ? decoded.scp.join(' ') : '',
        TokenType: 'Character',
        CharacterOwnerHash: decoded.owner || '',
        IntellectualProperty: 'EVE'
      };

      console.log('🔍 Fallback character info:', fallbackResponse);
      return fallbackResponse;
    } catch (jwtError) {
      console.error('🔍 JWT decoding error:', jwtError);
      throw new Error('Failed to fetch character info');
    }
  }
}

/**
 * Get character's public information including corporation ID
 */
export async function getCharacterPublicInfo(characterId: number): Promise<CharacterPublicInfo> {
  try {
    const response = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/`);

    if (!response.ok) {
      throw new Error(`Failed to fetch character public info: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch character public info:', error);
    throw error;
  }
}

/**
 * Get corporation information
 */
export async function getCorporationInfo(corporationId: number): Promise<{ name: string; ticker: string }> {
  try {
    const response = await fetch(`https://esi.evetech.net/latest/corporations/${corporationId}/`);

    if (!response.ok) {
      throw new Error(`Failed to fetch corporation info: ${response.status}`);
    }

    const data = await response.json();
    return {
      name: data.name,
      ticker: data.ticker
    };
  } catch (error) {
    console.error('Failed to fetch corporation info:', error);
    throw error;
  }
}
