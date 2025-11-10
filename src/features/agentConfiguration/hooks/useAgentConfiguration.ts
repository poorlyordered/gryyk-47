import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import type { AgentConfiguration, ConfigurationValidation } from '../types';
import { validateConfiguration } from '../utils/configurationValidator';
import { createDefaultConfig } from '../utils/configurationFactory';
import { getAgentInfo } from '../constants/agentInfo';

export interface UseAgentConfigurationProps {
  agentId: string;
  corporationId: string;
  initialConfig?: AgentConfiguration;
  onSave: (config: AgentConfiguration) => Promise<void>;
}

export interface UseAgentConfigurationReturn {
  config: AgentConfiguration;
  setConfig: React.Dispatch<React.SetStateAction<AgentConfiguration>>;
  validation: ConfigurationValidation | null;
  isLoading: boolean;
  hasChanges: boolean;
  agentInfo: ReturnType<typeof getAgentInfo>;
  handleSave: () => Promise<void>;
  handleReset: () => void;
  handleImport: (jsonString: string) => void;
  handleExport: () => string;
  updateConfig: <K extends keyof AgentConfiguration>(
    key: K,
    value: AgentConfiguration[K]
  ) => void;
}

/**
 * Custom hook for managing agent configuration state
 */
export const useAgentConfiguration = ({
  agentId,
  corporationId,
  initialConfig,
  onSave
}: UseAgentConfigurationProps): UseAgentConfigurationReturn => {
  const [config, setConfig] = useState<AgentConfiguration>(
    initialConfig || createDefaultConfig(agentId, corporationId)
  );
  const [validation, setValidation] = useState<ConfigurationValidation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const toast = useToast();

  const agentInfo = getAgentInfo(agentId);

  // Validate configuration whenever it changes
  useEffect(() => {
    const validationResult = validateConfiguration(config);
    setValidation(validationResult);
  }, [config]);

  // Track changes
  useEffect(() => {
    if (initialConfig) {
      setHasChanges(JSON.stringify(config) !== JSON.stringify(initialConfig));
    }
  }, [config, initialConfig]);

  // Save configuration
  const handleSave = useCallback(async () => {
    if (!validation?.isValid) {
      toast({
        title: 'Configuration Invalid',
        description: 'Please fix validation errors before saving',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSave(config);
      setHasChanges(false);
      toast({
        title: 'Configuration Saved',
        description: `${agentInfo?.name} configuration has been updated`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save configuration',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [config, validation, onSave, toast, agentInfo]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    const defaultConfig = createDefaultConfig(agentId, corporationId);
    setConfig(defaultConfig);
    toast({
      title: 'Configuration Reset',
      description: 'Configuration has been reset to default values',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  }, [agentId, corporationId, toast]);

  // Import configuration
  const handleImport = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString) as AgentConfiguration;
      const now = new Date().toISOString();

      setConfig({
        ...imported,
        id: `config-${imported.agentId}-${Date.now()}`,
        corporationId,
        createdAt: now,
        updatedAt: now,
        version: 1
      });

      toast({
        title: 'Configuration Imported',
        description: 'Configuration has been imported successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import configuration',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [corporationId, toast]);

  // Export configuration
  const handleExport = useCallback(() => {
    return JSON.stringify(config, null, 2);
  }, [config]);

  // Update specific config field
  const updateConfig = useCallback(<K extends keyof AgentConfiguration>(
    key: K,
    value: AgentConfiguration[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      [key]: value,
      updatedAt: new Date().toISOString(),
      version: prev.version + 1
    }));
  }, []);

  return {
    config,
    setConfig,
    validation,
    isLoading,
    hasChanges,
    agentInfo,
    handleSave,
    handleReset,
    handleImport,
    handleExport,
    updateConfig
  };
};
