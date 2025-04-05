import { jwtDecode } from 'jwt-decode';

interface EveJWT {
  sub: string;
  name: string;
  owner: string;
  characterID: number;
  scp?: string[];
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
