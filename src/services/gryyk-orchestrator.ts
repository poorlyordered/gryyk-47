import { MemoryService } from '../../mastra/services/memory-service';
import { GryykOrchestrator, OrchestrationRequest, OrchestrationResponse } from '../../mastra/services/orchestrator';
import { sendChatRequest } from './openrouter';
import { buildSystemMessage } from './openrouter';
import type { Message } from '../types/chat';

// Singleton orchestrator instance
let orchestratorInstance: GryykOrchestrator | null = null;
let memoryServiceInstance: MemoryService | null = null;

/**
 * Initialize the Gryyk-47 orchestrator with memory service
 */
export async function initializeOrchestrator(): Promise<void> {
  if (!orchestratorInstance) {
    try {
      // Get MongoDB URI from environment
      const mongoUri = import.meta.env.VITE_MONGODB_URI || process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MongoDB URI not configured');
      }

      // Initialize memory service
      memoryServiceInstance = new MemoryService(mongoUri);
      await memoryServiceInstance.connect();

      // Initialize orchestrator
      orchestratorInstance = new GryykOrchestrator(memoryServiceInstance);
      
      console.log('🤖 Gryyk-47 orchestrator initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gryyk-47 orchestrator:', error);
      throw error;
    }
  }
}

/**
 * Enhanced chat request that uses multi-agent orchestration
 */
export async function sendOrchestatedChatRequest(
  messages: Message[],
  sessionId: string,
  corporationId: string = 'default-corp',
  useOrchestration: boolean = true,
  model = 'grok-3',
  stream = false,
  onChunk?: (chunk: string) => void
): Promise<string> {
  // Get the latest user message
  const latestMessage = messages[messages.length - 1];
  if (!latestMessage || latestMessage.sender !== 'user') {
    throw new Error('No user message found for orchestration');
  }

  // Check if we should use orchestration
  if (!useOrchestration || !orchestratorInstance) {
    // Fall back to regular chat request
    return await sendChatRequest(messages, model, stream, onChunk);
  }

  try {
    // Prepare orchestration request
    const orchestrationRequest: OrchestrationRequest = {
      query: latestMessage.content,
      sessionId,
      corporationId,
      userContext: {
        messageHistory: messages.slice(-5), // Last 5 messages for context
        timestamp: new Date().toISOString()
      }
    };

    // Execute multi-agent orchestration
    const orchestrationResult = await orchestratorInstance.processQuery(orchestrationRequest);

    // Format the orchestrated response for chat
    const formattedResponse = formatOrchestrationResponse(orchestrationResult);

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
  let response = result.synthesis;

  // Add specialist insights if multiple agents were consulted
  if (result.agentResponses.length > 1) {
    response += '\n\n**Specialist Consultation Summary:**\n';
    
    result.agentResponses.forEach(agentResponse => {
      const agentName = agentResponse.agentType.charAt(0).toUpperCase() + agentResponse.agentType.slice(1);
      response += `\n• **${agentName} Specialist** (${(agentResponse.confidence * 100).toFixed(0)}% confidence): `;
      
      if (agentResponse.response.recommendations) {
        response += agentResponse.response.recommendations[0] || agentResponse.reasoning;
      } else {
        response += agentResponse.reasoning;
      }
    });
  }

  // Add key recommendations
  if (result.recommendations.length > 0) {
    response += '\n\n**Key Recommendations:**\n';
    result.recommendations.slice(0, 3).forEach((rec, index) => {
      response += `${index + 1}. ${rec}\n`;
    });
  }

  // Add confidence indicator
  if (result.confidence > 0) {
    const confidenceLevel = result.confidence > 0.8 ? 'High' : 
                          result.confidence > 0.6 ? 'Medium' : 'Low';
    response += `\n*Analysis confidence: ${confidenceLevel} (${(result.confidence * 100).toFixed(0)}%)*`;
  }

  // Add memory indicator
  if (result.memoryStored) {
    response += '\n\n*This analysis has been stored in my memory for future reference.*';
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
    'recommend', 'advice', 'should we',
    'how can we', 'what do you think',
    'analyze', 'analysis', 'evaluate',
    'recruit', 'mining', 'market', 'mission',
    'economic', 'financial', 'income', 'isk'
  ];

  return orchestrationTriggers.some(trigger => queryLower.includes(trigger));
}

/**
 * Get orchestrator statistics
 */
export async function getOrchestratorStats(corporationId: string = 'default-corp') {
  if (!orchestratorInstance) {
    throw new Error('Orchestrator not initialized');
  }

  return await orchestratorInstance.getStats(corporationId);
}

/**
 * Update memory effectiveness based on user feedback
 */
export async function updateMemoryEffectiveness(
  sessionId: string,
  effectiveness: number,
  outcome: string
): Promise<void> {
  if (!orchestratorInstance) {
    throw new Error('Orchestrator not initialized');
  }

  await orchestratorInstance.updateMemoryEffectiveness(sessionId, effectiveness, outcome);
}

/**
 * Enhanced system message that includes orchestration capabilities
 */
export function buildOrchestratedSystemMessage(includeStrategicMatrix: boolean = true): string {
  let basePrompt = buildSystemMessage(includeStrategicMatrix);

  // Add orchestration capabilities to system prompt
  basePrompt += `\n\n--- GRYYK-47 ORCHESTRATION CAPABILITIES ---\n\n`;
  basePrompt += `You are equipped with a team of specialist agents that you can consult for domain-specific expertise:

• **Recruiting Specialist**: Member acquisition, retention, and onboarding strategies
• **Economic Specialist**: Income optimization and financial planning
• **Market Specialist**: Trading opportunities and market analysis
• **Mining Specialist**: Mining operations and yield optimization
• **Mission Specialist**: PvE activities and loyalty point optimization

When users ask complex questions that benefit from specialist knowledge, you automatically consult the relevant specialists and synthesize their recommendations into comprehensive strategic advice.

Your memory system allows you to:
- Learn from past decisions and their outcomes
- Identify patterns across different domains
- Provide increasingly refined recommendations over time
- Maintain corporation-specific knowledge and context

Always provide clear, actionable advice that considers multiple perspectives and long-term strategic implications.`;

  return basePrompt;
}

/**
 * Cleanup orchestrator resources
 */
export async function cleanupOrchestrator(): Promise<void> {
  if (memoryServiceInstance) {
    await memoryServiceInstance.disconnect();
    memoryServiceInstance = null;
  }
  orchestratorInstance = null;
}

// Auto-initialize orchestrator (will be called when this module is imported)
initializeOrchestrator().catch(error => {
  console.error('Failed to auto-initialize orchestrator:', error);
});

export default {
  sendOrchestatedChatRequest,
  shouldUseOrchestration,
  getOrchestratorStats,
  updateMemoryEffectiveness,
  buildOrchestratedSystemMessage,
  initializeOrchestrator,
  cleanupOrchestrator
};