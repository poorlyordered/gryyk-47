import { 
  PerformanceMetric, 
  AgentPerformanceSummary, 
  SystemPerformanceOverview, 
  ConsultationAnalytics,
  OptimizationSuggestion,
  AnalyticsFilter,
  TrendAnalysis,
  PerformanceBenchmark
} from './types';
import { eventBus, type EventBus } from '../../core/event-bus';

export class AgentAnalyticsEngine {
  private metrics: PerformanceMetric[] = [];
  private consultations: ConsultationAnalytics[] = [];
  private eventBus: EventBus;
  private metricsBuffer: Map<string, PerformanceMetric[]> = new Map();
  private aggregationInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.eventBus = eventBus;
    this.setupEventListeners();
    this.startMetricsAggregation();
  }

  private setupEventListeners() {
    this.eventBus.on('agent:request:start', this.recordRequestStart.bind(this));
    this.eventBus.on('agent:request:complete', this.recordRequestComplete.bind(this));
    this.eventBus.on('agent:request:error', this.recordRequestError.bind(this));
    this.eventBus.on('agent:tool:invoked', this.recordToolUsage.bind(this));
    this.eventBus.on('rag:query:executed', this.recordRagPerformance.bind(this));
    this.eventBus.on('esi:call:executed', this.recordEsiPerformance.bind(this));
    this.eventBus.on('orchestrator:consultation:complete', this.recordConsultation.bind(this));
  }

  private startMetricsAggregation() {
    // Aggregate metrics every minute
    this.aggregationInterval = setInterval(() => {
      this.aggregateMetrics();
    }, 60000);
  }

  private aggregateMetrics() {
    const now = new Date().toISOString();
    
    // Process buffered metrics and calculate derived metrics
    this.metricsBuffer.forEach((agentMetrics, agentId) => {
      if (agentMetrics.length === 0) return;

      // Calculate aggregated metrics for this agent
      const responseTimes = agentMetrics
        .filter(m => m.metricType === 'response_time')
        .map(m => m.value);

      if (responseTimes.length > 0) {
        const avgResponseTime = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
        this.addMetric({
          timestamp: now,
          agentId,
          metricType: 'response_time',
          value: avgResponseTime,
          metadata: { aggregated: true, sampleSize: responseTimes.length }
        });
      }

      // Calculate throughput (requests per minute)
      const requestCount = agentMetrics.filter(m => 
        m.metricType === 'response_time' || 
        m.metricType === 'success_rate' || 
        m.metricType === 'error_rate'
      ).length;

      this.addMetric({
        timestamp: now,
        agentId,
        metricType: 'throughput',
        value: requestCount,
        metadata: { aggregated: true, timeWindow: '1minute' }
      });

      // Clear buffer for this agent
      this.metricsBuffer.set(agentId, []);
    });

    // Cleanup old metrics (keep last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    this.metrics = this.metrics.filter(m => m.timestamp > oneDayAgo);
  }

  private recordRequestStart(data: { agentId: string; requestId: string; timestamp: string }) {
    // Track request initiation - could be used for queue time analysis
  }

  private recordRequestComplete(data: { agentId: string; requestId: string; duration: number; timestamp: string }) {
    this.addMetricToBuffer({
      timestamp: data.timestamp,
      agentId: data.agentId,
      metricType: 'response_time',
      value: data.duration,
      metadata: { requestId: data.requestId }
    });

    this.addMetricToBuffer({
      timestamp: data.timestamp,
      agentId: data.agentId,
      metricType: 'success_rate',
      value: 1,
      metadata: { requestId: data.requestId }
    });
  }

  private recordRequestError(data: { agentId: string; requestId: string; error: string; timestamp: string }) {
    this.addMetricToBuffer({
      timestamp: data.timestamp,
      agentId: data.agentId,
      metricType: 'error_rate',
      value: 1,
      metadata: { requestId: data.requestId, error: data.error }
    });
  }

  private recordToolUsage(data: { agentId: string; toolName: string; duration: number; success: boolean; timestamp: string }) {
    this.addMetricToBuffer({
      timestamp: data.timestamp,
      agentId: data.agentId,
      metricType: 'tool_usage',
      value: data.duration,
      metadata: { 
        toolName: data.toolName, 
        success: data.success,
        execution_time: data.duration 
      }
    });
  }

  private recordRagPerformance(data: { agentId: string; query: string; duration: number; relevanceScore: number; cacheHit: boolean; timestamp: string }) {
    this.addMetricToBuffer({
      timestamp: data.timestamp,
      agentId: data.agentId,
      metricType: 'rag_performance',
      value: data.duration,
      metadata: { 
        query: data.query,
        relevanceScore: data.relevanceScore,
        cacheHit: data.cacheHit
      }
    });
  }

  private recordEsiPerformance(data: { agentId: string; endpoint: string; duration: number; cacheHit: boolean; rateLimited: boolean; timestamp: string }) {
    this.addMetricToBuffer({
      timestamp: data.timestamp,
      agentId: data.agentId,
      metricType: 'esi_performance',
      value: data.duration,
      metadata: { 
        endpoint: data.endpoint,
        cacheHit: data.cacheHit,
        rateLimited: data.rateLimited
      }
    });
  }

  private recordConsultation(consultation: ConsultationAnalytics) {
    this.consultations.push(consultation);
    
    // Keep only last 1000 consultations
    if (this.consultations.length > 1000) {
      this.consultations = this.consultations.slice(-1000);
    }
  }

  private addMetricToBuffer(metric: PerformanceMetric) {
    const agentMetrics = this.metricsBuffer.get(metric.agentId) || [];
    agentMetrics.push(metric);
    this.metricsBuffer.set(metric.agentId, agentMetrics);
  }

  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
  }

  // Public API methods
  public getAgentPerformanceSummary(agentId: string, timeRange: { start: string; end: string }): AgentPerformanceSummary {
    const agentMetrics = this.metrics.filter(m => 
      m.agentId === agentId && 
      m.timestamp >= timeRange.start && 
      m.timestamp <= timeRange.end
    );

    const responseTimes = agentMetrics
      .filter(m => m.metricType === 'response_time')
      .map(m => m.value)
      .sort((a, b) => a - b);

    const successfulRequests = agentMetrics.filter(m => 
      m.metricType === 'success_rate' && m.value === 1
    ).length;

    const failedRequests = agentMetrics.filter(m => 
      m.metricType === 'error_rate' && m.value === 1
    ).length;

    const totalRequests = successfulRequests + failedRequests;

    // Calculate percentiles
    const p95ResponseTime = responseTimes.length > 0 
      ? responseTimes[Math.floor(responseTimes.length * 0.95)] || 0
      : 0;
    const p99ResponseTime = responseTimes.length > 0 
      ? responseTimes[Math.floor(responseTimes.length * 0.99)] || 0
      : 0;

    // Tool performance analysis
    const toolMetrics = agentMetrics.filter(m => m.metricType === 'tool_usage');
    const toolPerformance = this.analyzeToolPerformance(toolMetrics);

    // RAG performance analysis
    const ragMetrics = agentMetrics.filter(m => m.metricType === 'rag_performance');
    const ragPerformance = this.analyzeRagPerformance(ragMetrics);

    // ESI performance analysis
    const esiMetrics = agentMetrics.filter(m => m.metricType === 'esi_performance');
    const esiPerformance = this.analyzeEsiPerformance(esiMetrics);

    // Trend analysis
    const trends = this.calculateTrends(agentId, timeRange);

    return {
      agentId,
      name: this.getAgentName(agentId),
      specialization: this.getAgentSpecialization(agentId),
      timeRange,
      metrics: {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime: responseTimes.length > 0 
          ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length 
          : 0,
        p95ResponseTime,
        p99ResponseTime,
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
        errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0,
        throughput: this.calculateThroughput(agentMetrics, timeRange)
      },
      toolPerformance,
      ragPerformance,
      esiPerformance,
      trends
    };
  }

  public getSystemPerformanceOverview(timeRange: { start: string; end: string }): SystemPerformanceOverview {
    const allMetrics = this.metrics.filter(m => 
      m.timestamp >= timeRange.start && 
      m.timestamp <= timeRange.end
    );

    const agentIds = [...new Set(allMetrics.map(m => m.agentId))];
    const agentSummaries = agentIds.map(id => this.getAgentPerformanceSummary(id, timeRange));

    // Calculate overall metrics
    const totalRequests = agentSummaries.reduce((sum, s) => sum + s.metrics.totalRequests, 0);
    const avgResponseTime = agentSummaries.length > 0
      ? agentSummaries.reduce((sum, s) => sum + s.metrics.averageResponseTime, 0) / agentSummaries.length
      : 0;

    const overallSuccessRate = agentSummaries.length > 0
      ? agentSummaries.reduce((sum, s) => sum + s.metrics.successRate, 0) / agentSummaries.length
      : 0;

    // Agent comparison
    const agentComparison = agentSummaries.map(summary => ({
      agentId: summary.agentId,
      name: summary.name,
      relativePerformance: this.calculateRelativePerformance(summary, agentSummaries),
      efficiency: summary.metrics.throughput,
      reliability: summary.metrics.successRate
    }));

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(agentSummaries);

    // Generate recommendations
    const recommendations = this.generateRecommendations(agentSummaries, bottlenecks);

    return {
      timeRange,
      overallMetrics: {
        totalRequests,
        totalAgents: agentIds.length,
        averageResponseTime: avgResponseTime,
        systemThroughput: this.calculateSystemThroughput(allMetrics, timeRange),
        overallSuccessRate,
        overallErrorRate: 100 - overallSuccessRate
      },
      agentComparison,
      bottlenecks,
      recommendations
    };
  }

  public getOptimizationSuggestions(agentId?: string): OptimizationSuggestion[] {
    const timeRange = {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
      end: new Date().toISOString()
    };

    const suggestions: OptimizationSuggestion[] = [];

    if (agentId) {
      const summary = this.getAgentPerformanceSummary(agentId, timeRange);
      suggestions.push(...this.generateAgentOptimizations(summary));
    } else {
      const systemOverview = this.getSystemPerformanceOverview(timeRange);
      suggestions.push(...this.generateSystemOptimizations(systemOverview));
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  public analyzeConsultationEffectiveness(timeRange: { start: string; end: string }): any {
    const consultationsInRange = this.consultations.filter(c => 
      c.timestamp >= timeRange.start && 
      c.timestamp <= timeRange.end
    );

    if (consultationsInRange.length === 0) {
      return {
        totalConsultations: 0,
        averageDuration: 0,
        averageParticipants: 0,
        consensusRate: 0,
        actionabilityScore: 0,
        trends: []
      };
    }

    const totalConsultations = consultationsInRange.length;
    const averageDuration = consultationsInRange.reduce((sum, c) => sum + c.duration, 0) / totalConsultations;
    const averageParticipants = consultationsInRange.reduce((sum, c) => sum + c.consultedAgents.length, 0) / totalConsultations;
    const consensusRate = consultationsInRange.reduce((sum, c) => sum + c.qualityMetrics.consensusLevel, 0) / totalConsultations;
    const actionabilityScore = consultationsInRange.reduce((sum, c) => sum + c.qualityMetrics.actionabilityScore, 0) / totalConsultations;

    return {
      totalConsultations,
      averageDuration,
      averageParticipants,
      consensusRate,
      actionabilityScore,
      qualityDistribution: this.analyzeConsultationQuality(consultationsInRange),
      participationAnalysis: this.analyzeAgentParticipation(consultationsInRange),
      trends: this.analyzeConsultationTrends(consultationsInRange)
    };
  }

  // Helper methods
  private analyzeToolPerformance(toolMetrics: PerformanceMetric[]): AgentPerformanceSummary['toolPerformance'] {
    const toolGroups = new Map<string, PerformanceMetric[]>();
    
    toolMetrics.forEach(metric => {
      const toolName = metric.metadata?.toolName || 'unknown';
      const tools = toolGroups.get(toolName) || [];
      tools.push(metric);
      toolGroups.set(toolName, tools);
    });

    return Array.from(toolGroups.entries()).map(([toolName, metrics]) => {
      const successfulInvocations = metrics.filter(m => m.metadata?.success === true).length;
      const totalInvocations = metrics.length;
      const executionTimes = metrics.map(m => m.value);
      const averageExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;

      return {
        toolName,
        invocations: totalInvocations,
        successRate: totalInvocations > 0 ? (successfulInvocations / totalInvocations) * 100 : 0,
        averageExecutionTime,
        errorRate: totalInvocations > 0 ? ((totalInvocations - successfulInvocations) / totalInvocations) * 100 : 0
      };
    });
  }

  private analyzeRagPerformance(ragMetrics: PerformanceMetric[]): AgentPerformanceSummary['ragPerformance'] {
    if (ragMetrics.length === 0) {
      return {
        queriesExecuted: 0,
        averageQueryTime: 0,
        cacheHitRate: 0,
        relevanceScore: 0
      };
    }

    const cacheHits = ragMetrics.filter(m => m.metadata?.cacheHit === true).length;
    const relevanceScores = ragMetrics
      .map(m => m.metadata?.relevanceScore || 0)
      .filter(score => score > 0);
    
    return {
      queriesExecuted: ragMetrics.length,
      averageQueryTime: ragMetrics.reduce((sum, m) => sum + m.value, 0) / ragMetrics.length,
      cacheHitRate: (cacheHits / ragMetrics.length) * 100,
      relevanceScore: relevanceScores.length > 0 
        ? relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length 
        : 0
    };
  }

  private analyzeEsiPerformance(esiMetrics: PerformanceMetric[]): AgentPerformanceSummary['esiPerformance'] {
    if (esiMetrics.length === 0) {
      return {
        callsExecuted: 0,
        averageCallTime: 0,
        cacheHitRate: 0,
        rateLimitHits: 0
      };
    }

    const cacheHits = esiMetrics.filter(m => m.metadata?.cacheHit === true).length;
    const rateLimitHits = esiMetrics.filter(m => m.metadata?.rateLimited === true).length;
    
    return {
      callsExecuted: esiMetrics.length,
      averageCallTime: esiMetrics.reduce((sum, m) => sum + m.value, 0) / esiMetrics.length,
      cacheHitRate: (cacheHits / esiMetrics.length) * 100,
      rateLimitHits
    };
  }

  private calculateTrends(agentId: string, timeRange: { start: string; end: string }): AgentPerformanceSummary['trends'] {
    // Simplified trend calculation - in production, this would use more sophisticated time series analysis
    return {
      responseTimeTrend: 'stable' as const,
      successRateTrend: 'stable' as const,
      throughputTrend: 'stable' as const
    };
  }

  private calculateThroughput(metrics: PerformanceMetric[], timeRange: { start: string; end: string }): number {
    const requestMetrics = metrics.filter(m => 
      m.metricType === 'response_time' || 
      m.metricType === 'success_rate' || 
      m.metricType === 'error_rate'
    );

    const durationMs = new Date(timeRange.end).getTime() - new Date(timeRange.start).getTime();
    const durationMinutes = durationMs / (1000 * 60);
    
    return durationMinutes > 0 ? requestMetrics.length / durationMinutes : 0;
  }

  private calculateSystemThroughput(metrics: PerformanceMetric[], timeRange: { start: string; end: string }): number {
    const durationMs = new Date(timeRange.end).getTime() - new Date(timeRange.start).getTime();
    const durationMinutes = durationMs / (1000 * 60);
    
    const requestMetrics = metrics.filter(m => 
      m.metricType === 'response_time' || 
      m.metricType === 'success_rate' || 
      m.metricType === 'error_rate'
    );

    return durationMinutes > 0 ? requestMetrics.length / durationMinutes : 0;
  }

  private calculateRelativePerformance(agentSummary: AgentPerformanceSummary, allSummaries: AgentPerformanceSummary[]): number {
    // Calculate a composite performance score relative to other agents
    const avgResponseTime = allSummaries.reduce((sum, s) => sum + s.metrics.averageResponseTime, 0) / allSummaries.length;
    const avgSuccessRate = allSummaries.reduce((sum, s) => sum + s.metrics.successRate, 0) / allSummaries.length;
    const avgThroughput = allSummaries.reduce((sum, s) => sum + s.metrics.throughput, 0) / allSummaries.length;

    // Normalize scores (lower response time is better, higher success rate and throughput are better)
    const responseTimeScore = avgResponseTime > 0 ? Math.max(0, 100 - (agentSummary.metrics.averageResponseTime / avgResponseTime) * 50) : 50;
    const successRateScore = avgSuccessRate > 0 ? (agentSummary.metrics.successRate / avgSuccessRate) * 50 : 50;
    const throughputScore = avgThroughput > 0 ? (agentSummary.metrics.throughput / avgThroughput) * 50 : 50;

    return Math.min(100, Math.max(0, (responseTimeScore + successRateScore + throughputScore) / 3));
  }

  private identifyBottlenecks(agentSummaries: AgentPerformanceSummary[]): SystemPerformanceOverview['bottlenecks'] {
    const bottlenecks: SystemPerformanceOverview['bottlenecks'] = [];

    // Check for slow agents
    const avgResponseTime = agentSummaries.reduce((sum, s) => sum + s.metrics.averageResponseTime, 0) / agentSummaries.length;
    const slowAgents = agentSummaries.filter(s => s.metrics.averageResponseTime > avgResponseTime * 1.5);

    slowAgents.forEach(agent => {
      bottlenecks.push({
        component: 'agent',
        description: `${agent.name} has significantly higher response times than average`,
        severity: agent.metrics.averageResponseTime > avgResponseTime * 2 ? 'high' : 'medium',
        impact: 'Increased consultation times and reduced user experience',
        recommendation: 'Review agent configuration, optimize tool usage, or consider scaling'
      });
    });

    // Check for agents with high error rates
    const highErrorAgents = agentSummaries.filter(s => s.metrics.errorRate > 10);
    highErrorAgents.forEach(agent => {
      bottlenecks.push({
        component: 'agent',
        description: `${agent.name} has high error rate (${agent.metrics.errorRate.toFixed(1)}%)`,
        severity: agent.metrics.errorRate > 25 ? 'high' : 'medium',
        impact: 'Reduced reliability and potential consultation failures',
        recommendation: 'Investigate error causes, improve error handling, or review agent logic'
      });
    });

    return bottlenecks;
  }

  private generateRecommendations(agentSummaries: AgentPerformanceSummary[], bottlenecks: SystemPerformanceOverview['bottlenecks']): string[] {
    const recommendations: string[] = [];

    if (bottlenecks.length > 0) {
      recommendations.push('Address identified performance bottlenecks to improve system reliability');
    }

    const avgThroughput = agentSummaries.reduce((sum, s) => sum + s.metrics.throughput, 0) / agentSummaries.length;
    if (avgThroughput < 1) {
      recommendations.push('Consider optimizing agent response times to increase system throughput');
    }

    const lowPerformingAgents = agentSummaries.filter(s => s.metrics.successRate < 90);
    if (lowPerformingAgents.length > 0) {
      recommendations.push('Review configuration and error handling for agents with low success rates');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performance appears healthy - continue monitoring for trends');
    }

    return recommendations;
  }

  private generateAgentOptimizations(summary: AgentPerformanceSummary): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Response time optimization
    if (summary.metrics.averageResponseTime > 2000) {
      suggestions.push({
        id: `resp-time-${summary.agentId}-${Date.now()}`,
        category: 'performance',
        priority: summary.metrics.averageResponseTime > 5000 ? 'high' : 'medium',
        title: 'Optimize Agent Response Time',
        description: `${summary.name} has high average response time of ${Math.round(summary.metrics.averageResponseTime)}ms`,
        impact: {
          expectedImprovement: '30-50% reduction in response time',
          affectedComponents: [summary.name],
          implementationEffort: 'medium',
          estimatedTimeToImplement: '1-2 weeks'
        },
        metrics: {
          baselineValue: summary.metrics.averageResponseTime,
          targetValue: Math.max(1000, summary.metrics.averageResponseTime * 0.6),
          measurementMethod: 'Average response time over 24 hour period'
        },
        implementation: {
          steps: [
            'Analyze tool execution times and optimize slow tools',
            'Review RAG query patterns and implement caching',
            'Optimize agent prompt and reasoning chains',
            'Consider parallel tool execution where applicable'
          ],
          prerequisites: ['Performance monitoring in place', 'Access to agent logs'],
          risks: ['Potential reduction in response quality', 'Increased system complexity'],
          rollbackPlan: 'Revert to previous agent configuration'
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return suggestions;
  }

  private generateSystemOptimizations(overview: SystemPerformanceOverview): OptimizationSuggestion[] {
    // Implementation would generate system-wide optimization suggestions
    return [];
  }

  private analyzeConsultationQuality(consultations: ConsultationAnalytics[]): any {
    // Implementation for consultation quality analysis
    return {};
  }

  private analyzeAgentParticipation(consultations: ConsultationAnalytics[]): any {
    // Implementation for agent participation analysis
    return {};
  }

  private analyzeConsultationTrends(consultations: ConsultationAnalytics[]): TrendAnalysis[] {
    // Implementation for consultation trend analysis
    return [];
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

  private getAgentSpecialization(agentId: string): string {
    const specializations: Record<string, string> = {
      'economic-specialist': 'Economic Analysis & ISK Generation',
      'recruiting-specialist': 'Member Recruitment & Retention',
      'market-specialist': 'Market Analysis & Trading',
      'mining-specialist': 'Mining Operations & Optimization',
      'mission-specialist': 'Mission Running & PvE Strategy'
    };
    return specializations[agentId] || 'General Purpose';
  }

  // Cleanup method
  public destroy() {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    
    // Remove event listeners
    this.eventBus.off('agent:request:start', this.recordRequestStart);
    this.eventBus.off('agent:request:complete', this.recordRequestComplete);
    this.eventBus.off('agent:request:error', this.recordRequestError);
    this.eventBus.off('agent:tool:invoked', this.recordToolUsage);
    this.eventBus.off('rag:query:executed', this.recordRagPerformance);
    this.eventBus.off('esi:call:executed', this.recordEsiPerformance);
    this.eventBus.off('orchestrator:consultation:complete', this.recordConsultation);
  }
}