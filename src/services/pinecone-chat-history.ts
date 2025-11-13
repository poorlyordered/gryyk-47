import { Pinecone } from '@pinecone-database/pinecone';
import type { Message } from '../types/chat';

/**
 * Pinecone Chat History Service
 *
 * Stores and retrieves chat conversations using semantic search.
 * Enables finding similar past conversations based on meaning.
 */

const PINECONE_API_KEY = import.meta.env.VITE_PINECONE_API_KEY;
const INDEX_NAME = 'chat-history';
const INDEX_HOST = 'https://gleaming-aspen-n82odxp.svc.aped-4627-b74a.pinecone.io';

// Initialize Pinecone client (singleton)
let pineconeClient: Pinecone | null = null;

const getPineconeClient = () => {
  if (!pineconeClient && PINECONE_API_KEY) {
    pineconeClient = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });
  }
  return pineconeClient;
};

/**
 * Convert text to embeddings using OpenRouter's embedding model
 */
async function getEmbedding(text: string): Promise<number[]> {
  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Gryyk-47 EVE Online AI Assistant'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  });

  if (!response.ok) {
    throw new Error(`Embedding failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Store a conversation in Pinecone
 */
export async function storeChatConversation(
  sessionId: string,
  messages: Message[],
  metadata?: {
    corporationId?: string;
    userId?: string;
    tags?: string[];
  }
): Promise<void> {
  const client = getPineconeClient();

  if (!client) {
    console.warn('Pinecone not configured, skipping chat history storage');
    return;
  }

  try {
    const index = client.index(INDEX_NAME, INDEX_HOST);

    // Create a summary of the conversation for embedding
    const conversationText = messages
      .filter(m => m.sender !== 'system')
      .map(m => `${m.sender}: ${m.content}`)
      .join('\n');

    // Get embedding for the conversation
    const embedding = await getEmbedding(conversationText);

    // Store in Pinecone
    await index.upsert([{
      id: sessionId,
      values: embedding,
      metadata: {
        sessionId,
        corporationId: metadata?.corporationId || '',
        userId: metadata?.userId || '',
        tags: metadata?.tags || [],
        messageCount: messages.length,
        timestamp: Date.now(),
        preview: conversationText.substring(0, 500) // First 500 chars as preview
      }
    }]);

    console.log(`✅ Stored conversation ${sessionId} in Pinecone`);
  } catch (error) {
    console.error('Failed to store conversation in Pinecone:', error);
    // Don't throw - this is a non-critical feature
  }
}

/**
 * Find similar past conversations
 */
export async function findSimilarConversations(
  query: string,
  options?: {
    topK?: number;
    corporationId?: string;
    userId?: string;
    minScore?: number;
  }
): Promise<Array<{
  sessionId: string;
  score: number;
  preview: string;
  timestamp: number;
  messageCount: number;
}>> {
  const client = getPineconeClient();

  if (!client) {
    console.warn('Pinecone not configured, returning empty results');
    return [];
  }

  try {
    const index = client.index(INDEX_NAME, INDEX_HOST);

    // Get embedding for the query
    const embedding = await getEmbedding(query);

    // Build filter
    const filter: Record<string, string> = {};
    if (options?.corporationId) {
      filter.corporationId = options.corporationId;
    }
    if (options?.userId) {
      filter.userId = options.userId;
    }

    // Query Pinecone
    const results = await index.query({
      vector: embedding,
      topK: options?.topK || 5,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      includeMetadata: true
    });

    // Filter by score and format results
    const minScore = options?.minScore || 0.7;
    return results.matches
      .filter(match => match.score && match.score >= minScore)
      .map(match => ({
        sessionId: match.metadata?.sessionId as string,
        score: match.score || 0,
        preview: match.metadata?.preview as string,
        timestamp: match.metadata?.timestamp as number,
        messageCount: match.metadata?.messageCount as number
      }));
  } catch (error) {
    console.error('Failed to search similar conversations:', error);
    return [];
  }
}

/**
 * Get relevant context from past conversations for the current query
 */
export async function getRelevantContext(
  query: string,
  corporationId?: string
): Promise<string | null> {
  const similar = await findSimilarConversations(query, {
    topK: 3,
    corporationId,
    minScore: 0.75 // Higher threshold for context injection
  });

  if (similar.length === 0) {
    return null;
  }

  // Format as context
  const context = similar
    .map((conv, i) => `
## Past Conversation ${i + 1} (${new Date(conv.timestamp).toLocaleDateString()})
${conv.preview}
...
`)
    .join('\n');

  return `
<RelevantPastConversations>
Based on your query, here are some relevant past discussions:
${context}
</RelevantPastConversations>
  `.trim();
}

/**
 * Check if Pinecone is configured and available
 */
export function isPineconeAvailable(): boolean {
  return !!PINECONE_API_KEY;
}
