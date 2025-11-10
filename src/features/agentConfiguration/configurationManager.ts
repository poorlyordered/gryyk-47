/**
 * Configuration Manager
 * Main business logic layer for agent configuration management
 * Coordinates between storage, validation, and default generation
 */

import {
  AgentConfiguration,
  CorporationProfile,
  AgentPersonality,
  ConfigurationTemplate,
  AgentCustomization,
  ConfigurationImportExport,
  ConfigurationAnalytics
} from './types';
import { eventBus, type EventBus } from '../../core/event-bus';
import { ConfigurationStorage } from './services/configurationStorage';
import { ConfigurationDefaults } from './services/configurationDefaults';
import {
  validateConfiguration,
  validatePersonality,
  validateCorporationProfile
} from './utils/configurationValidator';

export class ConfigurationManager {
  private eventBus: EventBus;
  private storage: ConfigurationStorage;
  private defaults: ConfigurationDefaults;
  private configurations: Map<string, AgentCustomization> = new Map();
  private personalities: Map<string, AgentPersonality> = new Map();
  private templates: Map<string, ConfigurationTemplate> = new Map();

  constructor() {
    this.eventBus = eventBus;
    this.storage = new ConfigurationStorage();
    this.defaults = new ConfigurationDefaults();
    this.initializeDefaults();
  }

  /**
   * Initialize default personalities and templates
   */
  private initializeDefaults(): void {
    const defaultPersonalities = this.defaults.getDefaultPersonalities();
    defaultPersonalities.forEach(personality => {
      this.personalities.set(personality.id, personality);
    });

    const defaultTemplates = this.defaults.getDefaultTemplates();
    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // ==================== Corporation Profile Management ====================

  /**
   * Create a new corporation profile with default agent configurations
   */
  public async createCorporationProfile(
    profile: Omit<CorporationProfile, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CorporationProfile> {
    const newProfile: CorporationProfile = {
      ...profile,
      id: `corp-profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validate profile
    const validation = validateCorporationProfile(newProfile);
    if (!validation.isValid) {
      throw new Error(`Invalid corporation profile: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Create default agent configurations
    const defaultConfigs = this.defaults.createDefaultAgentConfigurations(newProfile);

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
    await this.storage.saveConfiguration(customization);

    // Emit event
    this.eventBus.emit('configuration:corporation:created', { profile: newProfile });

    return newProfile;
  }

  /**
   * Update corporation profile
   */
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
    const validation = validateCorporationProfile(updatedProfile);
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
    await this.storage.saveConfiguration(customization);

    // Emit event
    this.eventBus.emit('configuration:corporation:updated', {
      corporationId,
      profile: updatedProfile,
      changes: updates
    });

    return updatedProfile;
  }

  /**
   * Get corporation profile
   */
  public getCorporationProfile(corporationId: string): CorporationProfile | undefined {
    return this.configurations.get(corporationId)?.corporationProfile;
  }

  // ==================== Agent Configuration Management ====================

  /**
   * Update agent configuration
   */
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
    const validation = validateConfiguration(updatedConfig);
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
    await this.storage.saveConfiguration(customization);

    // Emit event
    this.eventBus.emit('configuration:agent:updated', {
      corporationId,
      agentId,
      configuration: updatedConfig,
      changes: updates
    });

    return updatedConfig;
  }

  /**
   * Get agent configuration
   */
  public getAgentConfiguration(corporationId: string, agentId: string): AgentConfiguration | undefined {
    return this.configurations.get(corporationId)?.agentConfigurations[agentId];
  }

  /**
   * Get all configurations for a corporation
   */
  public getAllConfigurations(corporationId: string): AgentCustomization | undefined {
    return this.configurations.get(corporationId);
  }

  // ==================== Personality Management ====================

  /**
   * Create custom personality
   */
  public async createPersonality(personality: Omit<AgentPersonality, 'id'>): Promise<AgentPersonality> {
    const newPersonality: AgentPersonality = {
      ...personality,
      id: `personality-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Validate personality
    const validation = validatePersonality(newPersonality);
    if (!validation.isValid) {
      throw new Error(`Invalid personality: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.personalities.set(newPersonality.id, newPersonality);

    // Persist to storage
    await this.storage.savePersonality(newPersonality);

    // Emit event
    this.eventBus.emit('configuration:personality:created', { personality: newPersonality });

    return newPersonality;
  }

  /**
   * Get all personalities
   */
  public getPersonalities(): AgentPersonality[] {
    return Array.from(this.personalities.values());
  }

  /**
   * Get specific personality
   */
  public getPersonality(id: string): AgentPersonality | undefined {
    return this.personalities.get(id);
  }

  // ==================== Template Management ====================

  /**
   * Apply configuration template to agents
   */
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
    for (const [agentId, _config] of Object.entries(customization.agentConfigurations)) {
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

  /**
   * Get all templates
   */
  public getTemplates(): ConfigurationTemplate[] {
    return Array.from(this.templates.values());
  }

  // ==================== Import/Export ====================

  /**
   * Export configuration for backup or migration
   */
  public async exportConfiguration(corporationId: string): Promise<ConfigurationImportExport> {
    const customization = this.configurations.get(corporationId);
    if (!customization) {
      throw new Error(`Corporation not found: ${corporationId}`);
    }

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: 'system',
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

  /**
   * Import configuration from backup or migration
   */
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

    // Validate imported profile
    const profileValidation = validateCorporationProfile(corporationData.profile);
    if (!profileValidation.isValid) {
      throw new Error(`Invalid imported profile: ${profileValidation.errors.map(e => e.message).join(', ')}`);
    }

    // Create customization from import
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
    await this.storage.saveConfiguration(customization);

    // Emit event
    this.eventBus.emit('configuration:imported', { corporationId, customization });

    return customization;
  }

  // ==================== Analytics ====================

  /**
   * Get configuration analytics and insights
   */
  public async getConfigurationAnalytics(
    corporationId: string,
    timeframe: { start: string; end: string }
  ): Promise<ConfigurationAnalytics> {
    // Mock analytics data - in production, would query actual usage data
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
}
