import { apiClient} from '../core/api-client';
import type { Message } from '../types/chat';
import { storeChatConversation } from './pinecone-chat-history';

/**
 * Chat Persistence Service
 *
 * Handles saving and loading chat conversations from MongoDB
 * and optionally storing them in Pinecone for semantic search.
 */

export interface ChatSession {
  sessionId: string;
  corporationId?: string;
  userId?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

/**
 * Save a message to MongoDB
 */
export async function saveMessage(
  message: Omit<Message, 'id' | 'timestamp'> & {
    sessionId: string;
    corpId?: string;
    threadId?: string;
    tags?: string[];
  }
): Promise<Message> {
  try {
    const response = await apiClient.post<Message>('/messages', {
      sessionId: message.sessionId,
      corpId: message.corpId,
      sender: message.sender,
      content: message.content,
      references: [],
      tags: message.tags || [],
      threadId: message.threadId
    });

    return response.data;
  } catch (error) {
    console.error('Failed to save message:', error);
    throw error;
  }
}

/**
 * Load messages for a session from MongoDB
 */
interface MongoMessage {
  messageId?: string;
  _id: string;
  sender: string;
  content: string;
  timestamp: string;
  sessionId: string;
  corpId?: string;
  userId?: string;
  tags?: string[];
}

export async function loadMessages(
  sessionId: string
): Promise<Message[]> {
  try {
    const response = await apiClient.get<MongoMessage[]>(`/messages?sessionId=${sessionId}`);

    // Convert MongoDB messages to our Message format
    return response.data.map(msg => ({
      id: msg.messageId || msg._id,
      sender: msg.sender,
      content: msg.content,
      timestamp: new Date(msg.timestamp).getTime()
    }));
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
}

/**
 * Load all sessions for a user
 */
export async function loadUserSessions(
  corpId?: string,
  limit: number = 20
): Promise<ChatSession[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString()
    });

    if (corpId) {
      params.append('corpId', corpId);
    }

    // Increase timeout for this potentially slow query
    const response = await apiClient.get<MongoMessage[]>(`/messages?${params}`, {
      timeout: 30000 // 30 seconds
    });

    // Group messages by sessionId
    const sessionMap = new Map<string, MongoMessage[]>();

    for (const msg of response.data) {
      const sessionId = msg.sessionId;
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, []);
      }
      sessionMap.get(sessionId)!.push(msg);
    }

    // Convert to ChatSession format
    const sessions: ChatSession[] = [];

    for (const [sessionId, messages] of sessionMap.entries()) {
      const sortedMessages = messages.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      sessions.push({
        sessionId,
        corporationId: messages[0].corpId,
        userId: messages[0].userId,
        messages: sortedMessages.map(msg => ({
          id: msg.messageId || msg._id,
          sender: msg.sender,
          content: msg.content,
          timestamp: new Date(msg.timestamp).getTime()
        })),
        createdAt: sortedMessages[0].timestamp,
        updatedAt: sortedMessages[sortedMessages.length - 1].timestamp,
        tags: messages[0].tags || []
      });
    }

    // Sort sessions by most recent first
    sessions.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return sessions;
  } catch (error) {
    console.error('Failed to load user sessions:', error);
    return [];
  }
}

/**
 * Save entire conversation session to MongoDB and Pinecone
 */
export async function saveConversationSession(
  sessionId: string,
  messages: Message[],
  metadata?: {
    corporationId?: string;
    userId?: string;
    tags?: string[];
  }
): Promise<void> {
  try {
    // Save each message to MongoDB
    for (const message of messages) {
      // Skip if already saved (has id)
      if (message.id && message.id !== 'system') {
        continue;
      }

      await saveMessage({
        sessionId,
        corpId: metadata?.corporationId,
        sender: message.sender,
        content: message.content,
        tags: metadata?.tags
      });
    }

    // Store in Pinecone for semantic search
    await storeChatConversation(sessionId, messages, metadata);

    console.log(`✅ Saved conversation session ${sessionId}`);
  } catch (error) {
    console.error('Failed to save conversation session:', error);
    // Don't throw - partial save is ok
  }
}

/**
 * Delete a conversation session
 */
export async function deleteConversationSession(
  sessionId: string
): Promise<void> {
  try {
    // Get all messages for the session
    const messages = await loadMessages(sessionId);

    // Delete each message
    for (const message of messages) {
      await apiClient.delete(`/messages?messageId=${message.id}`);
    }

    console.log(`✅ Deleted conversation session ${sessionId}`);
  } catch (error) {
    console.error('Failed to delete conversation session:', error);
    throw error;
  }
}
