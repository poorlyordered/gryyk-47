import { apiClient } from '../core/api-client';

export interface PipelineConfigData {
  enabled: boolean;
  maxConcurrentRequests: number;
  rateLimitBuffer: number;
  retryAttempts: number;
  backoffStrategy: 'linear' | 'exponential';
  errorThreshold: number;
  ragIntegration: {
    enabled: boolean;
    batchSize: number;
    processingDelay: number;
    includeMetadata: boolean;
  };
  storage: {
    cacheEnabled: boolean;
    cacheDuration: number;
    persistToMongoDB: boolean;
    compressionEnabled: boolean;
  };
  monitoring: {
    metricsEnabled: boolean;
    alertOnFailures: boolean;
    performanceTracking: boolean;
  };
}

export interface PipelineConfigResponse {
  config: PipelineConfigData & {
    corporationId: string;
    updatedAt?: string;
    updatedBy?: string;
  };
  isDefault: boolean;
}

export class PipelineConfigService {
  private static instance: PipelineConfigService;
  private baseUrl = '/.netlify/functions/pipeline-config';

  private constructor() {}

  public static getInstance(): PipelineConfigService {
    if (!PipelineConfigService.instance) {
      PipelineConfigService.instance = new PipelineConfigService();
    }
    return PipelineConfigService.instance;
  }

  /**
   * Get pipeline configuration for a corporation
   */
  async getConfig(corporationId: string): Promise<PipelineConfigResponse> {
    try {
      const response = await apiClient.get<PipelineConfigResponse>(
        `${this.baseUrl}?corporationId=${encodeURIComponent(corporationId)}`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch pipeline config:', error);
      throw new Error('Failed to fetch pipeline configuration');
    }
  }

  /**
   * Save pipeline configuration for a corporation
   */
  async saveConfig(
    corporationId: string,
    config: PipelineConfigData
  ): Promise<PipelineConfigResponse['config']> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        config: PipelineConfigResponse['config'];
        modified: boolean;
        upserted: boolean;
      }>(this.baseUrl, {
        ...config,
        corporationId
      });

      if (!response.success) {
        throw new Error('Failed to save configuration');
      }

      return response.config;
    } catch (error) {
      console.error('Failed to save pipeline config:', error);
      throw new Error('Failed to save pipeline configuration');
    }
  }

  /**
   * Update specific configuration fields
   */
  async updateConfig(
    corporationId: string,
    updates: Partial<PipelineConfigData>
  ): Promise<PipelineConfigResponse['config']> {
    try {
      // First get current config
      const current = await this.getConfig(corporationId);

      // Merge with updates
      const updatedConfig: PipelineConfigData = {
        ...current.config,
        ...updates,
        // Handle nested updates
        ragIntegration: {
          ...current.config.ragIntegration,
          ...(updates.ragIntegration || {})
        },
        storage: {
          ...current.config.storage,
          ...(updates.storage || {})
        },
        monitoring: {
          ...current.config.monitoring,
          ...(updates.monitoring || {})
        }
      };

      // Save merged config
      return await this.saveConfig(corporationId, updatedConfig);
    } catch (error) {
      console.error('Failed to update pipeline config:', error);
      throw new Error('Failed to update pipeline configuration');
    }
  }

  /**
   * Delete configuration (reset to defaults)
   */
  async deleteConfig(corporationId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        deleted: boolean;
      }>(`${this.baseUrl}?corporationId=${encodeURIComponent(corporationId)}`);

      return response.success && response.deleted;
    } catch (error) {
      console.error('Failed to delete pipeline config:', error);
      throw new Error('Failed to delete pipeline configuration');
    }
  }

  /**
   * Validate configuration data
   */
  validateConfig(config: PipelineConfigData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate pipeline settings
    if (config.maxConcurrentRequests < 1 || config.maxConcurrentRequests > 20) {
      errors.push('Max concurrent requests must be between 1 and 20');
    }

    if (config.rateLimitBuffer < 10 || config.rateLimitBuffer > 100) {
      errors.push('Rate limit buffer must be between 10 and 100');
    }

    if (config.retryAttempts < 0 || config.retryAttempts > 10) {
      errors.push('Retry attempts must be between 0 and 10');
    }

    if (config.errorThreshold < 1 || config.errorThreshold > 20) {
      errors.push('Error threshold must be between 1 and 20');
    }

    // Validate RAG integration
    if (config.ragIntegration.enabled) {
      if (config.ragIntegration.batchSize < 1 || config.ragIntegration.batchSize > 100) {
        errors.push('RAG batch size must be between 1 and 100');
      }

      if (config.ragIntegration.processingDelay < 0 || config.ragIntegration.processingDelay > 5000) {
        errors.push('RAG processing delay must be between 0 and 5000ms');
      }
    }

    // Validate storage
    if (config.storage.cacheEnabled) {
      if (config.storage.cacheDuration < 1 || config.storage.cacheDuration > 1440) {
        errors.push('Cache duration must be between 1 and 1440 minutes');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const pipelineConfigService = PipelineConfigService.getInstance();
