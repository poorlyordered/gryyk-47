export interface PerformanceMetric {
  timestamp: string;
  agentId: string;
  metricType: 'response_time' | 'success_rate' | 'error_rate' | 'throughput' | 'tool_usage' | 'rag_performance' | 'esi_performance';
  value: number;
  metadata?: Record<string, any>;
}

export interface AgentPerformanceSummary {
  agentId: string;
  name: string;
  specialization: string;
  timeRange: {
    start: string;
    end: string;
  };
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    successRate: number;
    errorRate: number;
    throughput: number; // requests per minute
  };
  toolPerformance: Array<{
    toolName: string;
    invocations: number;
    successRate: number;
    averageExecutionTime: number;
    errorRate: number;
  }>;
  ragPerformance: {
    queriesExecuted: number;
    averageQueryTime: number;
    cacheHitRate: number;
    relevanceScore: number;
  };
  esiPerformance: {
    callsExecuted: number;
    averageCallTime: number;
    cacheHitRate: number;
    rateLimitHits: number;
  };
  trends: {
    responseTimeTrend: 'improving' | 'degrading' | 'stable';
    successRateTrend: 'improving' | 'degrading' | 'stable';
    throughputTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface SystemPerformanceOverview {
  timeRange: {
    start: string;
    end: string;
  };
  overallMetrics: {
    totalRequests: number;
    totalAgents: number;
    averageResponseTime: number;
    systemThroughput: number;
    overallSuccessRate: number;
    overallErrorRate: number;
  };
  agentComparison: Array<{
    agentId: string;
    name: string;
    relativePerformance: number; // 0-100 score
    efficiency: number; // requests per second
    reliability: number; // success rate
  }>;
  bottlenecks: Array<{
    component: 'agent' | 'rag' | 'esi' | 'orchestrator';
    description: string;
    severity: 'low' | 'medium' | 'high';
    impact: string;
    recommendation: string;
  }>;
  recommendations: string[];
}

export interface ConsultationAnalytics {
  consultationId: string;
  timestamp: string;
  initiatingAgent: string;
  consultedAgents: string[];
  question: string;
  context: string;
  duration: number;
  participantMetrics: Array<{
    agentId: string;
    responseTime: number;
    confidenceLevel: number;
    toolsUsed: string[];
    ragQueriesMade: number;
    esiCallsMade: number;
  }>;
  qualityMetrics: {
    consensusLevel: number; // How much agents agreed
    responseRelevance: number;
    actionabilityScore: number;
    completeness: number;
  };
  outcome: {
    finalRecommendation: string;
    implementationComplexity: 'low' | 'medium' | 'high';
    confidenceScore: number;
    followUpRequired: boolean;
  };
}

export interface OptimizationSuggestion {
  id: string;
  category: 'performance' | 'reliability' | 'cost' | 'user_experience';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    expectedImprovement: string;
    affectedComponents: string[];
    implementationEffort: 'low' | 'medium' | 'high';
    estimatedTimeToImplement: string;
  };
  metrics: {
    baselineValue: number;
    targetValue: number;
    measurementMethod: string;
  };
  implementation: {
    steps: string[];
    prerequisites: string[];
    risks: string[];
    rollbackPlan: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsFilter {
  timeRange: {
    start: string;
    end: string;
  };
  agentIds?: string[];
  metricTypes?: string[];
  aggregation: 'hourly' | 'daily' | 'weekly' | 'monthly';
  includeComparisons?: boolean;
}

export interface TrendAnalysis {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  magnitude: number; // percentage change
  significance: 'low' | 'medium' | 'high';
  timeframe: string;
  confidence: number; // 0-100
  projectedValue?: number;
  factors: string[];
}

export interface PerformanceBenchmark {
  agentId: string;
  metricType: string;
  currentValue: number;
  benchmarkValue: number;
  industry_percentile: number;
  status: 'above_benchmark' | 'at_benchmark' | 'below_benchmark';
  gap: number;
  improvement_potential: string;
}