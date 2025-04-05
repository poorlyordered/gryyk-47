import { authStore } from '../../store/auth';

export const getAuthToken = async (): Promise<string | null> => {
  const state = authStore.getState();
  return state.tokenData?.accessToken || null;
};

export const isAuthenticated = async (): Promise<boolean> => {
  const state = authStore.getState();
  return !!state.tokenData?.accessToken;
};

export type AuthModule = {
  getAuthToken: typeof getAuthToken;
  isAuthenticated: typeof isAuthenticated;
};