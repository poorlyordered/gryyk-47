import { OPENROUTER_CONFIG } from '../config/openrouter';
import type { Message, ModelOption } from '../types/chat';
import { useChatStore } from '../store/chat';
import { useStrategicMatrixStore } from '../features/strategicMatrix/store';

// OpenRouter API model response interfaces
export interface OpenRouterModelResponse {
  data: OpenRouterModel[];
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterStreamChunk {
  id: string;
  choices: {
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }[];
  model: string;
}

/**
 * Builds a system message with EVE Online context and Strategic Matrix documents
 * @param includeStrategicMatrix Whether to include Strategic Matrix documents in the system message
 * @returns System message string
 */
export const buildSystemMessage = (includeStrategicMatrix: boolean = true): string => {
  let basePrompt = `You are Gryyk-47, an AI strategic advisor for EVE Online gameplay, specifically focused on providing strategic advice and assistance for corporation management. Your purpose is to analyze game data, maintain institutional knowledge, and provide strategic recommendations to help corporation leaders make better decisions.

Your responses should be focused on EVE Online gameplay, corporation management, strategic planning, and resource optimization. You should maintain a professional and strategic tone, befitting your role as an advisor to corporation leadership.

When providing advice, consider the complex nature of EVE Online's environment, including diplomatic relations, economic factors, military capabilities, and territorial control.

Key responsibilities:
1. Analyze corporation data and provide strategic insights
2. Maintain institutional knowledge about the corporation's history and operations
3. Offer recommendations for resource allocation and optimization
4. Assess threats and opportunities in the EVE Online universe
5. Provide guidance on diplomatic relations with other corporations and alliances
6. Assist with planning military operations and defensive strategies
7. Help optimize industrial operations and supply chains`;

  // If includeStrategicMatrix is false, return the base prompt
  if (!includeStrategicMatrix) {
    return basePrompt;
  }

  // Get Strategic Matrix documents
  const strategicMatrixStore = useStrategicMatrixStore.getState();
  const documents = strategicMatrixStore.getFixedOrderDocuments();

  // If no documents are available, return the base prompt
  if (!documents.some(doc => doc !== undefined)) {
    return basePrompt;
  }

  // Add Strategic Matrix context
  basePrompt += `\n\n--- STRATEGIC MATRIX DOCUMENTS ---\n\n`;
  
  // Add each available document to the prompt
  documents.forEach(doc => {
    if (doc) {
      basePrompt += `[${doc.category}]\n`;
      basePrompt += `Title: ${doc.title}\n`;
      basePrompt += `Content: ${doc.content}\n`;
      const date = new Date(doc.lastUpdated);
      const formattedDate = isNaN(date.getTime()) ? 'Unknown' : date.toISOString().split('T')[0];
      basePrompt += `Last Updated: ${formattedDate}\n\n`;
    }
  });

  // Add instructions for updating Strategic Matrix
  basePrompt += `--- STRATEGIC MATRIX UPDATE INSTRUCTIONS ---\n\n`;
  basePrompt += `You can update the Strategic Matrix documents when requested by the user. To do so:
1. When the user asks you to update a Strategic Matrix document, propose specific changes.
2. Format your response with a clear section titled "PROPOSED STRATEGIC MATRIX UPDATE" that includes:
   - The category to update (e.g., "Asset Information")
   - The specific changes you're proposing
   - A request for confirmation from the user
3. Only proceed with updates when explicitly confirmed by the user.
4. After confirmation, use the format "EXECUTE STRATEGIC MATRIX UPDATE: [Category]" followed by the new content.

Example update flow:
User: "Please update our Asset Information with the new mining barges we acquired."
You: *Provide analysis and then* "PROPOSED STRATEGIC MATRIX UPDATE for Asset Information: [proposed changes]"
User: "Yes, update it."
You: "EXECUTE STRATEGIC MATRIX UPDATE: Asset Information [new content]"

The system will detect this format and process the update automatically.`;

  return basePrompt;
};

/**
 * Fetches available models from OpenRouter API
 * @returns Promise with array of model options
 */
export const fetchAvailableModels = async (): Promise<ModelOption[]> => {
  try {
    const headers = {
      'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
      ...OPENROUTER_CONFIG.headers
    };

    const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/models`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data: OpenRouterModelResponse = await response.json();

    // Convert OpenRouter models to our ModelOption format - return ALL models
    return data.data.map(model => ({
      id: model.id,
      name: model.name || model.id,
      description: `Context: ${model.context_length.toLocaleString()} tokens | Cost: $${parseFloat(model.pricing.prompt).toFixed(4)}/1M prompt, $${parseFloat(model.pricing.completion).toFixed(4)}/1M completion`
    }));
  } catch (error) {
    console.error('Error fetching models:', error);
    // Return default models as fallback
    return [
      {
        id: 'x-ai/grok-beta',
        name: 'Grok Beta',
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
  }
};

/**
 * Sends a chat request to the OpenRouter API
 * @param messages Array of chat messages
 * @param model Model to use for the request
 * @param stream Whether to stream the response
 * @param onChunk Callback for streaming chunks
 * @returns Promise with the response text
 */
export const sendChatRequest = async (
  messages: Message[],
  model = OPENROUTER_CONFIG.defaultModel,
  stream = false,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  // Format messages for OpenRouter
  const openRouterMessages: OpenRouterMessage[] = messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  // Get the system prompt from the store
  const { systemPrompt } = useChatStore.getState();
  
  // Add system message with EVE Online context
  const systemMessage: OpenRouterMessage = {
    role: 'system',
    content: systemPrompt.content
  };

  const requestBody: OpenRouterRequest = {
    model,
    messages: [systemMessage, ...openRouterMessages],
    stream,
    temperature: 0.7,
    max_tokens: 2000
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
    ...OPENROUTER_CONFIG.headers
  };

  if (stream && onChunk) {
    return streamChatResponse(requestBody, headers, onChunk);
  } else {
    return standardChatResponse(requestBody, headers);
  }
};

/**
 * Handles a standard (non-streaming) chat response
 */
const standardChatResponse = async (
  requestBody: OpenRouterRequest,
  headers: Record<string, string>
): Promise<string> => {
  try {
    const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0]?.message?.content || 'No response generated.';
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    throw error;
  }
};

/**
 * Handles a streaming chat response
 */
const streamChatResponse = async (
  requestBody: OpenRouterRequest,
  headers: Record<string, string>,
  onChunk: (chunk: string) => void
): Promise<string> => {
  try {
    const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...requestBody, stream: true })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is undefined');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines from buffer
      let lineEnd;
      while ((lineEnd = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, lineEnd).trim();
        buffer = buffer.slice(lineEnd + 1);

        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          // Skip comments or empty data
          if (!data || data === '[DONE]') continue;

          try {
            const chunk: OpenRouterStreamChunk = JSON.parse(data);
            const content = chunk.choices[0]?.delta?.content || '';
            
            if (content) {
              fullText += content;
              onChunk(content);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
    }

    return fullText;
  } catch (error) {
    console.error('Error streaming from OpenRouter API:', error);
    throw error;
  }
};
