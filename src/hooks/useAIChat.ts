import { useChat } from 'ai/react';
import { useChatStore } from '../store/chat';
import { useCallback, useEffect, useState } from 'react';
import { saveConversationSession, loadMessages } from '../services/chat-persistence';
import { getRelevantContext } from '../services/pinecone-chat-history';

/**
 * Custom hook that integrates AI SDK's useChat with our chat store,
 * MongoDB persistence, and Pinecone semantic search
 */
export function useAIChat(sessionId?: string) {
  const { selectedModel, systemPrompt } = useChatStore();
  const [currentSessionId] = useState(() => sessionId || `session-${Date.now()}`);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    reload,
    stop,
  } = useChat({
    api: '/.netlify/functions/ai-chat',
    body: {
      model: selectedModel,
      temperature: 0.7,
      maxTokens: 2000,
    },
    initialMessages: [],
    onError: (error) => {
      console.error('AI Chat error:', error);
    },
  });

  // Sync messages with chat store
  const { setMessages } = useChatStore();

  useEffect(() => {
    setMessages(messages);
  }, [messages, setMessages]);

  // Load previous messages on mount if sessionId provided
  useEffect(() => {
    if (sessionId && messages.length === 0) {
      loadMessages(sessionId).then(loadedMessages => {
        if (loadedMessages.length > 0) {
          setMessages(loadedMessages);
        }
      });
    }
  }, [sessionId, setMessages]);

  // Auto-save conversation after each exchange
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      // Debounce saving to avoid too many requests
      const timer = setTimeout(() => {
        saveConversationSession(currentSessionId, messages, {
          userId: 'current-user', // TODO: Get from auth store
        }).catch(err => console.error('Auto-save failed:', err));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [messages, isLoading, currentSessionId]);

  // Enhanced handleSubmit that includes system prompt and relevant context
  const handleSubmitWithSystem = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!input.trim()) return;

      // Get relevant context from past conversations
      let relevantContext = '';
      try {
        const context = await getRelevantContext(input);
        if (context) {
          relevantContext = context;
        }
      } catch (error) {
        console.warn('Failed to get relevant context:', error);
      }

      // Build enhanced system prompt with context
      let enhancedSystemPrompt = systemPrompt.content;
      if (relevantContext) {
        enhancedSystemPrompt = `${systemPrompt.content}\n\n${relevantContext}`;
      }

      // Always include system prompt as the first message
      const systemMessage = { role: 'system' as const, content: enhancedSystemPrompt, id: 'system' };
      const userMessages = messages.map(m => ({ role: m.role, content: m.content }));

      await handleSubmit(e, {
        options: {
          body: {
            model: selectedModel,
            messages: [systemMessage, ...userMessages],
          },
        },
      });
    },
    [handleSubmit, input, messages, selectedModel, systemPrompt.content]
  );

  // Send a message programmatically
  const sendMessage = useCallback(
    async (content: string) => {
      // Always include system prompt as the first message
      const systemMessage = { role: 'system' as const, content: systemPrompt.content };
      const userMessages = messages.map(m => ({ role: m.role, content: m.content }));

      await append({
        role: 'user',
        content,
      }, {
        options: {
          body: {
            model: selectedModel,
            messages: [systemMessage, ...userMessages],
          },
        },
      });
    },
    [append, messages, selectedModel, systemPrompt.content]
  );

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit: handleSubmitWithSystem,
    sendMessage,
    isLoading,
    error,
    reload,
    stop,
  };
}
