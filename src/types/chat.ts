import { StrategicContext } from "../services/strategic-workflows";

export type StrategicSessionState =
  | 'idle'
  | 'loading_context'
  | 'analyzing'
  | 'recommending'
  | 'user_feedback'
  | 'updating_matrix';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: number;
}

export interface SystemPrompt {
  content: string;
  lastUpdated: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  // Add other relevant fields for a recommendation
}

export interface ProposedUpdate {
  documentId: string;
  documentType: string;
  content: string;
  reason: string;
}

export interface StrategicWorkflow {
  sessionState: StrategicSessionState;
  contextError: string | null;
  recommendations: Recommendation[];
  strategicContext: StrategicContext | null;
  proposedUpdate: ProposedUpdate | null;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  selectedModel: string;
  availableModels: ModelOption[];
  isLoadingModels: boolean;
  systemPrompt: SystemPrompt;
  workflow: StrategicWorkflow;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setSelectedModel: (model: string) => void;
  fetchModels: () => Promise<void>;
  setSystemPrompt: (content: string) => void;
  startStrategicSession: (corporationId: string) => void;
  performInitialAnalysis: () => Promise<void>;
  setProposedUpdate: (update: ProposedUpdate | null) => void;
}

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
}

export const DEFAULT_MODELS: ModelOption[] = [
  {
    id: 'grok-1',
    name: 'Grok',
    description: 'Default model for Gryyk-47'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic\'s advanced model with strong reasoning capabilities'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI\'s latest model with strong capabilities'
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    description: 'Meta\'s open-source large language model'
  }
];
