import type { Message, AISDKMessage } from '../../types/chat';

/**
 * Load messages from localStorage
 */
export const loadMessages = (): Message[] => {
  try {
    const storedMessages = localStorage.getItem('chat-messages');
    return storedMessages ? JSON.parse(storedMessages) : [];
  } catch (error) {
    console.error('Failed to load messages from localStorage:', error);
    return [];
  }
};

/**
 * Convert AI SDK messages to internal Message format
 */
export const convertAISDKMessages = (messages: AISDKMessage[]): Message[] => {
  return messages.map(msg => ({
    id: msg.id || crypto.randomUUID(),
    content: msg.content,
    sender: msg.role === 'user'
      ? 'user' as const
      : msg.role === 'system'
        ? 'system' as const
        : 'assistant' as const,
    timestamp: msg.timestamp || Date.now(),
  }));
};

/**
 * Check if messages need conversion from AI SDK format
 */
export const needsConversion = (messages: Message[] | AISDKMessage[]): boolean => {
  const firstMsg = messages[0];
  return firstMsg && 'role' in firstMsg;
};

/**
 * Generate unique session ID
 */
export const generateSessionId = (): string => {
  return `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a message object with default values
 */
export const createMessage = (
  content: string,
  sender: 'user' | 'assistant' | 'system'
): Message => ({
  id: crypto.randomUUID(),
  content,
  sender,
  timestamp: Date.now(),
});

/**
 * Parse update proposal from AI response
 */
export const parseUpdateProposal = (responseText: string) => {
  const match = responseText.match(/\{"propose_update":\s*\{[^}]+\}\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]);
    return parsed.propose_update || null;
  } catch (e) {
    console.error("Failed to parse update proposal JSON:", e);
    return null;
  }
};
