export const EVE_SSO_CONFIG = {
  // Client credentials from EVE Developer Portal
  clientId: import.meta.env.VITE_EVE_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_EVE_CLIENT_SECRET || '',
  
  // Redirect URI - MUST match exactly what's registered in the EVE Developer Portal
  redirectUri: 'https://gryyk-47.netlify.app/callback',
  
  // Requested scopes - publicData is the minimum required
  scopes: ['publicData'],
  
  // EVE SSO OAuth endpoints
  authorizeUrl: 'https://login.eveonline.com/v2/oauth/authorize',
  tokenUrl: 'https://login.eveonline.com/v2/oauth/token',
  verifyUrl: 'https://login.eveonline.com/oauth/verify',
  
  // JWKS and metadata endpoints for token validation
  jwksUrl: 'https://login.eveonline.com/.well-known/jwks.json',
  metadataUrl: 'https://login.eveonline.com/.well-known/oauth-authorization-server',
  
  // Valid issuers for token validation - EVE SSO may use either format
  acceptedIssuers: ['login.eveonline.com', 'https://login.eveonline.com'],
  
  // Expected audience for token validation
  expectedAudience: 'EVE Online',
};
