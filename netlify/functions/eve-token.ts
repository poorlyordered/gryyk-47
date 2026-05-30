import type { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const EVE_TOKEN_URL = 'https://login.eveonline.com/v2/oauth/token';
const EVE_CLIENT_ID = process.env.EVE_CLIENT_ID;
const EVE_CLIENT_SECRET = process.env.EVE_CLIENT_SECRET;
const EVE_REDIRECT_URI = process.env.EVE_REDIRECT_URI || 'https://gryyk-47.netlify.app/callback';

interface EveJwtPayload {
  characterID?: number;
  sub?: string;
}

function decodeJwtPayload(token: string): EveJwtPayload {
  const payload = token.split('.')[1];
  if (!payload) return {};

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

function getCharacterId(accessToken: string): string {
  const decoded = decodeJwtPayload(accessToken);
  return decoded.characterID
    ? decoded.characterID.toString()
    : (decoded.sub?.split(':').pop() || '');
}

async function requestToken(params: URLSearchParams) {
  if (!EVE_CLIENT_ID || !EVE_CLIENT_SECRET) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'EVE SSO credentials are not configured' })
    };
  }

  const credentials = Buffer.from(`${EVE_CLIENT_ID}:${EVE_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(EVE_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('EVE token exchange failed', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });

    let details = response.statusText;
    try {
      const parsed = JSON.parse(errorText);
      details = parsed.error_description || parsed.error || details;
    } catch (_error) {
      details = errorText || details;
    }

    return {
      statusCode: response.status,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'EVE token exchange failed',
        details
      })
    };
  }

  const data = await response.json();
  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      scopes: typeof data.scope === 'string' ? data.scope.split(' ') : [],
      characterId: getCharacterId(data.access_token)
    })
  };
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { grantType, code, refreshToken, redirectUri } = JSON.parse(event.body || '{}');

    if (grantType === 'authorization_code') {
      if (!code) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Authorization code is required' })
        };
      }

      return requestToken(new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri || EVE_REDIRECT_URI
      }));
    }

    if (grantType === 'refresh_token') {
      if (!refreshToken) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Refresh token is required' })
        };
      }

      return requestToken(new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }));
    }

    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unsupported grant type' })
    };
  } catch (error) {
    console.error('EVE token function failed:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

export { handler };
