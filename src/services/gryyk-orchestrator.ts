/**
 * Gryyk-47 Orchestrator Service (Frontend)
 *
 * Simplified frontend service that calls the backend orchestration engine.
 * All heavy lifting happens server-side in Netlify Functions.
 */

import { sendChatRequest } from './openrouter';
import type { Message } from '../types/chat';
import { apiClient } from '../core/api-client';

export interface OrchestrationResponse {
  response: string;
  specialistsConsulted: string[];
  confidence: number;
  memories: number;
  sessionId: string;
}

/**
 * Send orchestrated chat request to backend
 */
export async function sendOrchestatedChatRequest(
  messages: Message[],
  sessionId: string,
  corporationId: string = 'default-corp',
  useOrchestration: boolean = true,
  model = 'x-ai/grok-4-fast',
  stream = false,
  onChunk?: (chunk: string) => void
): Promise<string> {
  // Get the latest user message
  const latestMessage = messages[messages.length - 1];
  if (!latestMessage || latestMessage.sender !== 'user') {
    throw new Error('No user message found for orchestration');
  }

  // Check if we should use orchestration
  if (!useOrchestration) {
    // Fall back to regular chat request
    return await sendChatRequest(messages, model, stream, onChunk);
  }

  try {
    console.log('🤖 Requesting orchestrated response from Gryyk-47...');

    // Call backend orchestration endpoint
    const response = await apiClient.post<OrchestrationResponse>(
      '/.netlify/functions/orchestrated-chat',
      {
        messages,
        sessionId,
        corporationId
      }
    );

    console.log(`✨ Orchestration complete - consulted ${response.data.specialistsConsulted.join(', ')}`);
    console.log(`🧠 Used ${response.data.memories} memories | Confidence: ${(response.data.confidence * 100).toFixed(0)}%`);

    const formattedResponse = formatOrchestrationResponse(response.data);

    // If streaming is requested, simulate streaming of the formatted response
    if (stream && onChunk) {
      await simulateStreamingResponse(formattedResponse, onChunk);
    }

    return formattedResponse;

  } catch (error) {
    console.error('Orchestration failed, falling back to regular chat:', error);

    // Fallback to regular chat request
    return await sendChatRequest(messages, model, stream, onChunk);
  }
}

/**
 * Format orchestration response for chat display
 */
function formatOrchestrationResponse(result: OrchestrationResponse): string {
  let response = result.response;

  // Add specialist consultation footer if multiple specialists were consulted
  if (result.specialistsConsulted.length > 1) {
    response += '\n\n---\n';
    response += `*Consulted: ${result.specialistsConsulted.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')} specialists*`;
  }

  // Add memory indicator if memories were used
  if (result.memories > 0) {
    response += `\n*Informed by ${result.memories} relevant past experience${result.memories > 1 ? 's' : ''}*`;
  }

  // Add confidence indicator for low confidence responses
  if (result.confidence < 0.6) {
    response += `\n\n⚠️ *Note: This analysis has lower confidence (${(result.confidence * 100).toFixed(0)}%). Consider seeking additional information.*`;
  }

  return response;
}

/**
 * Simulate streaming response for orchestrated results
 */
async function simulateStreamingResponse(response: string, onChunk: (chunk: string) => void): Promise<void> {
  const words = response.split(' ');
  const chunkSize = 3; // Words per chunk

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
    onChunk(chunk);

    // Small delay to simulate real streaming
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

/**
 * Analyze if a query should use orchestration
 */
export function shouldUseOrchestration(query: string): boolean {
  const queryLower = query.toLowerCase();

  // Use orchestration for complex strategic queries
  const orchestrationTriggers = [
    'strategy', 'strategic', 'plan', 'planning',
    'recommend', 'advice', 'should we', 'should i',
    'how can we', 'how can i', 'what do you think',
    'analyze', 'analysis', 'evaluate',
    'recruit', 'mining', 'market', 'mission',
    'economic', 'financial', 'income', 'isk',
    'improve', 'optimize', 'better', 'grow'
  ];

  return orchestrationTriggers.some(trigger => queryLower.includes(trigger));
}

/**
 * Update memory effectiveness based on user feedback
 */
export async function updateMemoryEffectiveness(
  sessionId: string,
  effectiveness: number,
  outcome: string
): Promise<void> {
  try {
    await apiClient.post('/.netlify/functions/update-memory', {
      sessionId,
      effectiveness,
      outcome
    });

    console.log(`✅ Updated memory effectiveness for session ${sessionId}: ${effectiveness}/10`);
  } catch (error) {
    console.error('Failed to update memory effectiveness:', error);
  }
}

/**
 * Get orchestrator statistics
 */
export async function getOrchestratorStats(corporationId: string = 'default-corp') {
  try {
    const response = await apiClient.get(`/.netlify/functions/orchestrator-stats?corporationId=${corporationId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get orchestrator stats:', error);
    return null;
  }
}

export default {
  sendOrchestatedChatRequest,
  shouldUseOrchestration,
  updateMemoryEffectiveness,
  getOrchestratorStats
};
