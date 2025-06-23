/**
 * Utility functions for EVE SSO OAuth2 state parameter management.
 * Ensures state is securely generated, stored, and validated.
 */

const STATE_KEY = 'eve-sso-state';

/**
 * Generate a cryptographically secure random state string.
 */
export function generateState(): string {
  const array = new Uint32Array(8);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => dec.toString(16)).join('');
}

/**
 * Store the state in sessionStorage.
 */
export function storeState(state: string) {
  sessionStorage.setItem(STATE_KEY, state);
}

/**
 * Retrieve the stored state from sessionStorage.
 */
export function getStoredState(): string | null {
  return sessionStorage.getItem(STATE_KEY);
}

/**
 * Remove the stored state from sessionStorage.
 */
export function clearStoredState() {
  sessionStorage.removeItem(STATE_KEY);
}