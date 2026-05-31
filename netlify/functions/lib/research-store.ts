import { MongoClient, ObjectId } from 'mongodb';

export const RESEARCH_CORPORATION_ID = '917701062';
export const RESEARCH_FOCUS = 'grykk-47-eve-official-news';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'Gryyk-47';

let cachedClient: MongoClient | null = null;

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function validateMongoConfig() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must start with "mongodb://" or "mongodb+srv://"');
  }
}

export async function connectToResearchDb() {
  validateMongoConfig();

  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI as string, {
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      tls: true,
    });
    await cachedClient.connect();
  }

  return cachedClient.db(DB_NAME);
}

export function getResearchFilter(query: Record<string, string | undefined> = {}) {
  return {
    corporationId: query.corporationId || RESEARCH_CORPORATION_ID,
    focus: query.focus || RESEARCH_FOCUS,
  };
}

function serializeValue(value: unknown): unknown {
  if (value instanceof ObjectId) {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [key, serializeValue(entryValue)])
    );
  }

  return value;
}

export function serializeDocument<T>(document: T | null): T | null {
  return serializeValue(document) as T | null;
}

export function adaptBrief(brief: any) {
  if (!brief) return brief;

  return {
    ...brief,
    strategicImpacts: Array.isArray(brief.strategicImpacts)
      ? brief.strategicImpacts.map((impact: any) =>
          typeof impact === 'string'
            ? {
                area: 'Official EVE news',
                impact,
                urgency: 'medium',
              }
            : impact
        )
      : [],
    memory: Array.isArray(brief.memory) ? brief.memory.join('\n') : brief.memory || '',
  };
}

export async function getLatestResearchStatus(filter: { corporationId: string; focus: string }) {
  const db = await connectToResearchDb();
  const request = await db.collection('research_requests').find(filter).sort({ createdAt: -1 }).limit(1).next();
  return serializeDocument(request);
}

export async function getLatestResearchBrief(filter: { corporationId: string; focus: string }) {
  const db = await connectToResearchDb();
  const document = await db.collection('research_briefs').find(filter).sort({ createdAt: -1 }).limit(1).next();

  if (!document) return null;

  return serializeDocument({
    ...document,
    id: document._id,
    itemCount: Array.isArray(document.items) ? document.items.length : 0,
    sourceCount: Array.isArray(document.sources) ? document.sources.length : 0,
    brief: adaptBrief(document.brief),
  });
}
