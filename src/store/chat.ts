import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatState, Message, AISDKMessage, OrchestrationSettings, StrategicWorkflow } from '../types/chat';
import { DEFAULT_MODELS } from '../types/chat';
import { sendChatRequest, fetchAvailableModels } from '../services/openrouter';
import { useAuthStore } from './auth';

// Import refactored utilities
import {
  loadMessages,
  convertAISDKMessages,
  needsConversion,
  generateSessionId,
  createMessage,
  parseUpdateProposal
} from './chat/messageUtils';

import {
  getDefaultSystemPrompt,
  buildStrategicSessionPrompt,
  prepareMessagesWithSystemPrompt,
  prepareStrategicSessionMessages
} from './chat/systemPromptBuilder';

import {
  shouldUseOrchestration,
  sendOrchestrated,
  getCorporationId
} from './chat/chatOrchestrator';

import {
  startStrategicSession as startSession,
  performInitialAnalysis as performAnalysis
} from './chat/strategicWorkflowService';

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: loadMessages(),
      isTyping: false,
      selectedModel: 'xai/grok-beta', // Correct OpenRouter format
      availableModels: DEFAULT_MODELS,
      isLoadingModels: false,
      systemPrompt: {
        content: getDefaultSystemPrompt(),
        lastUpdated: Date.now()
      },
      workflow: {
        sessionState: 'idle',
        contextError: null,
        recommendations: [],
        strategicContext: null,
        proposedUpdate: null,
      },
      orchestration: {
        enabled: true,
        autoDetect: true,
        showSpecialistInsights: true,
        confidenceThreshold: 0.7
      },

      // Message management
      addMessage: (message: Omit<Message, 'id' | 'timestamp'>) =>
        set((state: ChatState) => ({
          messages: [
            ...state.messages,
            createMessage(message.content, message.sender)
          ],
        })),

      setMessages: (messages: Message[] | AISDKMessage[]) => {
        if (needsConversion(messages)) {
          set({ messages: convertAISDKMessages(messages as AISDKMessage[]) });
        } else {
          set({ messages: messages as Message[] });
        }
      },

      clearMessages: () => set({ messages: [] }),

      // Model management
      setSelectedModel: (model: string) => {
        console.log(`🤖 Model changed to: ${model}`);
        set({ selectedModel: model });
      },

      fetchModels: async () => {
        set({ isLoadingModels: true });
        try {
          const models = await fetchAvailableModels();
          console.log(`📋 Fetched ${models.length} models from OpenRouter`);
          set({ availableModels: models, isLoadingModels: false });
        } catch (error) {
          console.error('Error fetching models:', error);
          set({ isLoadingModels: false });
        }
      },

      // System prompt management
      setSystemPrompt: (content: string) => set({
        systemPrompt: {
          content,
          lastUpdated: Date.now()
        }
      }),

      // Orchestration settings
      setOrchestrationSettings: (settings: Partial<OrchestrationSettings>) =>
        set((state) => ({
          orchestration: { ...state.orchestration, ...settings }
        })),

      // Main message sending logic
      sendMessage: async (content: string, corporationId?: string) => {
        const state = get();
        const { character } = useAuthStore.getState();
        const contextCorporationId = getCorporationId(corporationId, character?.corporation?.id);

        // Add user message
        state.addMessage({ content, sender: 'user' });
        set({ isTyping: true });

        try {
          const sessionId = generateSessionId();
          const currentMessages = [
            ...state.messages,
            createMessage(content, 'user')
          ];

          let responseText = '';

          // Determine if we should use orchestration
          if (shouldUseOrchestration(content, state.orchestration)) {
            const result = await sendOrchestrated(
              currentMessages,
              sessionId,
              contextCorporationId,
              state.selectedModel,
              state.orchestration
            );
            responseText = result.responseText;
          } else {
            // Standard chat request
            console.log('💬 Using standard chat for query:', content);

            let systemPromptContent = getDefaultSystemPrompt();
            let apiMessages = currentMessages;

            // Check if in strategic session
            if (
              state.workflow.sessionState === 'recommending' &&
              state.workflow.strategicContext
            ) {
              systemPromptContent = buildStrategicSessionPrompt(
                state.workflow.strategicContext
              );
              apiMessages = prepareStrategicSessionMessages(
                currentMessages,
                systemPromptContent
              );
            } else {
              apiMessages = prepareMessagesWithSystemPrompt(
                currentMessages,
                systemPromptContent
              );
            }

            responseText = await sendChatRequest(
              apiMessages,
              state.selectedModel,
              true, // stream
              (chunk) => {
                if (!responseText) {
                  state.addMessage({ content: chunk, sender: 'assistant' });
                  responseText = chunk;
                } else {
                  set((st: ChatState) => {
                    const lastIndex = st.messages.length - 1;
                    const updatedMessages = [...st.messages];
                    if (lastIndex >= 0 && updatedMessages[lastIndex].sender === 'assistant') {
                      updatedMessages[lastIndex] = {
                        ...updatedMessages[lastIndex],
                        content: updatedMessages[lastIndex].content + chunk
                      };
                    }
                    return { messages: updatedMessages };
                  });
                  responseText += chunk;
                }
              }
            );
          }

          // Parse update proposals
          const proposal = parseUpdateProposal(responseText);
          if (proposal) {
            state.setProposedUpdate(proposal);
          }
        } catch (error) {
          console.error('Error sending message:', error);
          state.addMessage({
            content: "I'm sorry, I encountered an error. Please check the logs.",
            sender: 'assistant'
          });
        } finally {
          set({ isTyping: false });
        }
      },

      // Strategic workflow management
      startStrategicSession: async (corporationId: string) => {
        const state = get();
        const callbacks = {
          addMessage: state.addMessage,
          updateWorkflow: (updates: Partial<StrategicWorkflow>) => {
            set((st) => ({
              workflow: { ...st.workflow, ...updates }
            }));
          },
          setIsTyping: (isTyping: boolean) => set({ isTyping })
        };

        try {
          const context = await startSession(corporationId, callbacks);
          if (context) {
            await state.performInitialAnalysis();
          }
        } catch (_error) {
          // Error already handled in startSession
        }
      },

      performInitialAnalysis: async () => {
        const state = get();
        const { workflow, messages, selectedModel } = state;

        if (!workflow.strategicContext) {
          console.error("Cannot perform analysis without strategic context.");
          return;
        }

        const callbacks = {
          addMessage: state.addMessage,
          updateWorkflow: (updates: Partial<StrategicWorkflow>) => {
            set((st) => ({
              workflow: { ...st.workflow, ...updates }
            }));
          },
          setIsTyping: (isTyping: boolean) => set({ isTyping })
        };

        await performAnalysis(
          workflow.strategicContext,
          messages,
          selectedModel,
          callbacks
        );
      },

      setProposedUpdate: (update) => {
        set((state) => ({
          workflow: { ...state.workflow, proposedUpdate: update }
        }));
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state: ChatState) => ({
        messages: state.messages,
        selectedModel: state.selectedModel,
        availableModels: state.availableModels,
        systemPrompt: state.systemPrompt,
        orchestration: state.orchestration
      }),
    }
  )
);
