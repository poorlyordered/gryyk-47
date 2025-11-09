export interface AgentHealth {
  agentId: string;
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  lastSeen: string;
  responseTime: number;
  errorRate: number;
  successRate: number;
  memoryUsage: number;
  activeConnections: number;
  lastError?: string;
}

export interface AgentMetrics {
  agentId: string;
  timestamp: string;
  requestCount: number;
  averageResponseTime: number;
  errorCount: number;
  successCount: number;
  toolInvocations: Record<string, number>;
  ragQueries: number;
  esiCalls: number;
}

export interface AgentPerformance {
  agentId: string;
  name: string;
  specialization: string;
  metrics: {
    totalRequests: number;
    avgResponseTime: number;
    successRate: number;
    errorRate: number;
    uptime: number;
    lastActive: string;
  };
  toolUsage: Array<{
    toolName: string;
    invocations: number;
    avgExecutionTime: number;
    successRate: number;
  }>;
  ragMetrics: {
    queriesExecuted: number;
    knowledgeHits: number;
    avgQueryTime: number;
  };
  esiMetrics: {
    callsExecuted: number;
    cacheHitRate: number;
    avgCallTime: number;
  };
}

export interface SystemHealth {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  agents: AgentHealth[];
  orchestrator: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeConsultations: number;
    queueLength: number;
    avgConsultationTime: number;
  };
  ragSystem: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    indexSize: number;
    queryLatency: number;
    indexingActive: boolean;
  };
  esiIntegration: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    rateLimitRemaining: number;
    cacheHitRate: number;
    avgResponseTime: number;
  };
}

export interface HealthCheckConfig {
  interval: number; // ms
  timeout: number; // ms
  retryAttempts: number;
  thresholds: {
    responseTime: number; // ms
    errorRate: number; // percentage
    successRate: number; // percentage
    memoryUsage: number; // MB
  };
  alerting: {
    enabled: boolean;
    webhookUrl?: string;
    emailEnabled: boolean;
    slackEnabled: boolean;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  duration: number; // seconds
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  notifications: string[];
}

export interface AgentAlert {
  id: string;
  agentId: string;
  ruleId: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}