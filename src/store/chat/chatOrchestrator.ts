import type { Message, OrchestrationSettings } from '../../types/chat';
import { sendOrchestratedChat, shouldUseOrchestration as shouldUseOrchestrationCheck } from '../../services/orchestrated-chat-api';

export interface OrchestrationResult {
  responseText: string;
  specialistsConsulted: string[];
  usedOrchestration: boolean;
}

/**
 * Determine if orchestration should be used for a query
 */
export const shouldUseOrchestration = (
  content: string,
  orchestration: OrchestrationSettings
): boolean => {
  if (!orchestration.enabled) return false;

  return orchestration.autoDetect
    ? shouldUseOrchestrationCheck(content)
    : true;
};

/**
 * Send message through orchestrated chat
 */
export const sendOrchestrated = async (
  messages: Message[],
  sessionId: string,
  corporationId: string,
  model: string,
  orchestration: OrchestrationSettings
): Promise<OrchestrationResult> => {
  console.log('🤖 Using Gryyk-47 orchestration for query');

  const response = await sendOrchestratedChat(
    messages,
    sessionId,
    corporationId,
    model
  );

  // Log specialist insights if enabled
  if (orchestration.showSpecialistInsights && response.specialistsConsulted.length > 0) {
    console.log('👥 Specialists consulted:', response.specialistsConsulted);
  }

  return {
    responseText: response.response,
    specialistsConsulted: response.specialistsConsulted,
    usedOrchestration: true,
  };
};

/**
 * Get corporation ID from context
 */
export const getCorporationId = (
  providedId: string | undefined,
  characterCorporationId: number | undefined
): string => {
  const corpId = providedId || characterCorporationId?.toString() || 'default-corp';

  console.log(`📊 Sending message with corporation context: ${corpId}`, {
    provided: providedId,
    fromCharacter: characterCorporationId,
    final: corpId
  });

  return corpId;
};
