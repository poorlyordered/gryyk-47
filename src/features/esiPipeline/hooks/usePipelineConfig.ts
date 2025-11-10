import { useState, useEffect, useCallback } from 'react';
import { pipelineConfigService, PipelineConfigData } from '../../../services/pipelineConfigService';
import { useAuthStore } from '../../../store/auth';

export const usePipelineConfig = () => {
  const [config, setConfig] = useState<PipelineConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const { user } = useAuthStore();
  const corporationId = user?.characterData?.corporation_id?.toString() || 'default';

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, [corporationId]);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await pipelineConfigService.getConfig(corporationId);
      setConfig(response.config);
      setIsDefault(response.isDefault);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
      console.error('Failed to load pipeline config:', err);
    } finally {
      setIsLoading(false);
    }
  }, [corporationId]);

  const saveConfig = useCallback(async (newConfig: PipelineConfigData): Promise<boolean> => {
    try {
      setIsSaving(true);
      setError(null);

      // Validate configuration
      const validation = pipelineConfigService.validateConfig(newConfig);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return false;
      }

      // Save to backend
      const savedConfig = await pipelineConfigService.saveConfig(corporationId, newConfig);

      // Update local state
      setConfig(savedConfig);
      setIsDefault(false);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
      console.error('Failed to save pipeline config:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [corporationId]);

  const updateConfig = useCallback(async (updates: Partial<PipelineConfigData>): Promise<boolean> => {
    try {
      setIsSaving(true);
      setError(null);

      const updatedConfig = await pipelineConfigService.updateConfig(corporationId, updates);
      setConfig(updatedConfig);
      setIsDefault(false);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
      console.error('Failed to update pipeline config:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [corporationId]);

  const resetConfig = useCallback(async (): Promise<boolean> => {
    try {
      setIsSaving(true);
      setError(null);

      await pipelineConfigService.deleteConfig(corporationId);
      await loadConfig(); // Reload to get defaults

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset configuration');
      console.error('Failed to reset pipeline config:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [corporationId, loadConfig]);

  const refreshConfig = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  return {
    config,
    isLoading,
    error,
    isSaving,
    isDefault,
    saveConfig,
    updateConfig,
    resetConfig,
    refreshConfig
  };
};
