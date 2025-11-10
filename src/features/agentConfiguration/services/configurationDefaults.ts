/**
 * Default Configuration Generator
 * Provides default configurations, personalities, and templates
 */

import type {
  AgentConfiguration,
  AgentPersonality,
  CorporationProfile,
  ConfigurationTemplate
} from '../types';

export class ConfigurationDefaults {
  /**
   * Get default personalities
   */
  getDefaultPersonalities(): AgentPersonality[] {
    return [
      {
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
      },
      {
        id: 'friendly-casual',
        name: 'Friendly & Casual',
        description: 'Approachable, enthusiastic, conversational tone',
        traits: {
          formality: 25,
          enthusiasm: 85,
          riskTolerance: 60,
          detailLevel: 50,
          proactivity: 75
        },
        communicationStyle: {
          greeting: 'Hey there! Ready to tackle some',
          responsePrefix: 'So here\'s what I\'m seeing in the data -',
          uncertaintyPhrase: 'I\'m not 100% sure on this one, but',
          recommendationIntro: 'Here\'s what I\'d suggest:',
          farewellNote: 'Hope that helps! Hit me up anytime you need more info!'
        },
        specialization: {
          primaryFocus: ['user_engagement', 'accessibility', 'encouragement'],
          expertise: ['communication', 'motivation', 'simplification'],
          preferredTools: ['examples', 'visual_aids', 'step_by_step'],
          contextPriorities: ['user_experience', 'ease_of_use', 'positive_outcomes']
        }
      }
    ];
  }

  /**
   * Get personality by corporation type
   */
  getDefaultPersonalityForCorporationType(type: CorporationProfile['type']): AgentPersonality {
    // For now, return professional-efficient for all types
    // Could be customized based on corp type
    return this.getDefaultPersonalities()[0];
  }

  /**
   * Create default agent configurations for a corporation
   */
  createDefaultAgentConfigurations(profile: CorporationProfile): Record<string, AgentConfiguration> {
    const agents = [
      'economic-specialist',
      'recruiting-specialist',
      'market-specialist',
      'mining-specialist',
      'mission-specialist'
    ];

    const configs: Record<string, AgentConfiguration> = {};
    const defaultPersonality = this.getDefaultPersonalityForCorporationType(profile.type);

    for (const agentId of agents) {
      configs[agentId] = {
        id: `config-${agentId}-${Date.now()}`,
        agentId,
        corporationId: profile.corporationId,
        isEnabled: true,
        personality: defaultPersonality,
        customInstructions: this.generateDefaultInstructions(agentId, profile),
        toolsEnabled: this.getDefaultToolsForAgent(agentId),
        toolsDisabled: [],
        ragSources: ['general', agentId.replace('-specialist', '')],
        esiDataSources: this.getDefaultESISourcesForAgent(agentId, profile.type),
        responseParameters: {
          maxTokens: 1500,
          temperature: 0.7,
          topP: 0.9,
          presencePenalty: 0.1,
          frequencyPenalty: 0.1
        },
        behaviorSettings: {
          consultationThreshold: 70,
          confidenceThreshold: 80,
          escalationRules: ['low_confidence', 'conflicting_data', 'high_risk'],
          fallbackBehavior: 'conservative'
        },
        contextSettings: {
          memoryDepth: 10,
          contextualPriorities: this.getDefaultContextPriorities(agentId),
          ignoredTopics: [],
          specializedKnowledge: {}
        },
        outputFormatting: {
          useMarkdown: true,
          includeConfidence: true,
          showSources: true,
          includeTimestamps: false,
          customTemplates: {}
        },
        scheduleSettings: {
          activeHours: {
            start: '00:00',
            end: '23:59',
            timezone: profile.timezone || 'UTC'
          },
          maintenanceWindows: [],
          emergencyOverride: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };
    }

    return configs;
  }

  /**
   * Generate default instructions based on agent and profile
   */
  private generateDefaultInstructions(agentId: string, profile: CorporationProfile): string {
    const baseInstructions = `You are a specialized AI assistant for ${profile.name} [${profile.ticker}], a ${profile.type.replace(/_/g, ' ')} corporation.`;

    const cultureContext = profile.culture.values.length > 0
      ? ` Our core values are: ${profile.culture.values.join(', ')}.`
      : '';

    const activityContext = profile.operationalParameters.primaryActivities.length > 0
      ? ` We primarily focus on: ${profile.operationalParameters.primaryActivities.join(', ')}.`
      : '';

    return `${baseInstructions}${cultureContext}${activityContext} Always consider our corporation's context and goals when providing recommendations.`;
  }

  /**
   * Get default tools for specific agent
   */
  private getDefaultToolsForAgent(agentId: string): string[] {
    const commonTools = ['queryKnowledgeBase', 'manageKnowledgeBase'];

    switch (agentId) {
      case 'economic-specialist':
        return [...commonTools, 'getCorporationAnalysis', 'getMarketData', 'getCorporationWealth'];
      case 'recruiting-specialist':
        return [...commonTools, 'getCorporationAnalysis', 'getCorporationMembers'];
      case 'market-specialist':
        return [...commonTools, 'getMarketData', 'getSystemInfo'];
      case 'mining-specialist':
        return [...commonTools, 'getMarketData', 'getSystemInfo', 'getMiningInfo'];
      case 'mission-specialist':
        return [...commonTools, 'getSystemInfo'];
      default:
        return commonTools;
    }
  }

  /**
   * Get default ESI data sources for agent and corporation type
   */
  private getDefaultESISourcesForAgent(agentId: string, _corpType: CorporationProfile['type']): string[] {
    const common = ['corp-basic-info', 'corp-members'];

    switch (agentId) {
      case 'economic-specialist':
        return [...common, 'market-prices', 'economic-indices'];
      case 'market-specialist':
        return [...common, 'jita-market-orders', 'market-prices'];
      case 'mining-specialist':
        return [...common, 'market-prices'];
      default:
        return common;
    }
  }

  /**
   * Get default context priorities for agent
   */
  private getDefaultContextPriorities(agentId: string): string[] {
    const common = ['corporation_goals', 'recent_activity', 'user_preferences'];

    switch (agentId) {
      case 'economic-specialist':
        return [...common, 'market_conditions', 'financial_status'];
      case 'recruiting-specialist':
        return [...common, 'member_activity', 'retention_metrics'];
      case 'market-specialist':
        return [...common, 'price_trends', 'trading_volume'];
      case 'mining-specialist':
        return [...common, 'ore_prices', 'mining_locations'];
      case 'mission-specialist':
        return [...common, 'system_security', 'mission_types'];
      default:
        return common;
    }
  }

  /**
   * Get default configuration templates
   */
  getDefaultTemplates(): ConfigurationTemplate[] {
    // Future implementation - would return predefined templates
    return [];
  }
}
