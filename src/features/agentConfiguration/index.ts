// Types
export type {
  AgentPersonality,
  CorporationProfile,
  AgentConfiguration,
  ConfigurationTemplate,
  ConfigurationValidation,
  ConfigurationPreset,
  AgentCustomization,
  PersonalityBuilder,
  ConfigurationImportExport,
  ConfigurationAnalytics
} from './types';

// Configuration Manager
export { ConfigurationManager } from './configurationManager';

// Components
export { CorporationProfileWizard } from './components/CorporationProfileWizard';
export { AgentConfigurationDashboard } from './components/AgentConfigurationDashboard';
export { PersonalityBuilder } from './components/PersonalityBuilder';

// Hooks (for future implementation)
export const useConfigurationManager = () => {
  // This would integrate with React Context or state management
  // For now, we'll create a singleton instance
  return new ConfigurationManager();
};

// Utilities
export const validateConfiguration = (config: AgentConfiguration): ConfigurationValidation => {
  const manager = new ConfigurationManager();
  return (manager as any).validateAgentConfiguration(config);
};

export const validatePersonality = (personality: AgentPersonality): ConfigurationValidation => {
  const manager = new ConfigurationManager();
  return (manager as any).validatePersonality(personality);
};

export const validateCorporationProfile = (profile: CorporationProfile): ConfigurationValidation => {
  const manager = new ConfigurationManager();
  return (manager as any).validateCorporationProfile(profile);
};

// Default personalities for quick setup
export const getDefaultPersonalities = (): AgentPersonality[] => {
  const manager = new ConfigurationManager();
  return manager.getPersonalities();
};

// Default templates for quick setup
export const getDefaultTemplates = (): ConfigurationTemplate[] => {
  const manager = new ConfigurationManager();
  return manager.getTemplates();
};

// Re-export everything for convenience
export * from './types';
export * from './configurationManager';
export * from './components/CorporationProfileWizard';
export * from './components/AgentConfigurationDashboard';
export * from './components/PersonalityBuilder';