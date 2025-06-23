import fetch from 'node-fetch';

// EVE Online SSO configuration
const EVE_CLIENT_ID = process.env.EVE_CLIENT_ID;
const EVE_CLIENT_SECRET = process.env.EVE_CLIENT_SECRET;
const EVE_SSO_VERIFY_URL = 'https://login.eveonline.com/v2/oauth/verify';

// Interface for token verification response
interface VerifyResponse {
  CharacterID: number;
  CharacterName: string;
  ExpiresOn: string;
  Scopes: string;
  TokenType: string;
  CharacterOwnerHash: string;
}

// Interface for user information
export interface EveUser {
  userId: string;
  characterId: number;
  characterName: string;
  expiresOn: string;
  scopes: string[];
}

export interface AuthenticatedUser {
  user: EveUser;
  token: string;
}

// Verify an EVE Online JWT token
export const verifyEveToken = async (token: string): Promise<VerifyResponse> => {
  if (!EVE_CLIENT_ID || !EVE_CLIENT_SECRET) {
    throw new Error('EVE Online SSO credentials not configured');
  }

  try {
    // Verify the token with EVE Online SSO
    const response = await fetch(EVE_SSO_VERIFY_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`EVE SSO verification failed: ${response.statusText}`);
    }

    return await response.json() as VerifyResponse;
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Failed to verify EVE Online token');
  }
};

// Extract user information from the EVE Online verification response
export const extractUserInfo = (verifyResponse: VerifyResponse): EveUser => {
  return {
    userId: verifyResponse.CharacterOwnerHash, // Use the character owner hash as the user ID
    characterId: verifyResponse.CharacterID,
    characterName: verifyResponse.CharacterName,
    expiresOn: verifyResponse.ExpiresOn,
    scopes: verifyResponse.Scopes.split(' ')
  };
};

// Authenticate a user using the EVE Online SSO
export const authenticateEveUser = async (headers: { [key: string]: string | undefined }): Promise<AuthenticatedUser> => {
  // Get the authorization header
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  // Extract the token
  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new Error('Missing token');
  }

  // Verify the token and extract user information
  const verifyResponse = await verifyEveToken(token);
  return { 
    user: extractUserInfo(verifyResponse), 
    token 
  };
};
