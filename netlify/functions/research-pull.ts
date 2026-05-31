import type { Handler } from '@netlify/functions';
import { authenticateEveUser } from './auth-middleware';
import { runResearchPull } from './lib/research-engine';

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
    const response = await runResearchPull({
      corporationId: body.corporationId || DEFAULT_CORPORATION_ID,
      requestedBy: authResult.user.characterId.toString(),
      focus: body.focus || 'All strategic areas',
      limit: body.limit || 12,
    });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Research pull error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
