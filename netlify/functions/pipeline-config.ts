import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { MongoClient, Db } from 'mongodb';

const mongoUri = process.env.MONGODB_URI || '';

interface PipelineConfig {
  corporationId: string;
  enabled: boolean;
  maxConcurrentRequests: number;
  rateLimitBuffer: number;
  retryAttempts: number;
  backoffStrategy: 'linear' | 'exponential';
  errorThreshold: number;
  ragIntegration: {
    enabled: boolean;
    batchSize: number;
    processingDelay: number;
    includeMetadata: boolean;
  };
  storage: {
    cacheEnabled: boolean;
    cacheDuration: number;
    persistToMongoDB: boolean;
    compressionEnabled: boolean;
  };
  monitoring: {
    metricsEnabled: boolean;
    alertOnFailures: boolean;
    performanceTracking: boolean;
  };
  updatedAt?: string;
  updatedBy?: string;
}

let cachedDb: Db | null = null;

async function connectToDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(mongoUri);
  const db = client.db('eve-ai');
  cachedDb = db;
  return db;
}

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const db = await connectToDatabase();
    const collection = db.collection('pipelineConfigs');

    // Get corporation ID from query params or body
    const corporationId = event.queryStringParameters?.corporationId ||
                         (event.body ? JSON.parse(event.body).corporationId : null);

    if (!corporationId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'corporationId is required' }),
      };
    }

    switch (event.httpMethod) {
      case 'GET': {
        // Retrieve pipeline configuration
        const config = await collection.findOne({ corporationId });

        if (!config) {
          // Return default configuration if none exists
          const defaultConfig: PipelineConfig = {
            corporationId,
            enabled: true,
            maxConcurrentRequests: 5,
            rateLimitBuffer: 80,
            retryAttempts: 3,
            backoffStrategy: 'exponential',
            errorThreshold: 5,
            ragIntegration: {
              enabled: true,
              batchSize: 10,
              processingDelay: 100,
              includeMetadata: true
            },
            storage: {
              cacheEnabled: true,
              cacheDuration: 60,
              persistToMongoDB: true,
              compressionEnabled: false
            },
            monitoring: {
              metricsEnabled: true,
              alertOnFailures: true,
              performanceTracking: true
            }
          };

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              config: defaultConfig,
              isDefault: true
            }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            config,
            isDefault: false
          }),
        };
      }

      case 'POST':
      case 'PUT': {
        // Save or update pipeline configuration
        if (!event.body) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Request body is required' }),
          };
        }

        const configData = JSON.parse(event.body);

        // Validate required fields
        if (typeof configData.enabled !== 'boolean') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid configuration data' }),
          };
        }

        const config: PipelineConfig = {
          ...configData,
          corporationId,
          updatedAt: new Date().toISOString(),
          updatedBy: event.headers['x-user-id'] || 'system'
        };

        // Upsert configuration
        const result = await collection.updateOne(
          { corporationId },
          {
            $set: config,
            $setOnInsert: { createdAt: new Date().toISOString() }
          },
          { upsert: true }
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            config,
            modified: result.modifiedCount > 0,
            upserted: result.upsertedCount > 0
          }),
        };
      }

      case 'DELETE': {
        // Delete configuration (reset to defaults)
        const result = await collection.deleteOne({ corporationId });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            deleted: result.deletedCount > 0
          }),
        };
      }

      default: {
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
      }
    }
  } catch (error) {
    console.error('Pipeline config error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler };
