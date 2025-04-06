import type { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { accessToken } = JSON.parse(event.body || '{}');

    if (!accessToken) {
      return {
        statusCode: 400,
        body: 'Missing access token',
      };
    }

    const response = await fetch('https://login.eveonline.com/oauth/verify', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: 'Failed to verify token',
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Auth verify error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};

export { handler };