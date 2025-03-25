import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatState, Message } from '../types/chat';
import { DEFAULT_MODELS } from '../types/chat';
import { sendChatRequest, fetchAvailableModels, buildSystemMessage } from '../services/openrouter';

// Load messages from localStorage
const loadMessages = (): Message[] => {
  try {
    const storedMessages = localStorage.getItem('chat-messages');
    return storedMessages ? JSON.parse(storedMessages) : [];
  } catch (error) {
    console.error('Failed to load messages from localStorage:', error);
    return [];
  }
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: loadMessages(),
      isTyping: false,
      selectedModel: DEFAULT_MODELS[0].id,
      availableModels: DEFAULT_MODELS,
      isLoadingModels: false,
      systemPrompt: {
        content: buildSystemMessage(),
        lastUpdated: Date.now()
      },
      
      addMessage: (message: Omit<Message, 'id' | 'timestamp'>) =>
        set((state: ChatState) => ({
          messages: [
            ...state.messages,
            {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              ...message,
            },
          ],
        })),
        
      sendMessage: async (content: string) => {
        // Add user message
        get().addMessage({ content, sender: 'user' });
        set({ isTyping: true });
        
        try {
          // Get current messages
          const messages = get().messages;
          const selectedModel = get().selectedModel;
          
          // Refresh system prompt with latest Strategic Matrix documents
          const updatedSystemPrompt = buildSystemMessage(true);
          set({
            systemPrompt: {
              content: updatedSystemPrompt,
              lastUpdated: Date.now()
            }
          });
          
          // Send to OpenRouter with streaming
          let responseText = '';
          await sendChatRequest(
            messages,
            selectedModel,
            true, // stream
            (chunk) => {
              // If this is the first chunk, create a new message
              if (!responseText) {
                get().addMessage({ 
                  content: chunk, 
                  sender: 'assistant' 
                });
              } else {
                // Otherwise update the existing message
                set((state: ChatState) => {
                  const lastMessageIndex = state.messages.length - 1;
                  const updatedMessages = [...state.messages];
                  
                  if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].sender === 'assistant') {
                    updatedMessages[lastMessageIndex] = {
                      ...updatedMessages[lastMessageIndex],
                      content: updatedMessages[lastMessageIndex].content + chunk
                    };
                  }
                  
                  return { messages: updatedMessages };
                });
              }
              
              responseText += chunk;
            }
          );
          
        } catch (error) {
          console.error('Error sending message:', error);
          // Add error message
          get().addMessage({ 
            content: "I'm sorry, I encountered an error processing your request. Please try again later.", 
            sender: 'assistant' 
          });
        } finally {
          set({ isTyping: false });
        }
      },
      
      clearMessages: () => set({ messages: [] }),
      setSelectedModel: (model: string) => set({ selectedModel: model }),
      
      fetchModels: async () => {
        set({ isLoadingModels: true });
        try {
          const models = await fetchAvailableModels();
          set({ availableModels: models, isLoadingModels: false });
        } catch (error) {
          console.error('Error fetching models:', error);
          set({ isLoadingModels: false });
        }
      },
      
      setSystemPrompt: (content: string) => set({
        systemPrompt: {
          content,
          lastUpdated: Date.now()
        }
      }),
    }),
    {
      name: 'chat-storage',
      partialize: (state: ChatState) => ({ 
        messages: state.messages,
        selectedModel: state.selectedModel,
        systemPrompt: state.systemPrompt
      }),
    }
  )
);
