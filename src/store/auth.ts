import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, Character, TokenData } from '../types/auth';
import { exchangeRefreshToken } from '../services/eve';

const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      character: null,
      tokenData: null,
      
      login: (tokenData: TokenData) => set({ 
        isAuthenticated: true, 
        tokenData 
      }),
      
      logout: () => set({ 
        isAuthenticated: false, 
        character: null, 
        tokenData: null 
      }),
      
      setCharacter: (character: Character) => set({ 
        character 
      }),
      
      isTokenValid: () => {
        const { tokenData } = get();
        if (!tokenData) return false;
        
        // Check if token is expired (with 30 second buffer)
        return tokenData.expiresAt > Date.now() + 30000;
      },
      
      refreshToken: async () => {
        const { tokenData } = get();
        console.debug('refreshToken: current tokenData', tokenData);
        if (!tokenData?.refreshToken) return false;
        
        try {
          const newTokenData = await exchangeRefreshToken(tokenData.refreshToken);
          console.debug('refreshToken: new tokenData', newTokenData);
          set({ tokenData: newTokenData });
          return true;
        } catch (error) {
          console.error('Failed to refresh token:', error);
          return false;
        }
      },
    }),
    {
      name: 'eve-auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        character: state.character,
        tokenData: state.tokenData,
      }),
    }
  )
);

export const useAuthStore = authStore;
export { authStore };
