export interface Character {
  id: number;
  name: string;
  corporation: {
    id: number;
    name: string;
  };
  portrait: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
  scopes: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  character: Character | null;
  tokenData: TokenData | null;
  login: (tokenData: TokenData) => void;
  logout: () => void;
  setCharacter: (character: Character) => void;
  refreshToken: () => Promise<boolean>;
  isTokenValid: () => boolean;
}
