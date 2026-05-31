import type { Handler } from '@netlify/functions';
import { authenticateEveUser } from './auth-middleware';
import { corsHeaders, getLatestResearchBrief, getResearchFilter } from './lib/research-store';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    await authenticateEveUser(event.headers);
    const filter = getResearchFilter(event.queryStringParameters || {});
    const brief = await getLatestResearchBrief(filter);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief, corporationId: filter.corporationId, focus: filter.focus }),
    };
  } catch (error) {
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
