import type { Message, StrategicContext } from '../../types/chat';
import { buildSystemMessage } from '../../services/openrouter';

/**
 * Build system prompt for strategic session context
 */
export const buildStrategicSessionPrompt = (context: StrategicContext): string => {
  const documentsText = context.documents
    .map(doc => `## ${doc.documentType} (ID: ${doc._id})\n${doc.content}`)
    .join('\n\n');

  return `
You are Gryyk-47, an AI Strategic Advisor for the game EVE Online.
You are in an active strategic session. The user has received your initial analysis and is now asking follow-up questions.
Use the full context from the Strategic Matrix below to provide comprehensive answers.

To propose an update to a document in the Strategic Matrix, embed a JSON object in your response. Use the exact format below and do not wrap it in markdown backticks:
{"propose_update": {"documentId": "the_id_of_the_document_to_update", "documentType": "the_type_of_document", "content": "The full new content of the document.", "reason": "A brief explanation for the change."}}

Only propose an update when the user explicitly agrees to it. Base your proposal on the conversation.

<StrategicContext>
${documentsText}
</StrategicContext>
  `.trim();
};

/**
 * Build strategic analysis prompt for initial session
 */
export const buildStrategicAnalysisPrompt = (context: StrategicContext): string => {
  const documentsText = context.documents
    .map(doc => `## ${doc.documentType}\n${doc.content}`)
    .join('\n\n');

  const eveDataText = `
## Live Corporation Data
Name: ${context.liveEveData.corporationInfo.name}
Ticker: ${context.liveEveData.corporationInfo.ticker}
Member Count: ${context.liveEveData.corporationInfo.member_count}
Alliance ID: ${context.liveEveData.corporationInfo.alliance_id || 'N/A'}
  `.trim();

  return `
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
  `.trim();
};

/**
 * Prepare messages for API call with system prompt
 */
export const prepareMessagesWithSystemPrompt = (
  messages: Message[],
  systemPromptContent: string
): Message[] => {
  const systemPrompt: Message = {
    content: systemPromptContent,
    sender: 'system',
    id: 'system-prompt',
    timestamp: Date.now()
  };

  return [systemPrompt, ...messages];
};

/**
 * Prepare messages for strategic session (system prompt + latest user message only)
 */
export const prepareStrategicSessionMessages = (
  messages: Message[],
  systemPromptContent: string
): Message[] => {
  const systemPrompt: Message = {
    content: systemPromptContent,
    sender: 'system',
    id: 'system-prompt',
    timestamp: Date.now()
  };

  const latestUserMessage = messages[messages.length - 1];
  return [systemPrompt, latestUserMessage];
};

/**
 * Get default system message
 */
export const getDefaultSystemPrompt = (): string => {
  return buildSystemMessage();
};
