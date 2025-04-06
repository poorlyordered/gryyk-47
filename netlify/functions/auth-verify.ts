import type { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    console.log('🔍 Auth verify function called');
    const { accessToken } = JSON.parse(event.body || '{}');
    console.log('🔍 Access token received:', accessToken ? 'Yes' : 'No');

    if (!accessToken) {
      console.log('🔍 Missing access token');
      return {
        statusCode: 400,
        body: 'Missing access token',
      };
    }

    console.log('🔍 Calling EVE SSO verify endpoint');
    // Fixed URL to use v2 endpoint
    const response = await fetch('https://login.eveonline.com/v2/oauth/verify', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('🔍 EVE SSO verify response status:', response.status);
    
    if (!response.ok) {
      console.error('🔍 EVE SSO verify failed:', response.status, response.statusText);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: 'Failed to verify token',
          status: response.status,
          statusText: response.statusText
        }),
      };
    }

    const data = await response.json();
    console.log('🔍 EVE SSO verify data received:', JSON.stringify(data));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('🔍 Auth verify error:', error);
    // More detailed error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
    };
  }
};

export { handler };