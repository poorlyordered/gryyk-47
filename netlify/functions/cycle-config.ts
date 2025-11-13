import type { Handler } from '@netlify/functions';
import {
  getCycleConfiguration,
  setCycleConfiguration,
  getCycleStatus,
  getCycleHistory,
  type CycleConfiguration
} from './lib/cycle-scheduler';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
};

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  if (!MONGODB_URI) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'MongoDB URI not configured' })
    };
  }

  const corporationId = event.queryStringParameters?.corporationId;

  if (!corporationId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'corporationId is required' })
    };
  }

  try {
    // GET - Retrieve cycle configuration and status
    if (event.httpMethod === 'GET') {
      const [config, status, history] = await Promise.all([
        getCycleConfiguration(corporationId, MONGODB_URI),
        getCycleStatus(corporationId, MONGODB_URI),
        getCycleHistory(corporationId, MONGODB_URI, 6) // Last 6 cycles
      ]);

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          configuration: config,
          currentStatus: status,
          history
        })
      };
    }

    // POST/PUT - Create or update cycle configuration
    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');

      const config: Omit<CycleConfiguration, 'createdAt' | 'updatedAt'> = {
        corporationId,
        cycleStartDay: body.cycleStartDay || 1,
        timezone: body.timezone || 'UTC',
        enabled: body.enabled !== undefined ? body.enabled : true,
        autoReportGeneration: body.autoReportGeneration !== undefined ? body.autoReportGeneration : true,
        notificationEmail: body.notificationEmail
      };

      // Validate cycle start day
      if (config.cycleStartDay < 1 || config.cycleStartDay > 28) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'cycleStartDay must be between 1 and 28'
          })
        };
      }

      await setCycleConfiguration(config, MONGODB_URI);

      // Get the updated configuration
      const updatedConfig = await getCycleConfiguration(corporationId, MONGODB_URI);

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          configuration: updatedConfig
        })
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Cycle config error:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
