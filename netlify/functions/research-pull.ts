import type { Handler } from '@netlify/functions';
import { authenticateEveUser } from './auth-middleware';
import { inngest } from './lib/inngest-client';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_CORPORATION_ID = process.env.RESEARCH_CORPORATION_ID || 'global';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const authResult = await authenticateEveUser(event.headers);
    const body = JSON.parse(event.body || '{}');
    const corporationId = body.corporationId || DEFAULT_CORPORATION_ID;
    const focus = body.focus || 'All strategic areas';
    const limit = Math.min(body.limit || 8, 8);

    const sendResult = await inngest.send({
      name: 'gryyk/research.pull',
      data: {
        corporationId,
        requestedBy: authResult.user.characterId.toString(),
        focus,
        limit,
      },
    });

    return {
      statusCode: 202,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queued: true,
        eventIds: sendResult.ids,
        corporationId,
        focus,
        limit,
      }),
    };
  } catch (error) {
    console.error('Research pull error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isAuthError = /authorization|token|verify EVE/i.test(message);
    return {
      statusCode: isAuthError ? 401 : 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: isAuthError ? 'Unauthorized' : 'Internal server error',
        message,
      }),
    };
  }
};
