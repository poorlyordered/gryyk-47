import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatState, Message } from '../types/chat';
import { DEFAULT_MODELS } from '../types/chat';
import { sendChatRequest, fetchAvailableModels, buildSystemMessage } from '../services/openrouter';
import { sendOrchestatedChatRequest, shouldUseOrchestration, buildOrchestratedSystemMessage } from '../services/gryyk-orchestrator';
import { initiateSession } from '../services/strategic-workflows';

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
      sendMessage: async (content: string, corporationId?: string) => {
        const { workflow, addMessage, messages, selectedModel, setProposedUpdate, orchestration } = get();
        // Add user message
        addMessage({ content, sender: 'user' });
        set({ isTyping: true });
        try {
          // Determine whether to use orchestration
          const useOrchestration = orchestration.enabled && (
            orchestration.autoDetect ? shouldUseOrchestration(content) : true
          );

          // Generate session ID
          const sessionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const currentMessages = [...messages, {id:'user-message', timestamp: Date.now(), content, sender: 'user'}];

          let responseText = '';

          // Update system prompt to use orchestrated version if orchestration is enabled
          if (useOrchestration) {
            set((state) => ({
              systemPrompt: {
                content: buildOrchestratedSystemMessage(true),
                lastUpdated: Date.now()
              }
            }));
          }

          if (useOrchestration) {
            // Use multi-agent orchestration
            console.log('🤖 Using Gryyk-47 orchestration for query:', content);
            
            responseText = await sendOrchestatedChatRequest(
              currentMessages,
              sessionId,
              corporationId || 'default-corp',
              true,
              selectedModel,
              true, // stream
              (chunk) => {
                if (!responseText) {
                  addMessage({ content: chunk, sender: 'assistant' });
                } else {
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
              }
            );
          } else {
            // Use standard chat request
            console.log('💬 Using standard chat for query:', content);
            
            let systemMessageContent = buildSystemMessage();
            const apiMessages: Message[] = [...currentMessages];
            
            // If in an active strategic session, build a more detailed prompt
            if (workflow.sessionState === 'recommending' && workflow.strategicContext) {
              const documentsText = workflow.strategicContext.documents.map(doc => 
                `## ${doc.documentType} (ID: ${doc._id})\n${doc.content}`
              ).join('\n\n');
              systemMessageContent = `
                You are Gryyk-47, an AI Strategic Advisor for the game EVE Online.
                You are in an active strategic session. The user has received your initial analysis and is now asking follow-up questions.
                Use the full context from the Strategic Matrix below to provide comprehensive answers.

                To propose an update to a document in the Strategic Matrix, embed a JSON object in your response. Use the exact format below and do not wrap it in markdown backticks:
                {"propose_update": {"documentId": "the_id_of_the_document_to_update", "documentType": "the_type_of_document", "content": "The full new content of the document.", "reason": "A brief explanation for the change."}}
                
                Only propose an update when the user explicitly agrees to it. Base your proposal on the conversation.

                <StrategicContext>
                ${documentsText}
                </StrategicContext>
              `;
              // We replace the message list with just the system prompt and the latest user message for this kind of interaction
              apiMessages.splice(0, apiMessages.length - 1); 
            }
            
            // Refresh system prompt with latest content
            const finalSystemPrompt = { content: systemMessageContent, sender: 'system', id: 'system-prompt', timestamp: Date.now()} as Message;
            apiMessages.unshift(finalSystemPrompt);
            
            responseText = await sendChatRequest(
              apiMessages,
              selectedModel,
              true, // stream
              (chunk) => {
                if (!responseText) {
                  addMessage({ content: chunk, sender: 'assistant' });
                } else {
                  set((state: ChatState) => {
                    const lastMessageIndex = state.messages.length - 1;
                    const updatedMessages = [...state.messages];
                    if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].sender === 'assistant') {
                      updatedMessages[lastMessageIndex] = { ...updatedMessages[lastMessageIndex], content: updatedMessages[lastMessageIndex].content + chunk };
                    }
                    return { messages: updatedMessages };
                  });
                }
              }
            );
          }

          // After stream, parse for update proposal
          const match = responseText.match(/\{"propose_update":\s*\{[^}]+\}\}/);
          if (match) {
            try {
              const parsed = JSON.parse(match[0]);
              if (parsed.propose_update) {
                setProposedUpdate(parsed.propose_update);
              }
            } catch (e) {
              console.error("Failed to parse update proposal JSON:", e);
            }
          }
        } catch (error) {
          console.error('Error sending message:', error);
          addMessage({ content: "I'm sorry, I encountered an error. Please check the logs.", sender: 'assistant' });
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
      setOrchestrationSettings: (settings: Partial<OrchestrationSettings>) => set((state) => ({
        orchestration: { ...state.orchestration, ...settings }
      })),
      startStrategicSession: async (corporationId: string) => {
        if (!corporationId) {
          set(state => ({
            workflow: { ...state.workflow, sessionState: 'idle', contextError: 'Corporation ID is missing. Cannot start session.' }
          }));
          return;
        }

        set(state => ({
          workflow: { ...state.workflow, sessionState: 'loading_context', contextError: null }
        }));
        
        get().addMessage({
          sender: 'system',
          content: 'Strategic session initiated. Loading corporation context...'
        });

        try {
          const context = await initiateSession(corporationId);
          
          set(state => ({
            workflow: { ...state.workflow, strategicContext: context }
          }));

          await get().performInitialAnalysis();

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          set(state => ({
            workflow: { ...state.workflow, sessionState: 'idle', contextError: `Failed to load context: ${errorMessage}` }
          }));
          get().addMessage({
            sender: 'system',
            content: `Error: Could not initiate strategic session. Please check logs.`
          });
        }
      },
      performInitialAnalysis: async () => {
        const { workflow, messages, selectedModel, addMessage } = get();
        const { strategicContext } = workflow;

        if (!strategicContext) {
          console.error("Cannot perform analysis without strategic context.");
          return;
        }

        set(state => ({
          workflow: { ...state.workflow, sessionState: 'analyzing' }
        }));

        addMessage({
          sender: 'system',
          content: `Context loaded: ${strategicContext.summary}. Performing analysis...`
        });

        const documentsText = strategicContext.documents.map(doc => 
          `## ${doc.documentType}\n${doc.content}`
        ).join('\n\n');

        const eveDataText = `
          ## Live Corporation Data
          Name: ${strategicContext.liveEveData.corporationInfo.name}
          Ticker: ${strategicContext.liveEveData.corporationInfo.ticker}
          Member Count: ${strategicContext.liveEveData.corporationInfo.member_count}
          Alliance ID: ${strategicContext.liveEveData.corporationInfo.alliance_id || 'N/A'}
        `;

        const analysisPrompt = `
          You are Gryyk-47, an AI Strategic Advisor for the game EVE Online.
          Based on the following combination of static strategic documents and live on-chain data, provide a concise, actionable analysis of the corporation's current strategic position.
          Focus on identifying the most immediate threats, promising opportunities, and any internal inconsistencies or conflicts between the provided documents and the live data.
          Conclude with a list of 2-3 suggested high-level strategic priorities.

          <LiveEVEData>
          ${eveDataText}
          </LiveEVEData>

          <StrategicContext>
          ${documentsText}
          </StrategicContext>
        `;

        set({ isTyping: true });
        
        try {
          // We need a temporary message list for the API call that includes the analysis prompt
          const apiMessages = [...messages, { content: analysisPrompt, sender: 'user', id: 'temp-analysis-prompt', timestamp: Date.now() } as Message];

          let responseText = '';
          await sendChatRequest(
            apiMessages,
            selectedModel,
            true, // stream
            (chunk) => {
              if (!responseText) {
                addMessage({ content: chunk, sender: 'assistant' });
              } else {
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

          set(state => ({
            workflow: { ...state.workflow, sessionState: 'recommending' }
          }));

          addMessage({
            sender: 'system',
            content: `Analysis complete. I am ready for your questions. You can also ask me to update the Strategic Matrix based on our discussion.`
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          set(state => ({
            workflow: { ...state.workflow, sessionState: 'idle', contextError: `Analysis failed: ${errorMessage}` }
          }));
          addMessage({
            sender: 'system',
            content: `Error: AI analysis failed. Please check logs.`
          });
        } finally {
          set({ isTyping: false });
        }
      },

      setProposedUpdate: (update) => {
        set(state => ({
          workflow: { ...state.workflow, proposedUpdate: update }
        }));
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state: ChatState) => ({ 
        messages: state.messages,
        selectedModel: state.selectedModel,
        systemPrompt: state.systemPrompt,
        orchestration: state.orchestration
      }),
    }
  )
);
