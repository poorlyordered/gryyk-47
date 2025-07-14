import { useState, useEffect, useCallback } from 'react';
import { AgentHealth, SystemHealth, AgentAlert, HealthCheckConfig } from '../types';
import { AgentHealthChecker } from '../healthChecker';
import { EventBus } from '../../../core/event-bus';

const defaultConfig: HealthCheckConfig = {
  interval: 30000, // 30 seconds
  timeout: 5000,   // 5 seconds
  retryAttempts: 3,
  thresholds: {
    responseTime: 1000,  // 1 second
    errorRate: 10,       // 10%
    successRate: 90,     // 90%
    memoryUsage: 500     // 500MB
  },
  alerting: {
    enabled: true,
    emailEnabled: false,
    slackEnabled: false
  }
};

export const useAgentMonitoring = (config: HealthCheckConfig = defaultConfig) => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [agentHealths, setAgentHealths] = useState<AgentHealth[]>([]);
  const [alerts, setAlerts] = useState<AgentAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthChecker] = useState(() => new AgentHealthChecker(config));

  // Define agent IDs to monitor
  const agentIds = [
    'economic-specialist',
    'recruiting-specialist', 
    'market-specialist',
    'mining-specialist',
    'mission-specialist'
  ];

  const refreshHealth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get system health
      const systemHealthData = await healthChecker.getSystemHealth();
      setSystemHealth(systemHealthData);
      setAgentHealths(systemHealthData.agents);
      
      // Get alerts
      const alertsData = healthChecker.getAlerts();
      setAlerts(alertsData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setIsLoading(false);
    }
  }, [healthChecker]);

  const acknowledgeAlert = useCallback(async (alertId: string): Promise<boolean> => {
    const success = healthChecker.acknowledgeAlert(alertId);
    if (success) {
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    }
    return success;
  }, [healthChecker]);

  const resolveAlert = useCallback(async (alertId: string): Promise<boolean> => {
    const success = healthChecker.resolveAlert(alertId);
    if (success) {
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, resolvedAt: new Date().toISOString() } : alert
      ));
    }
    return success;
  }, [healthChecker]);

  const getAgentHealth = useCallback(async (agentId: string): Promise<AgentHealth> => {
    return healthChecker.getAgentHealth(agentId);
  }, [healthChecker]);

  const getAgentAlerts = useCallback((agentId: string, severity?: string): AgentAlert[] => {
    return healthChecker.getAlerts(agentId, severity);
  }, [healthChecker]);

  // Setup event listeners
  useEffect(() => {
    const eventBus = EventBus.getInstance();

    const handleHealthUpdate = (data: { agentId: string; health: AgentHealth }) => {
      setAgentHealths(prev => prev.map(agent => 
        agent.agentId === data.agentId ? data.health : agent
      ));
    };

    const handleNewAlert = (alert: AgentAlert) => {
      setAlerts(prev => [alert, ...prev]);
    };

    const handleAlertAcknowledged = (alert: AgentAlert) => {
      setAlerts(prev => prev.map(a => 
        a.id === alert.id ? alert : a
      ));
    };

    const handleAlertResolved = (alert: AgentAlert) => {
      setAlerts(prev => prev.map(a => 
        a.id === alert.id ? alert : a
      ));
    };

    // Subscribe to events
    eventBus.on('agent:health:updated', handleHealthUpdate);
    eventBus.on('agent:alert:created', handleNewAlert);
    eventBus.on('agent:alert:acknowledged', handleAlertAcknowledged);
    eventBus.on('agent:alert:resolved', handleAlertResolved);

    return () => {
      // Cleanup event listeners
      eventBus.off('agent:health:updated', handleHealthUpdate);
      eventBus.off('agent:alert:created', handleNewAlert);
      eventBus.off('agent:alert:acknowledged', handleAlertAcknowledged);
      eventBus.off('agent:alert:resolved', handleAlertResolved);
    };
  }, []);

  // Start monitoring when hook is used
  useEffect(() => {
    healthChecker.startMonitoring(agentIds);
    refreshHealth();

    // Set up periodic refresh
    const refreshInterval = setInterval(refreshHealth, config.interval);

    return () => {
      clearInterval(refreshInterval);
      healthChecker.stopMonitoring();
    };
  }, [healthChecker, refreshHealth, config.interval]);

  // Derived state
  const activeAlerts = alerts.filter(alert => !alert.acknowledged && !alert.resolvedAt);
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
  const healthyAgentCount = agentHealths.filter(agent => agent.status === 'healthy').length;
  const totalAgentCount = agentHealths.length;

  const statistics = {
    overallHealth: systemHealth?.overallStatus || 'unknown',
    healthyAgents: healthyAgentCount,
    totalAgents: totalAgentCount,
    activeAlerts: activeAlerts.length,
    criticalAlerts: criticalAlerts.length,
    avgResponseTime: agentHealths.length > 0 
      ? Math.round(agentHealths.reduce((sum, agent) => sum + agent.responseTime, 0) / agentHealths.length)
      : 0,
    avgSuccessRate: agentHealths.length > 0
      ? Math.round(agentHealths.reduce((sum, agent) => sum + agent.successRate, 0) / agentHealths.length * 10) / 10
      : 0
  };

  return {
    // State
    systemHealth,
    agentHealths,
    alerts,
    activeAlerts,
    criticalAlerts,
    isLoading,
    error,
    statistics,
    
    // Actions
    refreshHealth,
    acknowledgeAlert,
    resolveAlert,
    getAgentHealth,
    getAgentAlerts,
    
    // Health checker instance for advanced usage
    healthChecker
  };
};