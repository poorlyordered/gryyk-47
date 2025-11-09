import { useState, useEffect, useCallback } from 'react';
import { Message } from '../models/strategicContextModels';
import * as messagesService from '../services/messages';

interface UseMessagesProps {
  sessionId: string;
  corpId?: string;
  threadId?: string;
  initialLimit?: number;
}

export function useMessages({
  sessionId,
  corpId,
  threadId,
  initialLimit = 50
}: UseMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!sessionId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const fetchedMessages = await messagesService.getMessages({
          sessionId,
          corpId,
          threadId,
          limit: initialLimit
        });
        
        setMessages(fetchedMessages);
        setHasMore(fetchedMessages.length === initialLimit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    
    loadMessages();
  }, [sessionId, corpId, threadId, initialLimit]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (loading || !hasMore || !sessionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedMessages = await messagesService.getMessages({
        sessionId,
        corpId,
        threadId,
        limit: initialLimit,
        skip: messages.length
      });
      
      if (fetchedMessages.length === 0) {
        setHasMore(false);
      } else {
        setMessages(prevMessages => [...prevMessages, ...fetchedMessages]);
        setHasMore(fetchedMessages.length === initialLimit);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more messages');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, sessionId, corpId, threadId, initialLimit, messages.length]);

  // Send a new message
  const sendMessage = useCallback(async (content: string, tags?: string[]) => {
    if (!sessionId) return null;
    
    setError(null);
    
    try {
      const newMessage = await messagesService.createMessage({
        sessionId,
        corpId,
        sender: 'user',
        content,
        threadId,
        tags
      });
      
      setMessages(prevMessages => [newMessage, ...prevMessages]);
      return newMessage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return null;
    }
  }, [sessionId, corpId, threadId]);

  // Add an AI message
  const addAiMessage = useCallback(async (content: string, tags?: string[]) => {
    if (!sessionId) return null;
    
    setError(null);
    
    try {
      const newMessage = await messagesService.createMessage({
        sessionId,
        corpId,
        sender: 'ai',
        content,
        threadId,
        tags
      });
      
      setMessages(prevMessages => [newMessage, ...prevMessages]);
      return newMessage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add AI message');
      return null;
    }
  }, [sessionId, corpId, threadId]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    setError(null);
    
    try {
      await messagesService.deleteMessage(messageId);
      setMessages(prevMessages => prevMessages.filter(msg => msg.messageId !== messageId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      return false;
    }
  }, []);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMoreMessages,
    sendMessage,
    addAiMessage,
    deleteMessage
  };
} 