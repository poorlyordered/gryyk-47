import { useChat } from 'ai/react';
import { useChatStore } from '../store/chat';
import { useCallback, useEffect } from 'react';

/**
 * Custom hook that integrates AI SDK's useChat with our chat store
 */
export function useAIChat() {
  const { selectedModel, systemPrompt } = useChatStore();

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

  // Enhanced handleSubmit that includes system prompt
  const handleSubmitWithSystem = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!input.trim()) return;

      // Add system prompt to the first message if not already present
      const messagesWithSystem = messages.length === 0
        ? [{ role: 'system' as const, content: systemPrompt.content, id: 'system' }]
        : [];

      await handleSubmit(e, {
        options: {
          body: {
            model: selectedModel,
            messages: [...messagesWithSystem, ...messages.map(m => ({ role: m.role, content: m.content }))],
          },
        },
      });
    },
    [handleSubmit, input, messages, selectedModel, systemPrompt.content]
  );

  // Send a message programmatically
  const sendMessage = useCallback(
    async (content: string) => {
      const messagesWithSystem = messages.length === 0
        ? [{ role: 'system' as const, content: systemPrompt.content }]
        : [];

      await append({
        role: 'user',
        content,
      }, {
        options: {
          body: {
            model: selectedModel,
            messages: [...messagesWithSystem, ...messages.map(m => ({ role: m.role, content: m.content }))],
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
