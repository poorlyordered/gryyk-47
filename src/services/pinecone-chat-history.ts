import type { Message } from '../types/chat';
import { apiClient } from '../core/api-client';

/**
 * Pinecone Chat History Service (Frontend)
 *
 * Stores and retrieves chat conversations using semantic search.
 * Calls backend Netlify function for Pinecone operations.
 */

/**
 * Store a conversation in Pinecone (via backend API)
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
  try {
    await apiClient.post('/pinecone-chat', {
      sessionId,
      messages,
      metadata
    });

    console.log(`✅ Stored conversation ${sessionId} in Pinecone`);
  } catch (error) {
    console.error('Failed to store conversation in Pinecone:', error);
    // Don't throw - this is a non-critical feature
  }
}

/**
 * Find similar past conversations (via backend API)
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
  try {
    const params = new URLSearchParams({
      query,
      topK: (options?.topK || 5).toString(),
      minScore: (options?.minScore || 0.7).toString()
    });

    if (options?.corporationId) {
      params.append('corporationId', options.corporationId);
    }
    if (options?.userId) {
      params.append('userId', options.userId);
    }

    const response = await apiClient.get<Array<{
      sessionId: string;
      score: number;
      preview: string;
      timestamp: number;
      messageCount: number;
    }>>(`/pinecone-chat?${params}`);

    return response; // API client returns data directly, not wrapped in .data
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

  // Defensive: ensure similar is an array
  if (!Array.isArray(similar) || similar.length === 0) {
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
 * Check if Pinecone is available
 * Note: In the new API-based approach, we always return true
 * and let the backend handle availability checks
 */
export function isPineconeAvailable(): boolean {
  return true; // Backend will handle availability checks
}
