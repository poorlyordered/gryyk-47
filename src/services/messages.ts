import { Message } from '../models/strategicContextModels';

const API_URL = '/.netlify/functions/messages';

/**
 * Get messages with optional filtering
 */
export async function getMessages({
  sessionId,
  corpId,
  threadId,
  tag,
  limit,
  skip
}: {
  sessionId?: string;
  corpId?: string;
  threadId?: string;
  tag?: string;
  limit?: number;
  skip?: number;
}): Promise<Message[]> {
  // Build query parameters
  const params = new URLSearchParams();
  if (sessionId) params.append('sessionId', sessionId);
  if (corpId) params.append('corpId', corpId);
  if (threadId) params.append('threadId', threadId);
  if (tag) params.append('tag', tag);
  if (limit) params.append('limit', limit.toString());
  if (skip) params.append('skip', skip.toString());

  const queryString = params.toString();
  const url = queryString ? `${API_URL}?${queryString}` : API_URL;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Error fetching messages: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new message
 */
export async function createMessage(messageData: {
  sessionId: string;
  corpId?: string;
  sender: 'user' | 'ai' | 'system';
  content: string;
  references?: string[];
  tags?: string[];
  threadId?: string;
}): Promise<Message> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(messageData)
  });

  if (!response.ok) {
    throw new Error(`Error creating message: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update an existing message
 */
export async function updateMessage(
  messageId: string,
  updates: Partial<Omit<Message, 'messageId'>>
): Promise<{ success: boolean; messageId: string }> {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messageId,
      ...updates
    })
  });

  if (!response.ok) {
    throw new Error(`Error updating message: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a message
 */
export async function deleteMessage(
  messageId: string
): Promise<{ success: boolean; messageId: string }> {
  const response = await fetch(`${API_URL}?messageId=${messageId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Error deleting message: ${response.statusText}`);
  }

  return response.json();
} 