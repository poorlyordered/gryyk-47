import { EventBus } from '../core/event-bus';

export interface ESIDataSource {
  id: string;
  name: string;
  endpoint: string;
  type: 'corporation' | 'character' | 'market' | 'universe' | 'sovereignty';
  updateFrequency: number; // minutes
  priority: 'low' | 'medium' | 'high' | 'critical';
  parameters?: Record<string, any>;
  transformer?: (data: any) => any;
  validator?: (data: any) => boolean;
  lastUpdate?: string;
  nextUpdate?: string;
  isEnabled: boolean;
}

export interface PipelineConfig {
  enabled: boolean;
  maxConcurrentRequests: number;
  rateLimitBuffer: number; // percentage of rate limit to use
  retryAttempts: number;
  backoffStrategy: 'linear' | 'exponential';
  errorThreshold: number; // max errors before disabling source
  dataSources: ESIDataSource[];
  ragIntegration: {
    enabled: boolean;
    batchSize: number;
    processingDelay: number; // ms between batches
    includeMetadata: boolean;
  };
  storage: {
    cacheEnabled: boolean;
    cacheDuration: number; // minutes
    persistToMongoDB: boolean;
    compressionEnabled: boolean;
  };
  monitoring: {
    metricsEnabled: boolean;
    alertOnFailures: boolean;
    performanceTracking: boolean;
  };
}

export interface PipelineMetrics {
  dataSource: string;
  timestamp: string;
  requestDuration: number;
  dataSize: number;
  recordsProcessed: number;
  errorsEncountered: number;
  cacheHitRate: number;
  rateLimitRemaining: number;
  transformationTime: number;
  ragIngestionTime: number;
}

export interface DataIngestionResult {
  dataSourceId: string;
  success: boolean;
  timestamp: string;
  recordsIngested: number;
  dataSize: number;
  processingTime: number;
  errors: string[];
  warnings: string[];
  metadata: {
    endpoint: string;
    parameters: Record<string, any>;
    rateLimitRemaining: number;
    cacheHit: boolean;
    transformationApplied: boolean;
    ragIntegrated: boolean;
  };
}

export class ESIDataPipeline {
  private config: PipelineConfig;
  private eventBus: EventBus;
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private activeRequests: Map<string, Promise<any>> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private cache: Map<string, { data: any; timestamp: number; expires: number }> = new Map();
  private metrics: PipelineMetrics[] = [];
  private isRunning = false;

  constructor(config: PipelineConfig) {
    this.config = config;
    this.eventBus = eventBus;
  }

  public async start(): Promise<void> {
    if (this.isRunning || !this.config.enabled) return;

    console.log('🔄 Starting ESI Data Pipeline...');
    this.isRunning = true;

    // Schedule all enabled data sources
    for (const dataSource of this.config.dataSources) {
      if (dataSource.isEnabled) {
        this.scheduleDataSource(dataSource);
      }
    }

    // Start cache cleanup interval
    this.startCacheCleanup();

    // Emit pipeline started event
    this.eventBus.emit('esi:pipeline:started', { 
      dataSources: this.config.dataSources.filter(ds => ds.isEnabled).length 
    });

    console.log(`✅ ESI Pipeline started with ${this.config.dataSources.filter(ds => ds.isEnabled).length} data sources`);
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🛑 Stopping ESI Data Pipeline...');
    this.isRunning = false;

    // Clear all scheduled jobs
    for (const [sourceId, timeout] of this.scheduledJobs) {
      clearTimeout(timeout);
    }
    this.scheduledJobs.clear();

    // Wait for active requests to complete (with timeout)
    const activePromises = Array.from(this.activeRequests.values());
    if (activePromises.length > 0) {
      console.log(`⏳ Waiting for ${activePromises.length} active requests to complete...`);
      await Promise.allSettled(activePromises);
    }

    // Emit pipeline stopped event
    this.eventBus.emit('esi:pipeline:stopped', {
      finalMetrics: this.getMetricsSummary()
    });

    console.log('✅ ESI Pipeline stopped');
  }

  private scheduleDataSource(dataSource: ESIDataSource): void {
    const intervalMs = dataSource.updateFrequency * 60 * 1000;
    
    // Calculate next update time
    const now = new Date();
    const nextUpdate = new Date(now.getTime() + intervalMs);
    dataSource.nextUpdate = nextUpdate.toISOString();

    // Schedule initial execution (with slight delay to avoid thundering herd)
    const initialDelay = Math.random() * 5000; // 0-5 second random delay
    
    const scheduleNext = () => {
      if (!this.isRunning || !dataSource.isEnabled) return;

      const timeout = setTimeout(async () => {
        try {
          await this.processDataSource(dataSource);
        } catch (error) {
          console.error(`Error processing data source ${dataSource.id}:`, error);
          this.incrementErrorCount(dataSource.id);
        }
        
        // Schedule next execution if still running
        if (this.isRunning && dataSource.isEnabled) {
          scheduleNext();
        }
      }, intervalMs);

      this.scheduledJobs.set(dataSource.id, timeout);
    };

    // Start with initial delay
    setTimeout(() => {
      this.processDataSource(dataSource).catch(error => {
        console.error(`Initial processing error for ${dataSource.id}:`, error);
        this.incrementErrorCount(dataSource.id);
      });
      scheduleNext();
    }, initialDelay);
  }

  private async processDataSource(dataSource: ESIDataSource): Promise<DataIngestionResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    console.log(`🔍 Processing data source: ${dataSource.name}`);

    // Check if we're already processing this source
    if (this.activeRequests.has(dataSource.id)) {
      console.log(`⏭️ Skipping ${dataSource.id} - already processing`);
      return this.createErrorResult(dataSource, timestamp, ['Already processing']);
    }

    // Check error threshold
    const errorCount = this.errorCounts.get(dataSource.id) || 0;
    if (errorCount >= this.config.errorThreshold) {
      console.log(`⚠️ Disabling ${dataSource.id} - too many errors (${errorCount})`);
      dataSource.isEnabled = false;
      return this.createErrorResult(dataSource, timestamp, ['Disabled due to error threshold']);
    }

    // Check rate limits
    if (!await this.checkRateLimit()) {
      console.log(`⏸️ Rate limit reached - delaying ${dataSource.id}`);
      return this.createErrorResult(dataSource, timestamp, ['Rate limit reached']);
    }

    const processPromise = this.executeDataSourceRequest(dataSource, timestamp, startTime);
    this.activeRequests.set(dataSource.id, processPromise);

    try {
      const result = await processPromise;
      this.resetErrorCount(dataSource.id);
      return result;
    } catch (error) {
      this.incrementErrorCount(dataSource.id);
      throw error;
    } finally {
      this.activeRequests.delete(dataSource.id);
    }
  }

  private async executeDataSourceRequest(
    dataSource: ESIDataSource, 
    timestamp: string, 
    startTime: number
  ): Promise<DataIngestionResult> {
    let cacheHit = false;
    let transformationApplied = false;
    let ragIntegrated = false;
    let recordsIngested = 0;
    let dataSize = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check cache first
      let data = await this.checkCache(dataSource);
      if (data) {
        cacheHit = true;
        console.log(`💾 Cache hit for ${dataSource.id}`);
      } else {
        // Fetch from ESI
        data = await this.fetchFromESI(dataSource);
        
        // Cache the data
        if (this.config.storage.cacheEnabled) {
          await this.cacheData(dataSource, data);
        }
      }

      // Validate data
      if (dataSource.validator && !dataSource.validator(data)) {
        errors.push('Data validation failed');
        return this.createErrorResult(dataSource, timestamp, errors);
      }

      // Transform data if transformer provided
      if (dataSource.transformer) {
        const transformStart = Date.now();
        data = dataSource.transformer(data);
        transformationApplied = true;
        
        this.recordMetric({
          dataSource: dataSource.id,
          timestamp,
          requestDuration: Date.now() - startTime,
          dataSize: JSON.stringify(data).length,
          recordsProcessed: Array.isArray(data) ? data.length : 1,
          errorsEncountered: 0,
          cacheHitRate: cacheHit ? 100 : 0,
          rateLimitRemaining: await this.getRateLimitRemaining(),
          transformationTime: Date.now() - transformStart,
          ragIngestionTime: 0
        });
      }

      // Calculate data metrics
      const dataString = JSON.stringify(data);
      dataSize = dataString.length;
      recordsIngested = Array.isArray(data) ? data.length : 1;

      // Integrate with RAG system
      if (this.config.ragIntegration.enabled) {
        const ragStart = Date.now();
        await this.integrateWithRAG(dataSource, data);
        ragIntegrated = true;
        
        // Update transformation time in metrics
        const lastMetric = this.metrics[this.metrics.length - 1];
        if (lastMetric) {
          lastMetric.ragIngestionTime = Date.now() - ragStart;
        }
      }

      // Persist to MongoDB if configured
      if (this.config.storage.persistToMongoDB) {
        await this.persistToMongoDB(dataSource, data);
      }

      // Update data source timestamps
      dataSource.lastUpdate = timestamp;
      const nextUpdate = new Date(Date.now() + dataSource.updateFrequency * 60 * 1000);
      dataSource.nextUpdate = nextUpdate.toISOString();

      // Emit success event
      this.eventBus.emit('esi:data:ingested', {
        dataSourceId: dataSource.id,
        recordsIngested,
        timestamp
      });

      console.log(`✅ Successfully processed ${dataSource.name}: ${recordsIngested} records, ${Math.round(dataSize / 1024)}KB`);

      return {
        dataSourceId: dataSource.id,
        success: true,
        timestamp,
        recordsIngested,
        dataSize,
        processingTime: Date.now() - startTime,
        errors,
        warnings,
        metadata: {
          endpoint: dataSource.endpoint,
          parameters: dataSource.parameters || {},
          rateLimitRemaining: await this.getRateLimitRemaining(),
          cacheHit,
          transformationApplied,
          ragIntegrated
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      
      console.error(`❌ Error processing ${dataSource.name}:`, errorMessage);
      
      // Emit error event
      this.eventBus.emit('esi:data:error', {
        dataSourceId: dataSource.id,
        error: errorMessage,
        timestamp
      });

      return this.createErrorResult(dataSource, timestamp, errors);
    }
  }

  private async fetchFromESI(dataSource: ESIDataSource): Promise<any> {
    const { endpoint, parameters = {} } = dataSource;
    
    // Build URL with parameters
    let url = `https://esi.evetech.net/latest${endpoint}`;
    const queryParams = new URLSearchParams();
    
    Object.entries(parameters).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Gryyk-47 EVE Corporation AI Assistant',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`ESI request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Record rate limit headers
    const remainingHeader = response.headers.get('x-esi-error-limit-remain');
    const resetHeader = response.headers.get('x-esi-error-limit-reset');
    
    if (remainingHeader) {
      console.log(`📊 ESI Rate Limit Remaining: ${remainingHeader}`);
    }

    return data;
  }

  private async checkCache(dataSource: ESIDataSource): Promise<any | null> {
    if (!this.config.storage.cacheEnabled) return null;

    const cacheKey = this.generateCacheKey(dataSource);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }

    return null;
  }

  private async cacheData(dataSource: ESIDataSource, data: any): Promise<void> {
    const cacheKey = this.generateCacheKey(dataSource);
    const expiresAt = Date.now() + (this.config.storage.cacheDuration * 60 * 1000);

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      expires: expiresAt
    });
  }

  private generateCacheKey(dataSource: ESIDataSource): string {
    const paramString = JSON.stringify(dataSource.parameters || {});
    return `${dataSource.id}-${dataSource.endpoint}-${paramString}`;
  }

  private async integrateWithRAG(dataSource: ESIDataSource, data: any): Promise<void> {
    // Convert data to RAG-ingestible format
    const documents = this.transformToRAGDocuments(dataSource, data);
    
    // Process in batches
    const batchSize = this.config.ragIntegration.batchSize;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      // Emit RAG ingestion event
      this.eventBus.emit('rag:ingest:batch', {
        dataSourceId: dataSource.id,
        documents: batch,
        batchIndex: Math.floor(i / batchSize),
        totalBatches: Math.ceil(documents.length / batchSize)
      });

      // Add delay between batches to prevent overwhelming the system
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, this.config.ragIntegration.processingDelay));
      }
    }
  }

  private transformToRAGDocuments(dataSource: ESIDataSource, data: any): Array<{ id: string; content: string; metadata: any }> {
    const documents: Array<{ id: string; content: string; metadata: any }> = [];
    const timestamp = new Date().toISOString();

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        documents.push({
          id: `${dataSource.id}-${index}-${Date.now()}`,
          content: this.formatContentForRAG(dataSource, item),
          metadata: {
            source: dataSource.name,
            type: dataSource.type,
            endpoint: dataSource.endpoint,
            timestamp,
            index,
            ...this.extractMetadata(item)
          }
        });
      });
    } else {
      documents.push({
        id: `${dataSource.id}-${Date.now()}`,
        content: this.formatContentForRAG(dataSource, data),
        metadata: {
          source: dataSource.name,
          type: dataSource.type,
          endpoint: dataSource.endpoint,
          timestamp,
          ...this.extractMetadata(data)
        }
      });
    }

    return documents;
  }

  private formatContentForRAG(dataSource: ESIDataSource, item: any): string {
    // Format data in a way that's useful for RAG retrieval
    switch (dataSource.type) {
      case 'market':
        return this.formatMarketData(item);
      case 'corporation':
        return this.formatCorporationData(item);
      case 'character':
        return this.formatCharacterData(item);
      case 'universe':
        return this.formatUniverseData(item);
      default:
        return JSON.stringify(item, null, 2);
    }
  }

  private formatMarketData(item: any): string {
    if (item.type_id && item.price) {
      return `Market data for type ${item.type_id}: Price ${item.price} ISK, Volume ${item.volume_remain || 0}, Location ${item.location_id || 'Unknown'}`;
    }
    return JSON.stringify(item);
  }

  private formatCorporationData(item: any): string {
    if (item.name) {
      return `Corporation: ${item.name}, Ticker: ${item.ticker || 'N/A'}, Members: ${item.member_count || 0}, CEO: ${item.ceo_id || 'Unknown'}`;
    }
    return JSON.stringify(item);
  }

  private formatCharacterData(item: any): string {
    if (item.name) {
      return `Character: ${item.name}, Corporation: ${item.corporation_id || 'Unknown'}, Security Status: ${item.security_status || 'Unknown'}`;
    }
    return JSON.stringify(item);
  }

  private formatUniverseData(item: any): string {
    if (item.name && item.system_id) {
      return `System: ${item.name}, Security: ${item.security_status || 'Unknown'}, Constellation: ${item.constellation_id || 'Unknown'}`;
    }
    return JSON.stringify(item);
  }

  private extractMetadata(item: any): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    // Extract common EVE Online identifiers
    if (item.type_id) metadata.typeId = item.type_id;
    if (item.location_id) metadata.locationId = item.location_id;
    if (item.system_id) metadata.systemId = item.system_id;
    if (item.region_id) metadata.regionId = item.region_id;
    if (item.corporation_id) metadata.corporationId = item.corporation_id;
    if (item.alliance_id) metadata.allianceId = item.alliance_id;
    if (item.character_id) metadata.characterId = item.character_id;

    return metadata;
  }

  private async persistToMongoDB(dataSource: ESIDataSource, data: any): Promise<void> {
    // Implementation would persist to MongoDB
    console.log(`💾 Persisting ${dataSource.id} data to MongoDB (${JSON.stringify(data).length} bytes)`);
  }

  private async checkRateLimit(): Promise<boolean> {
    // Simple rate limit check - in production, this would be more sophisticated
    const remaining = await this.getRateLimitRemaining();
    const threshold = 200 * (this.config.rateLimitBuffer / 100); // e.g., 80% of 200 = 160
    return remaining > threshold;
  }

  private async getRateLimitRemaining(): Promise<number> {
    // Mock implementation - in production, track actual ESI rate limits
    return 150 + Math.floor(Math.random() * 50);
  }

  private incrementErrorCount(dataSourceId: string): void {
    const current = this.errorCounts.get(dataSourceId) || 0;
    this.errorCounts.set(dataSourceId, current + 1);
  }

  private resetErrorCount(dataSourceId: string): void {
    this.errorCounts.set(dataSourceId, 0);
  }

  private recordMetric(metric: PipelineMetrics): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    if (this.config.monitoring.metricsEnabled) {
      this.eventBus.emit('esi:pipeline:metric', metric);
    }
  }

  private createErrorResult(dataSource: ESIDataSource, timestamp: string, errors: string[]): DataIngestionResult {
    return {
      dataSourceId: dataSource.id,
      success: false,
      timestamp,
      recordsIngested: 0,
      dataSize: 0,
      processingTime: 0,
      errors,
      warnings: [],
      metadata: {
        endpoint: dataSource.endpoint,
        parameters: dataSource.parameters || {},
        rateLimitRemaining: 0,
        cacheHit: false,
        transformationApplied: false,
        ragIntegrated: false
      }
    };
  }

  private startCacheCleanup(): void {
    // Clean up expired cache entries every 10 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.cache) {
        if (now > cached.expires) {
          this.cache.delete(key);
        }
      }
    }, 10 * 60 * 1000);
  }

  // Public API methods
  public getMetrics(): PipelineMetrics[] {
    return [...this.metrics];
  }

  public getMetricsSummary(): any {
    if (this.metrics.length === 0) return null;

    const totalRequests = this.metrics.length;
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.requestDuration, 0) / totalRequests;
    const totalDataSize = this.metrics.reduce((sum, m) => sum + m.dataSize, 0);
    const totalRecords = this.metrics.reduce((sum, m) => sum + m.recordsProcessed, 0);
    const avgCacheHitRate = this.metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / totalRequests;

    return {
      totalRequests,
      avgDuration: Math.round(avgDuration),
      totalDataSize,
      totalRecords,
      avgCacheHitRate: Math.round(avgCacheHitRate),
      timeRange: {
        start: this.metrics[0]?.timestamp,
        end: this.metrics[this.metrics.length - 1]?.timestamp
      }
    };
  }

  public getDataSourceStatus(): Array<{ id: string; name: string; status: string; lastUpdate?: string; nextUpdate?: string; errors: number }> {
    return this.config.dataSources.map(ds => ({
      id: ds.id,
      name: ds.name,
      status: ds.isEnabled ? 'active' : 'disabled',
      lastUpdate: ds.lastUpdate,
      nextUpdate: ds.nextUpdate,
      errors: this.errorCounts.get(ds.id) || 0
    }));
  }

  public enableDataSource(dataSourceId: string): boolean {
    const dataSource = this.config.dataSources.find(ds => ds.id === dataSourceId);
    if (dataSource && !dataSource.isEnabled) {
      dataSource.isEnabled = true;
      this.resetErrorCount(dataSourceId);
      
      if (this.isRunning) {
        this.scheduleDataSource(dataSource);
      }
      
      return true;
    }
    return false;
  }

  public disableDataSource(dataSourceId: string): boolean {
    const dataSource = this.config.dataSources.find(ds => ds.id === dataSourceId);
    if (dataSource && dataSource.isEnabled) {
      dataSource.isEnabled = false;
      
      // Clear scheduled job
      const timeout = this.scheduledJobs.get(dataSourceId);
      if (timeout) {
        clearTimeout(timeout);
        this.scheduledJobs.delete(dataSourceId);
      }
      
      return true;
    }
    return false;
  }

  public async triggerDataSource(dataSourceId: string): Promise<DataIngestionResult> {
    const dataSource = this.config.dataSources.find(ds => ds.id === dataSourceId);
    if (!dataSource) {
      throw new Error(`Data source ${dataSourceId} not found`);
    }

    return await this.processDataSource(dataSource);
  }
}