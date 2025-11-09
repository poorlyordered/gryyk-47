import { AgentHealth, AgentMetrics, SystemHealth, HealthCheckConfig, AgentAlert } from './types';
import { eventBus, type EventBus } from '../../core/event-bus';

export class AgentHealthChecker {
  private config: HealthCheckConfig;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private metrics: Map<string, AgentMetrics[]> = new Map();
  private alerts: AgentAlert[] = [];
  private eventBus: EventBus;

  constructor(config: HealthCheckConfig) {
    this.config = config;
    this.eventBus = eventBus;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.eventBus.on('agent:request:start', this.recordRequestStart.bind(this));
    this.eventBus.on('agent:request:complete', this.recordRequestComplete.bind(this));
    this.eventBus.on('agent:request:error', this.recordRequestError.bind(this));
    this.eventBus.on('agent:tool:invoked', this.recordToolInvocation.bind(this));
    this.eventBus.on('rag:query:executed', this.recordRagQuery.bind(this));
    this.eventBus.on('esi:call:executed', this.recordEsiCall.bind(this));
  }

  startMonitoring(agentIds: string[]) {
    agentIds.forEach(agentId => {
      if (!this.intervals.has(agentId)) {
        const interval = setInterval(() => {
          this.performHealthCheck(agentId);
        }, this.config.interval);
        
        this.intervals.set(agentId, interval);
        this.metrics.set(agentId, []);
      }
    });

    console.log(`Started health monitoring for ${agentIds.length} agents`);
  }

  stopMonitoring(agentId?: string) {
    if (agentId) {
      const interval = this.intervals.get(agentId);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(agentId);
      }
    } else {
      // Stop all monitoring
      this.intervals.forEach(interval => clearInterval(interval));
      this.intervals.clear();
    }
  }

  private async performHealthCheck(agentId: string): Promise<AgentHealth> {
    const startTime = Date.now();
    const agentMetrics = this.getRecentMetrics(agentId, 300000); // Last 5 minutes
    
    try {
      // Simulate agent health check - in real implementation, this would ping the agent
      const responseTime = Date.now() - startTime;
      const errorRate = this.calculateErrorRate(agentMetrics);
      const successRate = this.calculateSuccessRate(agentMetrics);
      
      const health: AgentHealth = {
        agentId,
        name: this.getAgentName(agentId),
        status: this.determineHealthStatus(responseTime, errorRate, successRate),
        lastSeen: new Date().toISOString(),
        responseTime,
        errorRate,
        successRate,
        memoryUsage: Math.random() * 100, // Mock memory usage
        activeConnections: Math.floor(Math.random() * 10),
        lastError: errorRate > 0 ? 'Mock error for demonstration' : undefined
      };

      this.eventBus.emit('agent:health:updated', { agentId, health });
      this.checkAlertConditions(health);
      
      return health;
    } catch (error) {
      const health: AgentHealth = {
        agentId,
        name: this.getAgentName(agentId),
        status: 'offline',
        lastSeen: new Date().toISOString(),
        responseTime: this.config.timeout,
        errorRate: 100,
        successRate: 0,
        memoryUsage: 0,
        activeConnections: 0,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };

      this.eventBus.emit('agent:health:critical', { agentId, health, error });
      return health;
    }
  }

  private determineHealthStatus(responseTime: number, errorRate: number, _successRate: number): AgentHealth['status'] {
    if (responseTime > this.config.thresholds.responseTime * 2 || errorRate > 50) {
      return 'unhealthy';
    }
    if (responseTime > this.config.thresholds.responseTime || errorRate > this.config.thresholds.errorRate) {
      return 'degraded';
    }
    return 'healthy';
  }

  private checkAlertConditions(health: AgentHealth) {
    // Response time alert
    if (health.responseTime > this.config.thresholds.responseTime) {
      this.createAlert({
        agentId: health.agentId,
        ruleId: 'high-response-time',
        severity: health.responseTime > this.config.thresholds.responseTime * 2 ? 'critical' : 'warning',
        message: `High response time: ${health.responseTime}ms (threshold: ${this.config.thresholds.responseTime}ms)`,
        metadata: { responseTime: health.responseTime, threshold: this.config.thresholds.responseTime }
      });
    }

    // Error rate alert
    if (health.errorRate > this.config.thresholds.errorRate) {
      this.createAlert({
        agentId: health.agentId,
        ruleId: 'high-error-rate',
        severity: health.errorRate > 50 ? 'critical' : 'warning',
        message: `High error rate: ${health.errorRate.toFixed(1)}% (threshold: ${this.config.thresholds.errorRate}%)`,
        metadata: { errorRate: health.errorRate, threshold: this.config.thresholds.errorRate }
      });
    }

    // Memory usage alert
    if (health.memoryUsage > this.config.thresholds.memoryUsage) {
      this.createAlert({
        agentId: health.agentId,
        ruleId: 'high-memory-usage',
        severity: health.memoryUsage > this.config.thresholds.memoryUsage * 1.5 ? 'critical' : 'warning',
        message: `High memory usage: ${health.memoryUsage.toFixed(1)}MB (threshold: ${this.config.thresholds.memoryUsage}MB)`,
        metadata: { memoryUsage: health.memoryUsage, threshold: this.config.thresholds.memoryUsage }
      });
    }
  }

  private createAlert(alertData: Omit<AgentAlert, 'id' | 'timestamp' | 'acknowledged'>) {
    const alert: AgentAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      ...alertData
    };

    this.alerts.push(alert);
    this.eventBus.emit('agent:alert:created', alert);

    if (this.config.alerting.enabled) {
      this.sendNotification(alert);
    }
  }

  private async sendNotification(alert: AgentAlert) {
    // Mock notification sending
    console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
    
    if (this.config.alerting.webhookUrl) {
      try {
        await fetch(this.config.alerting.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
      } catch (error) {
        console.error('Failed to send webhook notification:', error);
      }
    }
  }

  // Event recording methods
  private recordRequestStart(_data: { agentId: string; requestId: string; timestamp: string }) {
    // Implementation for tracking request starts
  }

  private recordRequestComplete(data: { agentId: string; requestId: string; duration: number; timestamp: string }) {
    this.updateMetrics(data.agentId, {
      successCount: 1,
      requestCount: 1,
      averageResponseTime: data.duration
    });
  }

  private recordRequestError(data: { agentId: string; requestId: string; error: string; timestamp: string }) {
    this.updateMetrics(data.agentId, {
      errorCount: 1,
      requestCount: 1
    });
  }

  private recordToolInvocation(data: { agentId: string; toolName: string; duration: number; timestamp: string }) {
    this.updateMetrics(data.agentId, {
      toolInvocations: { [data.toolName]: 1 }
    });
  }

  private recordRagQuery(data: { agentId: string; query: string; duration: number; timestamp: string }) {
    this.updateMetrics(data.agentId, {
      ragQueries: 1
    });
  }

  private recordEsiCall(data: { agentId: string; endpoint: string; duration: number; timestamp: string }) {
    this.updateMetrics(data.agentId, {
      esiCalls: 1
    });
  }

  private updateMetrics(agentId: string, partial: Partial<AgentMetrics>) {
    const agentMetrics = this.metrics.get(agentId) || [];
    const currentMetric = agentMetrics[agentMetrics.length - 1];
    
    if (!currentMetric || this.isNewTimeWindow(currentMetric.timestamp)) {
      const newMetric: AgentMetrics = {
        agentId,
        timestamp: new Date().toISOString(),
        requestCount: 0,
        averageResponseTime: 0,
        errorCount: 0,
        successCount: 0,
        toolInvocations: {},
        ragQueries: 0,
        esiCalls: 0,
        ...partial
      };
      agentMetrics.push(newMetric);
    } else {
      // Update existing metric
      Object.assign(currentMetric, {
        ...currentMetric,
        ...partial,
        toolInvocations: {
          ...currentMetric.toolInvocations,
          ...(partial.toolInvocations || {})
        }
      });
    }

    // Keep only recent metrics (last hour)
    const oneHourAgo = Date.now() - 3600000;
    this.metrics.set(agentId, agentMetrics.filter(m => 
      new Date(m.timestamp).getTime() > oneHourAgo
    ));
  }

  private isNewTimeWindow(timestamp: string): boolean {
    const now = new Date();
    const metricTime = new Date(timestamp);
    return now.getTime() - metricTime.getTime() > 60000; // 1 minute window
  }

  private getRecentMetrics(agentId: string, windowMs: number): AgentMetrics[] {
    const agentMetrics = this.metrics.get(agentId) || [];
    const cutoff = Date.now() - windowMs;
    return agentMetrics.filter(m => new Date(m.timestamp).getTime() > cutoff);
  }

  private calculateErrorRate(metrics: AgentMetrics[]): number {
    const totalErrors = metrics.reduce((sum, m) => sum + m.errorCount, 0);
    const totalRequests = metrics.reduce((sum, m) => sum + m.requestCount, 0);
    return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  }

  private calculateSuccessRate(metrics: AgentMetrics[]): number {
    const totalSuccess = metrics.reduce((sum, m) => sum + m.successCount, 0);
    const totalRequests = metrics.reduce((sum, m) => sum + m.requestCount, 0);
    return totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 100;
  }

  private getAgentName(agentId: string): string {
    const agentNames: Record<string, string> = {
      'economic-specialist': 'Economic Specialist',
      'recruiting-specialist': 'Recruiting Specialist',
      'market-specialist': 'Market Specialist',
      'mining-specialist': 'Mining Specialist',
      'mission-specialist': 'Mission Specialist'
    };
    return agentNames[agentId] || agentId;
  }

  // Public API methods
  getAgentHealth(agentId: string): Promise<AgentHealth> {
    return this.performHealthCheck(agentId);
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const agentIds = Array.from(this.intervals.keys());
    const agentHealthChecks = await Promise.all(
      agentIds.map(id => this.performHealthCheck(id))
    );

    const overallStatus = this.determineOverallStatus(agentHealthChecks);

    return {
      timestamp: new Date().toISOString(),
      overallStatus,
      agents: agentHealthChecks,
      orchestrator: {
        status: 'healthy',
        activeConsultations: Math.floor(Math.random() * 5),
        queueLength: Math.floor(Math.random() * 3),
        avgConsultationTime: 2000 + Math.random() * 3000
      },
      ragSystem: {
        status: 'healthy',
        indexSize: 1250000,
        queryLatency: 150 + Math.random() * 100,
        indexingActive: Math.random() > 0.8
      },
      esiIntegration: {
        status: 'healthy',
        rateLimitRemaining: 150 + Math.floor(Math.random() * 50),
        cacheHitRate: 85 + Math.random() * 10,
        avgResponseTime: 200 + Math.random() * 300
      }
    };
  }

  private determineOverallStatus(agentHealths: AgentHealth[]): SystemHealth['overallStatus'] {
    const unhealthyCount = agentHealths.filter(h => h.status === 'unhealthy' || h.status === 'offline').length;
    const degradedCount = agentHealths.filter(h => h.status === 'degraded').length;

    if (unhealthyCount > 0) return 'critical';
    if (degradedCount > agentHealths.length * 0.3) return 'degraded';
    return 'healthy';
  }

  getAlerts(agentId?: string, severity?: string): AgentAlert[] {
    let filtered = this.alerts;
    
    if (agentId) {
      filtered = filtered.filter(alert => alert.agentId === agentId);
    }
    
    if (severity) {
      filtered = filtered.filter(alert => alert.severity === severity);
    }
    
    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.eventBus.emit('agent:alert:acknowledged', alert);
      return true;
    }
    return false;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolvedAt = new Date().toISOString();
      this.eventBus.emit('agent:alert:resolved', alert);
      return true;
    }
    return false;
  }
}