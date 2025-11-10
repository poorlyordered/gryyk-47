import type { Message, StrategicContext, StrategicWorkflow } from '../../types/chat';
import { initiateSession } from '../../services/strategic-workflows';
import { sendChatRequest } from '../../services/openrouter';
import { buildStrategicAnalysisPrompt } from './systemPromptBuilder';

export interface WorkflowCallbacks {
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateWorkflow: (updates: Partial<StrategicWorkflow>) => void;
  setIsTyping: (isTyping: boolean) => void;
}

/**
 * Start a strategic session
 */
export const startStrategicSession = async (
  corporationId: string,
  callbacks: WorkflowCallbacks
): Promise<void> => {
  if (!corporationId) {
    callbacks.updateWorkflow({
      sessionState: 'idle',
      contextError: 'Corporation ID is missing. Cannot start session.'
    });
    return;
  }

  callbacks.updateWorkflow({
    sessionState: 'loading_context',
    contextError: null
  });

  callbacks.addMessage({
    sender: 'system',
    content: 'Strategic session initiated. Loading corporation context...'
  });

  try {
    const context = await initiateSession(corporationId);
    callbacks.updateWorkflow({
      strategicContext: context
    });

    return context;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    callbacks.updateWorkflow({
      sessionState: 'idle',
      contextError: `Failed to load context: ${errorMessage}`
    });

    callbacks.addMessage({
      sender: 'system',
      content: `Error: Could not initiate strategic session. Please check logs.`
    });

    throw error;
  }
};

/**
 * Perform initial strategic analysis
 */
export const performInitialAnalysis = async (
  strategicContext: StrategicContext,
  messages: Message[],
  selectedModel: string,
  callbacks: WorkflowCallbacks
): Promise<void> => {
  if (!strategicContext) {
    console.error("Cannot perform analysis without strategic context.");
    return;
  }

  callbacks.updateWorkflow({
    sessionState: 'analyzing'
  });

  callbacks.addMessage({
    sender: 'system',
    content: `Context loaded: ${strategicContext.summary}. Performing analysis...`
  });

  const analysisPrompt = buildStrategicAnalysisPrompt(strategicContext);
  const apiMessages: Message[] = [
    ...messages,
    {
      content: analysisPrompt,
      sender: 'user',
      id: 'temp-analysis-prompt',
      timestamp: Date.now()
    }
  ];

  callbacks.setIsTyping(true);

  try {
    let responseText = '';

    await sendChatRequest(
      apiMessages,
      selectedModel,
      true, // stream
      (chunk) => {
        if (!responseText) {
          callbacks.addMessage({ content: chunk, sender: 'assistant' });
        } else {
          // Note: This callback needs access to the store's set function
          // which will be passed through from the main store
          responseText += chunk;
        }
      }
    );

    callbacks.updateWorkflow({
      sessionState: 'recommending'
    });

    callbacks.addMessage({
      sender: 'system',
      content: `Analysis complete. I am ready for your questions. You can also ask me to update the Strategic Matrix based on our discussion.`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    callbacks.updateWorkflow({
      sessionState: 'idle',
      contextError: `Analysis failed: ${errorMessage}`
    });

    callbacks.addMessage({
      sender: 'system',
      content: `Error: AI analysis failed. Please check logs.`
    });
  } finally {
    callbacks.setIsTyping(false);
  }
};
