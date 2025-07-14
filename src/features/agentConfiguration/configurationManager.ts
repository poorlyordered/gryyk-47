import {
  AgentConfiguration,
  CorporationProfile,
  AgentPersonality,
  ConfigurationTemplate,
  ConfigurationValidation,
  AgentCustomization,
  ConfigurationImportExport,
  ConfigurationAnalytics
} from './types';
import { eventBus, type EventBus } from '../../core/event-bus';

export class ConfigurationManager {
  private eventBus: EventBus;
  private configurations: Map<string, AgentCustomization> = new Map();
  private templates: Map<string, ConfigurationTemplate> = new Map();
  private personalities: Map<string, AgentPersonality> = new Map();

  constructor() {
    this.eventBus = eventBus;
    this.loadDefaultTemplates();
    this.loadDefaultPersonalities();
  }

  // Corporation Profile Management
  public async createCorporationProfile(profile: Omit<CorporationProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<CorporationProfile> {
    const newProfile: CorporationProfile = {
      ...profile,
      id: `corp-profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validate profile
    const validation = this.validateCorporationProfile(newProfile);
    if (!validation.isValid) {
      throw new Error(`Invalid corporation profile: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Create default agent configurations for this corporation
    const defaultConfigs = await this.createDefaultAgentConfigurations(newProfile);
    
    const customization: AgentCustomization = {
      corporationId: newProfile.corporationId,
      corporationProfile: newProfile,
      agentConfigurations: defaultConfigs,
      globalSettings: {
        orchestrationMode: 'smart',
        defaultPersonality: 'professional-efficient',
        emergencyContacts: [],
        backupBehavior: 'conservative'
      },
      integrationSettings: {
        emailNotifications: true,
        mobileNotifications: false
      },
      auditTrail: [{
        timestamp: new Date().toISOString(),
        userId: 'system',
        action: 'corporation_profile_created',
        changes: newProfile
      }]
    };

    this.configurations.set(newProfile.corporationId, customization);
    
    // Persist to storage
    await this.persistConfiguration(customization);
    
    // Emit event
    this.eventBus.emit('configuration:corporation:created', { profile: newProfile });
    
    return newProfile;
  }

  public async updateCorporationProfile(
    corporationId: string, 
    updates: Partial<CorporationProfile>,
    userId: string,
    reason?: string
  ): Promise<CorporationProfile> {
    const customization = this.configurations.get(corporationId);
    if (!customization) {
      throw new Error(`Corporation profile not found: ${corporationId}`);
    }

    const updatedProfile: CorporationProfile = {
      ...customization.corporationProfile,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Validate updated profile
    const validation = this.validateCorporationProfile(updatedProfile);
    if (!validation.isValid) {
      throw new Error(`Invalid profile update: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Update customization
    customization.corporationProfile = updatedProfile;
    customization.auditTrail.push({
      timestamp: new Date().toISOString(),
      userId,
      action: 'corporation_profile_updated',
      changes: updates,
      reason
    });

    // Persist changes
    await this.persistConfiguration(customization);

    // Emit event
    this.eventBus.emit('configuration:corporation:updated', { 
      corporationId, 
      profile: updatedProfile, 
      changes: updates 
    });

    return updatedProfile;
  }

  // Agent Configuration Management
  public async updateAgentConfiguration(
    corporationId: string,
    agentId: string,
    updates: Partial<AgentConfiguration>,
    userId: string,
    reason?: string
  ): Promise<AgentConfiguration> {
    const customization = this.configurations.get(corporationId);
    if (!customization) {
      throw new Error(`Corporation not found: ${corporationId}`);
    }

    const currentConfig = customization.agentConfigurations[agentId];
    if (!currentConfig) {
      throw new Error(`Agent configuration not found: ${agentId}`);
    }

    const updatedConfig: AgentConfiguration = {
      ...currentConfig,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: currentConfig.version + 1
    };

    // Validate configuration
    const validation = this.validateAgentConfiguration(updatedConfig);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Update configuration
    customization.agentConfigurations[agentId] = updatedConfig;
    customization.auditTrail.push({
      timestamp: new Date().toISOString(),
      userId,
      action: 'agent_configuration_updated',
      changes: { agentId, updates },
      reason
    });

    // Persist changes
    await this.persistConfiguration(customization);

    // Emit event
    this.eventBus.emit('configuration:agent:updated', {
      corporationId,
      agentId,
      configuration: updatedConfig,
      changes: updates
    });

    return updatedConfig;
  }

  // Personality Management
  public async createPersonality(personality: Omit<AgentPersonality, 'id'>): Promise<AgentPersonality> {
    const newPersonality: AgentPersonality = {
      ...personality,
      id: `personality-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Validate personality
    const validation = this.validatePersonality(newPersonality);
    if (!validation.isValid) {
      throw new Error(`Invalid personality: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.personalities.set(newPersonality.id, newPersonality);

    // Persist to storage
    await this.persistPersonality(newPersonality);

    // Emit event
    this.eventBus.emit('configuration:personality:created', { personality: newPersonality });

    return newPersonality;
  }

  public getPersonalities(): AgentPersonality[] {
    return Array.from(this.personalities.values());
  }

  public getPersonality(id: string): AgentPersonality | undefined {
    return this.personalities.get(id);
  }

  // Template Management
  public async applyTemplate(
    corporationId: string,
    templateId: string,
    userId: string,
    customizations?: Partial<AgentConfiguration>
  ): Promise<AgentConfiguration[]> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const customization = this.configurations.get(corporationId);
    if (!customization) {
      throw new Error(`Corporation not found: ${corporationId}`);
    }

    const updatedConfigs: AgentConfiguration[] = [];

    // Apply template to applicable agents
    for (const [agentId, config] of Object.entries(customization.agentConfigurations)) {
      if (template.configuration && (
        !template.configuration.agentId || 
        template.configuration.agentId === agentId
      )) {
        const updatedConfig = await this.updateAgentConfiguration(
          corporationId,
          agentId,
          {
            ...template.configuration,
            ...customizations
          },
          userId,
          `Applied template: ${template.name}`
        );
        updatedConfigs.push(updatedConfig);
      }
    }

    // Update template usage count
    template.usageCount += 1;

    return updatedConfigs;
  }

  // Validation Methods
  private validateCorporationProfile(profile: CorporationProfile): ConfigurationValidation {
    const errors: ConfigurationValidation['errors'] = [];
    const warnings: ConfigurationValidation['warnings'] = [];

    // Required fields validation
    if (!profile.name || profile.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Corporation name is required',
        severity: 'error'
      });
    }

    if (!profile.corporationId || profile.corporationId.trim().length === 0) {
      errors.push({
        field: 'corporationId',
        message: 'Corporation ID is required',
        severity: 'error'
      });
    }

    if (!profile.type) {
      errors.push({
        field: 'type',
        message: 'Corporation type is required',
        severity: 'error'
      });
    }

    // Warnings for optional but recommended fields
    if (!profile.culture.values || profile.culture.values.length === 0) {
      warnings.push({
        field: 'culture.values',
        message: 'No corporation values defined',
        recommendation: 'Define corporation values to improve agent alignment'
      });
    }

    if (!profile.operationalParameters.primaryActivities || profile.operationalParameters.primaryActivities.length === 0) {
      warnings.push({
        field: 'operationalParameters.primaryActivities',
        message: 'No primary activities defined',
        recommendation: 'Define primary activities to optimize agent recommendations'
      });
    }

    const score = Math.max(0, 100 - (errors.length * 25) - (warnings.length * 5));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
      suggestions: this.generateProfileSuggestions(profile, warnings)
    };
  }

  private validateAgentConfiguration(config: AgentConfiguration): ConfigurationValidation {
    const errors: ConfigurationValidation['errors'] = [];
    const warnings: ConfigurationValidation['warnings'] = [];

    // Validate response parameters
    if (config.responseParameters.temperature < 0 || config.responseParameters.temperature > 2) {
      errors.push({
        field: 'responseParameters.temperature',
        message: 'Temperature must be between 0 and 2',
        severity: 'error'
      });
    }

    if (config.responseParameters.maxTokens < 100 || config.responseParameters.maxTokens > 4000) {
      warnings.push({
        field: 'responseParameters.maxTokens',
        message: 'Max tokens outside recommended range',
        recommendation: 'Use 500-2000 tokens for optimal performance'
      });
    }

    // Validate behavior settings
    if (config.behaviorSettings.consultationThreshold < 0 || config.behaviorSettings.consultationThreshold > 100) {
      errors.push({
        field: 'behaviorSettings.consultationThreshold',
        message: 'Consultation threshold must be between 0 and 100',
        severity: 'error'
      });
    }

    // Check for conflicting settings
    if (config.behaviorSettings.confidenceThreshold > 90 && config.behaviorSettings.consultationThreshold < 20) {
      warnings.push({
        field: 'behaviorSettings',
        message: 'High confidence threshold with low consultation threshold may reduce collaboration',
        recommendation: 'Consider balancing confidence and consultation thresholds'
      });
    }

    const score = Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
      suggestions: this.generateConfigSuggestions(config, warnings)
    };
  }

  private validatePersonality(personality: AgentPersonality): ConfigurationValidation {
    const errors: ConfigurationValidation['errors'] = [];
    const warnings: ConfigurationValidation['warnings'] = [];

    // Validate trait ranges
    Object.entries(personality.traits).forEach(([trait, value]) => {
      if (value < 0 || value > 100) {
        errors.push({
          field: `traits.${trait}`,
          message: `${trait} must be between 0 and 100`,
          severity: 'error'
        });
      }
    });

    // Validate communication style
    if (!personality.communicationStyle.greeting || personality.communicationStyle.greeting.trim().length === 0) {
      warnings.push({
        field: 'communicationStyle.greeting',
        message: 'No greeting defined',
        recommendation: 'Add a greeting to improve user experience'
      });
    }

    const score = Math.max(0, 100 - (errors.length * 15) - (warnings.length * 5));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
      suggestions: []
    };
  }

  // Import/Export Methods
  public async exportConfiguration(corporationId: string): Promise<ConfigurationImportExport> {
    const customization = this.configurations.get(corporationId);
    if (!customization) {
      throw new Error(`Corporation not found: ${corporationId}`);
    }

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: 'system', // Would be actual user in production
      corporationData: {
        profile: customization.corporationProfile,
        agentConfigurations: customization.agentConfigurations,
        globalSettings: customization.globalSettings
      },
      metadata: {
        systemVersion: '1.0.0',
        agentVersions: Object.fromEntries(
          Object.entries(customization.agentConfigurations).map(([agentId, config]) => [
            agentId,
            config.version.toString()
          ])
        ),
        customizationCount: Object.keys(customization.agentConfigurations).length
      }
    };
  }

  public async importConfiguration(
    importData: ConfigurationImportExport,
    userId: string,
    overwriteExisting = false
  ): Promise<AgentCustomization> {
    const { corporationData } = importData;
    const corporationId = corporationData.profile.corporationId;

    // Check if configuration already exists
    if (this.configurations.has(corporationId) && !overwriteExisting) {
      throw new Error(`Configuration already exists for corporation ${corporationId}. Use overwriteExisting=true to replace.`);
    }

    // Validate imported data
    const profileValidation = this.validateCorporationProfile(corporationData.profile);
    if (!profileValidation.isValid) {
      throw new Error(`Invalid imported profile: ${profileValidation.errors.map(e => e.message).join(', ')}`);
    }

    // Create new customization
    const customization: AgentCustomization = {
      corporationId,
      corporationProfile: {
        ...corporationData.profile,
        updatedAt: new Date().toISOString()
      },
      agentConfigurations: corporationData.agentConfigurations,
      globalSettings: corporationData.globalSettings,
      integrationSettings: {
        emailNotifications: true,
        mobileNotifications: false
      },
      auditTrail: [{
        timestamp: new Date().toISOString(),
        userId,
        action: 'configuration_imported',
        changes: { source: 'import', version: importData.version }
      }]
    };

    this.configurations.set(corporationId, customization);
    await this.persistConfiguration(customization);

    // Emit event
    this.eventBus.emit('configuration:imported', { corporationId, customization });

    return customization;
  }

  // Analytics and Insights
  public async getConfigurationAnalytics(
    corporationId: string,
    timeframe: { start: string; end: string }
  ): Promise<ConfigurationAnalytics> {
    // Mock analytics data - in production, this would query actual usage data
    return {
      corporationId,
      timeframe,
      usage: {
        totalInteractions: 247,
        agentUtilization: {
          'economic-specialist': 89,
          'recruiting-specialist': 34,
          'market-specialist': 67,
          'mining-specialist': 45,
          'mission-specialist': 23
        },
        popularFeatures: [
          { feature: 'market_analysis', usageCount: 78, successRate: 94 },
          { feature: 'mining_optimization', usageCount: 45, successRate: 89 },
          { feature: 'recruitment_planning', usageCount: 34, successRate: 91 }
        ],
        configurationChanges: 12
      },
      performance: {
        averageResponseTime: 1247,
        userSatisfactionScore: 87,
        errorRate: 2.3,
        consultationEffectiveness: 92
      },
      recommendations: [
        {
          type: 'optimization',
          priority: 'medium',
          title: 'Increase Economic Specialist Proactivity',
          description: 'Based on usage patterns, users would benefit from more proactive economic insights',
          expectedImpact: '15% increase in economic decision confidence'
        },
        {
          type: 'feature',
          priority: 'low',
          title: 'Enable Real-time Market Alerts',
          description: 'Market specialist could provide real-time opportunity alerts',
          expectedImpact: 'Better market timing and profit optimization'
        }
      ]
    };
  }

  // Private Helper Methods
  private async createDefaultAgentConfigurations(profile: CorporationProfile): Promise<Record<string, AgentConfiguration>> {
    const agents = ['economic-specialist', 'recruiting-specialist', 'market-specialist', 'mining-specialist', 'mission-specialist'];
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

  private loadDefaultPersonalities(): void {
    const defaultPersonalities: AgentPersonality[] = [
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
          farewellNote: 'Hope that helps! Hit me up anytime you need more info! 👍'
        },
        specialization: {
          primaryFocus: ['user_engagement', 'accessibility', 'encouragement'],
          expertise: ['communication', 'motivation', 'simplification'],
          preferredTools: ['examples', 'visual_aids', 'step_by_step'],
          contextPriorities: ['user_experience', 'ease_of_use', 'positive_outcomes']
        }
      }
    ];

    defaultPersonalities.forEach(personality => {
      this.personalities.set(personality.id, personality);
    });
  }

  private loadDefaultTemplates(): void {
    // Implementation would load predefined configuration templates
  }

  private getDefaultPersonalityForCorporationType(type: CorporationProfile['type']): AgentPersonality {
    // Return appropriate personality based on corporation type
    return this.personalities.get('professional-efficient')!;
  }

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

  private getDefaultESISourcesForAgent(agentId: string, corpType: CorporationProfile['type']): string[] {
    // Return relevant ESI data sources based on agent and corporation type
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

  private generateProfileSuggestions(profile: CorporationProfile, warnings: ConfigurationValidation['warnings']): string[] {
    const suggestions: string[] = [];
    
    if (warnings.some(w => w.field.includes('values'))) {
      suggestions.push('Define corporation values to improve agent alignment with your culture');
    }
    
    if (warnings.some(w => w.field.includes('activities'))) {
      suggestions.push('Specify primary activities to optimize agent recommendations');
    }
    
    return suggestions;
  }

  private generateConfigSuggestions(config: AgentConfiguration, warnings: ConfigurationValidation['warnings']): string[] {
    const suggestions: string[] = [];
    
    if (warnings.some(w => w.field.includes('Token'))) {
      suggestions.push('Consider adjusting response length for better user experience');
    }
    
    return suggestions;
  }

  private async persistConfiguration(customization: AgentCustomization): Promise<void> {
    // Implementation would persist to MongoDB/localStorage
    console.log(`Persisting configuration for corporation ${customization.corporationId}`);
  }

  private async persistPersonality(personality: AgentPersonality): Promise<void> {
    // Implementation would persist to storage
    console.log(`Persisting personality ${personality.id}`);
  }

  // Public API Methods
  public getCorporationProfile(corporationId: string): CorporationProfile | undefined {
    return this.configurations.get(corporationId)?.corporationProfile;
  }

  public getAgentConfiguration(corporationId: string, agentId: string): AgentConfiguration | undefined {
    return this.configurations.get(corporationId)?.agentConfigurations[agentId];
  }

  public getAllConfigurations(corporationId: string): AgentCustomization | undefined {
    return this.configurations.get(corporationId);
  }

  public getTemplates(): ConfigurationTemplate[] {
    return Array.from(this.templates.values());
  }
}