import type { AgentConfiguration } from '../types';
import { AGENT_INFO, type AgentId } from '../constants/agentInfo';

/**
 * Default personality configuration
 */
const DEFAULT_PERSONALITY = {
  id: 'professional-efficient',
  name: 'Professional & Efficient',
  description: 'Business-focused, clear communication, efficient responses',
  traits: {
    formality: 75,
    enthusiasm: 50,
    riskTolerance: 45,
    detailLevel: 70,
    proactivity: 65
  },
  communicationStyle: {
    greeting: 'Hello! I\'m here to assist with your',
    responsePrefix: 'Based on current data and analysis,',
    uncertaintyPhrase: 'While I cannot be certain without additional data,',
    recommendationIntro: 'I recommend the following approach:',
    farewellNote: 'Feel free to ask if you need any clarification or additional analysis.'
  },
  specialization: {
    primaryFocus: ['efficiency', 'data-driven decisions', 'risk management'],
    expertise: ['analysis', 'planning', 'optimization'],
    preferredTools: ['analytics', 'esi_data', 'rag_search'],
    contextPriorities: ['recent_data', 'corporation_goals', 'risk_factors']
  }
};

/**
 * Default response parameters
 */
const DEFAULT_RESPONSE_PARAMETERS = {
  maxTokens: 1500,
  temperature: 0.7,
  topP: 0.9,
  presencePenalty: 0.1,
  frequencyPenalty: 0.1
};

/**
 * Default behavior settings
 */
const DEFAULT_BEHAVIOR_SETTINGS = {
  consultationThreshold: 70,
  confidenceThreshold: 80,
  escalationRules: ['low_confidence', 'conflicting_data', 'high_risk'],
  fallbackBehavior: 'conservative' as const,
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * Default context settings
 */
const DEFAULT_CONTEXT_SETTINGS = {
  memoryDepth: 10,
  contextualPriorities: ['recent_data', 'corporation_goals', 'risk_factors'],
  ignoredTopics: [],
  specializedKnowledge: {}
};

/**
 * Default output formatting
 */
const DEFAULT_OUTPUT_FORMATTING = {
  useMarkdown: true,
  includeConfidence: true,
  showSources: true,
  includeTimestamps: false,
  customTemplates: {}
};

/**
 * Default schedule settings
 */
const DEFAULT_SCHEDULE_SETTINGS = {
  activeHours: {
    start: '00:00',
    end: '23:59',
    timezone: 'UTC'
  },
  maintenanceWindows: [],
  emergencyOverride: true
};

/**
 * Get default tools for an agent
 */
const getDefaultTools = (agentId: string): string[] => {
  const agentInfo = AGENT_INFO[agentId as AgentId];
  return agentInfo?.defaultTools || [];
};

/**
 * Get default RAG sources for an agent
 */
const getDefaultRagSources = (agentId: string): string[] => {
  const specialization = agentId.replace('-specialist', '');
  return ['general', specialization];
};

/**
 * Get default ESI data sources
 */
const getDefaultEsiDataSources = (): string[] => {
  return ['corp-basic-info', 'corp-members'];
};

/**
 * Create a default agent configuration
 */
export const createDefaultConfig = (
  agentId: string,
  corporationId: string
): AgentConfiguration => {
  const now = new Date().toISOString();

  return {
    id: `config-${agentId}-${Date.now()}`,
    agentId,
    corporationId,
    isEnabled: true,
    personality: { ...DEFAULT_PERSONALITY },
    customInstructions: '',
    toolsEnabled: getDefaultTools(agentId),
    toolsDisabled: [],
    tools: getDefaultTools(agentId),
    ragSources: getDefaultRagSources(agentId),
    esiDataSources: getDefaultEsiDataSources(),
    responseParameters: { ...DEFAULT_RESPONSE_PARAMETERS },
    behaviorSettings: { ...DEFAULT_BEHAVIOR_SETTINGS },
    contextSettings: { ...DEFAULT_CONTEXT_SETTINGS },
    outputFormatting: { ...DEFAULT_OUTPUT_FORMATTING },
    scheduleSettings: { ...DEFAULT_SCHEDULE_SETTINGS },
    createdAt: now,
    updatedAt: now,
    version: 1
  };
};

/**
 * Clone a configuration with a new ID
 */
export const cloneConfiguration = (
  config: AgentConfiguration,
  newAgentId?: string,
  newCorporationId?: string
): AgentConfiguration => {
  const now = new Date().toISOString();

  return {
    ...config,
    id: `config-${newAgentId || config.agentId}-${Date.now()}`,
    agentId: newAgentId || config.agentId,
    corporationId: newCorporationId || config.corporationId,
    createdAt: now,
    updatedAt: now,
    version: 1
  };
};

/**
 * Export configuration as JSON
 */
export const exportConfiguration = (config: AgentConfiguration): string => {
  return JSON.stringify(config, null, 2);
};

/**
 * Import configuration from JSON
 */
export const importConfiguration = (
  jsonString: string,
  corporationId: string
): AgentConfiguration => {
  const imported = JSON.parse(jsonString) as AgentConfiguration;
  const now = new Date().toISOString();

  return {
    ...imported,
    id: `config-${imported.agentId}-${Date.now()}`,
    corporationId,
    createdAt: now,
    updatedAt: now,
    version: 1
  };
};

/**
 * Reset configuration to defaults
 */
export const resetToDefaults = (
  agentId: string,
  corporationId: string,
  preserveCustomInstructions = false,
  currentConfig?: AgentConfiguration
): AgentConfiguration => {
  const defaultConfig = createDefaultConfig(agentId, corporationId);

  if (preserveCustomInstructions && currentConfig) {
    defaultConfig.customInstructions = currentConfig.customInstructions;
  }

  return defaultConfig;
};
