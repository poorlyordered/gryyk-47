import { apiClient } from '../core/api-client';
import type { Message } from '../types/chat';

/**
 * Response from orchestrated chat API
 */
export interface OrchestratedChatResponse {
  response: string;
  specialistsConsulted: Array<{
    agent: string;
    confidence: number;
    contribution: string;
  }>;
  confidence: number;
  memories: Array<{
    content: string;
    relevance: number;
    timestamp: string;
  }>;
  sessionId: string;
}

/**
 * Send a chat request through the Gryyk-47 orchestrator backend
 */
export async function sendOrchestratedChat(
  messages: Message[],
  sessionId: string,
  corporationId?: string,
  model?: string
): Promise<OrchestratedChatResponse> {
  try {
    const response = await apiClient.post<OrchestratedChatResponse>(
      '/orchestrated-chat',
      {
        messages,
        sessionId,
        corporationId,
        model,
        stream: false
      }
    );

    return response.data;
  } catch (error) {
    console.error('Orchestrated chat API error:', error);
    throw error;
  }
}

/**
 * Check if orchestration should be used based on query analysis
 */
export function shouldUseOrchestration(query: string): boolean {
  const orchestrationKeywords = [
    'recruit', 'hiring', 'members',
    'income', 'isk', 'profit', 'revenue',
    'market', 'trade', 'sell', 'buy',
    'mining', 'ore', 'minerals',
    'mission', 'pve', 'fitting',
    'recommend', 'suggest', 'advice', 'help',
    'strategy', 'plan'
  ];

  const lowerQuery = query.toLowerCase();
  return orchestrationKeywords.some(keyword => lowerQuery.includes(keyword));
}
