import { EVE_SSO_CONFIG } from '../config/eve';
import type { Character, TokenData } from '../types/auth';
import * as jose from 'jose';

// Define types for JWKS data
interface JwksKey {
  kid: string;
  alg: string;
  [key: string]: unknown;
}

interface JwksData {
  keys: JwksKey[];
}

// Cache for JWKS data
let jwksCache: JwksData | null = null;
let jwksCacheExpiry = 0;
const JWKS_CACHE_DURATION = 300000; // 5 minutes in milliseconds

export const generateAuthUrl = () => {
  const state = crypto.randomUUID();
  // Store state in sessionStorage to verify when the callback is received
  sessionStorage.setItem('eve_auth_state', state);
  
  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: EVE_SSO_CONFIG.redirectUri,
    client_id: EVE_SSO_CONFIG.clientId,
    scope: EVE_SSO_CONFIG.scopes.join(' '),
    state,
  });

  return `${EVE_SSO_CONFIG.authorizeUrl}?${params.toString()}`;
};

export const exchangeAuthCode = async (code: string): Promise<TokenData> => {
  const basicAuth = btoa(`${EVE_SSO_CONFIG.clientId}:${EVE_SSO_CONFIG.clientSecret}`);
  
  // Create the request body with the redirect_uri parameter
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: EVE_SSO_CONFIG.redirectUri, // Include redirect_uri in token request
  });
  
  console.log('Token exchange request body:', body.toString());
  
  const response = await fetch(EVE_SSO_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Token exchange error response:', errorData);
    throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error || response.statusText}`);
  }

  const data = await response.json();
  console.log('Token exchange response:', data);
  
  // Validate the JWT token
  await validateJwtToken(data.access_token);
  
  // Calculate expiration time in milliseconds
  const expiresAt = Date.now() + data.expires_in * 1000;
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    scopes: data.scope ? data.scope.split(' ') : [],
  };
};

export const exchangeRefreshToken = async (refreshToken: string): Promise<TokenData> => {
  const basicAuth = btoa(`${EVE_SSO_CONFIG.clientId}:${EVE_SSO_CONFIG.clientSecret}`);
  
  const response = await fetch(EVE_SSO_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error || response.statusText}`);
  }

  const data = await response.json();
  
  // Validate the JWT token
  await validateJwtToken(data.access_token);
  
  // Calculate expiration time in milliseconds
  const expiresAt = Date.now() + data.expires_in * 1000;
  
  return {
    accessToken: data.access_token,
    // If a new refresh token is provided, use it; otherwise, keep the old one
    refreshToken: data.refresh_token || refreshToken,
    expiresAt,
    scopes: data.scope ? data.scope.split(' ') : [],
  };
};

export const getCharacterInfo = async (accessToken: string): Promise<Character> => {
  try {
    // Verify the token and extract character information
    const tokenData = await validateJwtToken(accessToken);
    
    console.log('Character token data:', tokenData);
    
    // Extract character ID from the sub claim
    // The format could be "EVE:CHARACTER:<character_id>" or "CHARACTER:EVE:<character_id>" or just a numeric ID
    let characterId: string;
    
    if (typeof tokenData.sub === 'string') {
      // Try different possible formats
      const characterIdMatch = 
        tokenData.sub.match(/EVE:CHARACTER:(\d+)/) || 
        tokenData.sub.match(/CHARACTER:EVE:(\d+)/) || 
        tokenData.sub.match(/(\d+)/);
      
      if (characterIdMatch) {
        characterId = characterIdMatch[1];
      } else {
        console.error('Unable to extract character ID from subject:', tokenData.sub);
        throw new Error('Invalid subject format in token');
      }
    } else if (typeof tokenData.sub === 'number') {
      // If the subject is already a number
      characterId = tokenData.sub.toString();
    } else {
      console.error('Unexpected subject type:', typeof tokenData.sub, tokenData.sub);
      throw new Error('Invalid subject format in token');
    }
    
    const characterName = tokenData.name;
    
    // Fetch additional character information from ESI
    // For now, we'll use placeholder data for corporation
    // In a real implementation, you would fetch this from the ESI API
    return {
      id: parseInt(characterId),
      name: characterName,
      corporation: {
        id: 987654321,
        name: 'Test Corporation',
      },
      portrait: `https://images.evetech.net/characters/${characterId}/portrait`,
    };
  } catch (error) {
    console.error('Error getting character info:', error);
    throw error;
  }
};

// Fetch JWKS data from EVE SSO
const fetchJwksData = async () => {
  // Check if we have cached JWKS data that's still valid
  if (jwksCache && jwksCacheExpiry > Date.now()) {
    return jwksCache;
  }
  
  // Fetch metadata to get the JWKS URI
  const metadataResponse = await fetch(EVE_SSO_CONFIG.metadataUrl);
  if (!metadataResponse.ok) {
    throw new Error(`Failed to fetch metadata: ${metadataResponse.statusText}`);
  }
  
  const metadata = await metadataResponse.json();
  const jwksUri = metadata.jwks_uri || EVE_SSO_CONFIG.jwksUrl;
  
  // Fetch JWKS data
  const jwksResponse = await fetch(jwksUri);
  if (!jwksResponse.ok) {
    throw new Error(`Failed to fetch JWKS: ${jwksResponse.statusText}`);
  }
  
  const jwksData = await jwksResponse.json();
  
  // Cache the JWKS data
  jwksCache = jwksData;
  jwksCacheExpiry = Date.now() + JWKS_CACHE_DURATION;
  
  return jwksData;
};

// Define JWT payload interface
interface JwtPayload {
  sub: string | number;
  name: string;
  exp: number;
  iss: string;
  aud: string[];
  [key: string]: unknown;
}

// Validate JWT token
export const validateJwtToken = async (token: string): Promise<JwtPayload> => {
  try {
    // Get the token header to extract key ID and algorithm
    const header = jose.decodeProtectedHeader(token);
    console.log('JWT Header:', header);
    
    // Fetch JWKS data
    const jwksData = await fetchJwksData();
    
    // Find the matching key
    const key = jwksData.keys.find(
      (k: JwksKey) => k.kid === header.kid && k.alg === header.alg
    );
    
    if (!key) {
      throw new Error('No matching key found in JWKS');
    }
    
    // Import the key
    const publicKey = await jose.importJWK(key, header.alg as string);
    
    // Verify the token
    const { payload } = await jose.jwtVerify(token, publicKey, {
      issuer: EVE_SSO_CONFIG.acceptedIssuers,
      audience: [EVE_SSO_CONFIG.clientId, EVE_SSO_CONFIG.expectedAudience],
    });
    
    console.log('JWT Payload:', payload);
    
    return payload as unknown as JwtPayload;
  } catch (err: unknown) {
    console.error('Token validation failed:', err);
    throw err;
  }
};

// Check if a token is valid
export const isTokenValid = async (token: string): Promise<boolean> => {
  try {
    await validateJwtToken(token);
    return true;
  } catch {
    return false;
  }
};
