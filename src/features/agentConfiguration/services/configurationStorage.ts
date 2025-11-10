/**
 * Database/Storage Layer for Agent Configuration
 * Handles all persistence operations for configurations, profiles, and personalities
 */

import type {
  AgentConfiguration,
  AgentPersonality,
  AgentCustomization,
  CorporationProfile
} from '../types';

export class ConfigurationStorage {
  /**
   * Persist agent customization to storage
   */
  async saveConfiguration(customization: AgentCustomization): Promise<void> {
    try {
      // In production, this would save to MongoDB via API endpoint
      const key = `agent-config-${customization.corporationId}`;
      localStorage.setItem(key, JSON.stringify(customization));
      console.log(`Saved configuration for corporation ${customization.corporationId}`);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw new Error(`Failed to persist configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load agent customization from storage
   */
  async loadConfiguration(corporationId: string): Promise<AgentCustomization | null> {
    try {
      const key = `agent-config-${corporationId}`;
      const stored = localStorage.getItem(key);

      if (!stored) {
        return null;
      }

      return JSON.parse(stored) as AgentCustomization;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      return null;
    }
  }

  /**
   * Load all configurations
   */
  async loadAllConfigurations(): Promise<AgentCustomization[]> {
    try {
      const configurations: AgentCustomization[] = [];

      // Iterate through localStorage to find all configuration keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('agent-config-')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            configurations.push(JSON.parse(stored));
          }
        }
      }

      return configurations;
    } catch (error) {
      console.error('Failed to load configurations:', error);
      return [];
    }
  }

  /**
   * Delete configuration from storage
   */
  async deleteConfiguration(corporationId: string): Promise<void> {
    try {
      const key = `agent-config-${corporationId}`;
      localStorage.removeItem(key);
      console.log(`Deleted configuration for corporation ${corporationId}`);
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      throw new Error(`Failed to delete configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Persist personality to storage
   */
  async savePersonality(personality: AgentPersonality): Promise<void> {
    try {
      const key = `agent-personality-${personality.id}`;
      localStorage.setItem(key, JSON.stringify(personality));
      console.log(`Saved personality ${personality.id}`);
    } catch (error) {
      console.error('Failed to save personality:', error);
      throw new Error(`Failed to persist personality: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load personality from storage
   */
  async loadPersonality(personalityId: string): Promise<AgentPersonality | null> {
    try {
      const key = `agent-personality-${personalityId}`;
      const stored = localStorage.getItem(key);

      if (!stored) {
        return null;
      }

      return JSON.parse(stored) as AgentPersonality;
    } catch (error) {
      console.error('Failed to load personality:', error);
      return null;
    }
  }

  /**
   * Load all personalities
   */
  async loadAllPersonalities(): Promise<AgentPersonality[]> {
    try {
      const personalities: AgentPersonality[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('agent-personality-')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            personalities.push(JSON.parse(stored));
          }
        }
      }

      return personalities;
    } catch (error) {
      console.error('Failed to load personalities:', error);
      return [];
    }
  }

  /**
   * Update specific agent configuration
   */
  async updateAgentConfig(
    corporationId: string,
    agentId: string,
    config: AgentConfiguration
  ): Promise<void> {
    const customization = await this.loadConfiguration(corporationId);

    if (!customization) {
      throw new Error(`Configuration not found for corporation ${corporationId}`);
    }

    customization.agentConfigurations[agentId] = config;
    customization.corporationProfile.updatedAt = new Date().toISOString();

    await this.saveConfiguration(customization);
  }

  /**
   * Update corporation profile
   */
  async updateCorporationProfile(
    corporationId: string,
    profile: CorporationProfile
  ): Promise<void> {
    const customization = await this.loadConfiguration(corporationId);

    if (!customization) {
      throw new Error(`Configuration not found for corporation ${corporationId}`);
    }

    customization.corporationProfile = profile;
    await this.saveConfiguration(customization);
  }
}
