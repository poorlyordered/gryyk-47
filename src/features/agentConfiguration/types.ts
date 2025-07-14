export interface AgentPersonality {
  id: string;
  name: string;
  description: string;
  traits: {
    formality: number; // 0-100 (casual to formal)
    enthusiasm: number; // 0-100 (reserved to enthusiastic)
    riskTolerance: number; // 0-100 (conservative to aggressive)
    detailLevel: number; // 0-100 (brief to comprehensive)
    proactivity: number; // 0-100 (reactive to proactive)
  };
  communicationStyle: {
    greeting: string;
    responsePrefix: string;
    uncertaintyPhrase: string;
    recommendationIntro: string;
    farewellNote: string;
  };
  specialization: {
    primaryFocus: string[];
    expertise: string[];
    preferredTools: string[];
    contextPriorities: string[];
  };
}

export interface CorporationProfile {
  id: string;
  corporationId: string;
  name: string;
  ticker: string;
  type: 'highsec_industrial' | 'highsec_mining' | 'nullsec_sov' | 'lowsec_faction_warfare' | 'wormhole' | 'mercenary' | 'trading' | 'newbro_friendly' | 'veteran_elite';
  timezone: string;
  language: string;
  culture: {
    values: string[];
    goals: string[];
    prohibitions: string[];
    traditions: string[];
  };
  operationalParameters: {
    mainTimeZone: string;
    primaryActivities: string[];
    riskProfile: 'conservative' | 'moderate' | 'aggressive';
    decisionMakingStyle: 'democratic' | 'hierarchical' | 'consensus';
    memberExperienceLevel: 'newbro' | 'mixed' | 'veteran';
  };
  preferences: {
    responseLength: 'brief' | 'moderate' | 'detailed';
    analysisDepth: 'quick' | 'standard' | 'comprehensive';
    proactiveAlerts: boolean;
    realTimeUpdates: boolean;
    customNotifications: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AgentConfiguration {
  id: string;
  agentId: string;
  corporationId: string;
  isEnabled: boolean;
  personality: AgentPersonality;
  customInstructions: string;
  toolsEnabled: string[];
  toolsDisabled: string[];
  ragSources: string[];
  esiDataSources: string[];
  responseParameters: {
    maxTokens: number;
    temperature: number;
    topP: number;
    presencePenalty: number;
    frequencyPenalty: number;
  };
  behaviorSettings: {
    consultationThreshold: number; // When to consult other agents
    confidenceThreshold: number; // Minimum confidence to provide advice
    escalationRules: string[];
    fallbackBehavior: 'conservative' | 'ask_human' | 'consult_all';
  };
  contextSettings: {
    memoryDepth: number; // How far back to look for context
    contextualPriorities: string[];
    ignoredTopics: string[];
    specializedKnowledge: Record<string, string>;
  };
  outputFormatting: {
    useMarkdown: boolean;
    includeConfidence: boolean;
    showSources: boolean;
    includeTimestamps: boolean;
    customTemplates: Record<string, string>;
  };
  scheduleSettings: {
    activeHours: {
      start: string;
      end: string;
      timezone: string;
    };
    maintenanceWindows: Array<{
      day: string;
      start: string;
      end: string;
    }>;
    emergencyOverride: boolean;
  };
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'personality' | 'corporation_type' | 'specialization' | 'use_case';
  targetAudience: string[];
  configuration: Partial<AgentConfiguration>;
  corporationProfile?: Partial<CorporationProfile>;
  isOfficial: boolean;
  createdBy: string;
  usageCount: number;
  rating: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConfigurationValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    field: string;
    message: string;
    recommendation: string;
  }>;
  score: number; // 0-100 configuration quality score
  suggestions: string[];
}

export interface ConfigurationPreset {
  id: string;
  name: string;
  description: string;
  applicableAgents: string[];
  configuration: {
    personality: Partial<AgentPersonality>;
    behavioral: Partial<AgentConfiguration['behaviorSettings']>;
    technical: Partial<AgentConfiguration['responseParameters']>;
  };
  examples: Array<{
    scenario: string;
    expectedBehavior: string;
  }>;
  compatibleWith: string[]; // Corporation types
  conflicts: string[]; // Incompatible presets
}

export interface AgentCustomization {
  corporationId: string;
  agentConfigurations: Record<string, AgentConfiguration>;
  corporationProfile: CorporationProfile;
  globalSettings: {
    orchestrationMode: 'always' | 'smart' | 'manual' | 'never';
    defaultPersonality: string;
    emergencyContacts: string[];
    backupBehavior: 'conservative' | 'maintain_last' | 'disable';
  };
  integrationSettings: {
    discordWebhook?: string;
    slackWebhook?: string;
    emailNotifications: boolean;
    mobileNotifications: boolean;
  };
  auditTrail: Array<{
    timestamp: string;
    userId: string;
    action: string;
    changes: Record<string, any>;
    reason?: string;
  }>;
}

export interface PersonalityBuilder {
  step: 'basics' | 'traits' | 'communication' | 'specialization' | 'review';
  data: {
    basics: {
      name: string;
      description: string;
      baseTemplate?: string;
    };
    traits: AgentPersonality['traits'];
    communication: AgentPersonality['communicationStyle'];
    specialization: AgentPersonality['specialization'];
  };
  validation: ConfigurationValidation;
}

export interface ConfigurationImportExport {
  version: string;
  exportedAt: string;
  exportedBy: string;
  corporationData: {
    profile: CorporationProfile;
    agentConfigurations: Record<string, AgentConfiguration>;
    globalSettings: AgentCustomization['globalSettings'];
  };
  metadata: {
    systemVersion: string;
    agentVersions: Record<string, string>;
    customizationCount: number;
  };
}

export interface ConfigurationAnalytics {
  corporationId: string;
  timeframe: {
    start: string;
    end: string;
  };
  usage: {
    totalInteractions: number;
    agentUtilization: Record<string, number>;
    popularFeatures: Array<{
      feature: string;
      usageCount: number;
      successRate: number;
    }>;
    configurationChanges: number;
  };
  performance: {
    averageResponseTime: number;
    userSatisfactionScore: number;
    errorRate: number;
    consultationEffectiveness: number;
  };
  recommendations: Array<{
    type: 'optimization' | 'feature' | 'configuration';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    expectedImpact: string;
  }>;
}