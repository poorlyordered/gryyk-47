// Agent configuration types
export interface AgentConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  tools: AgentToolConfig[];
  lastUpdated: string;
  status: 'active' | 'inactive' | 'error' | 'configuring';
}

export interface AgentToolConfig {
  toolId: string;
  toolName: string;
  description: string;
  enabled: boolean;
  parameters?: Record<string, any>;
}

export interface AgentStatus {
  agentId: string;
  status: 'online' | 'offline' | 'error' | 'busy';
  lastActivity: string;
  responseTime: number;
  successRate: number;
  totalQueries: number;
  errorCount: number;
}

export interface OrchestrationStats {
  totalQueries: number;
  averageResponseTime: number;
  agentUtilization: Record<string, number>;
  memoryUsage: {
    totalExperiences: number;
    totalDecisions: number;
    totalPatterns: number;
  };
  recentActivity: {
    timestamp: string;
    query: string;
    agentsConsulted: string[];
    success: boolean;
  }[];
}

// Available models for agent configuration
export const AVAILABLE_MODELS = [
  { id: 'x-ai/grok-4-fast', name: 'Grok 4 Fast', description: 'High speed, high quality (default)' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Advanced reasoning' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Versatile performance' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', description: 'Open source large model' }
] as const;

// Default agent configurations
export const DEFAULT_AGENT_CONFIGS: Record<string, Omit<AgentConfig, 'id'>> = {
  recruiting: {
    name: 'recruiting',
    displayName: 'Recruiting Specialist',
    description: 'Member acquisition, retention, and onboarding strategies',
    model: 'x-ai/grok-4-fast',
    temperature: 0.5,
    maxTokens: 2000,
    enabled: true,
    tools: [
      {
        toolId: 'developRecruitmentStrategy',
        toolName: 'Develop Recruitment Strategy',
        description: 'Create comprehensive recruitment plans',
        enabled: true
      },
      {
        toolId: 'evaluateApplication',
        toolName: 'Evaluate Application',
        description: 'Screen and assess recruitment applications',
        enabled: true
      },
      {
        toolId: 'analyzeRetention',
        toolName: 'Analyze Retention',
        description: 'Analyze member retention and suggest improvements',
        enabled: true
      }
    ],
    lastUpdated: new Date().toISOString(),
    status: 'active'
  },
  economic: {
    name: 'economic',
    displayName: 'Economic Specialist',
    description: 'Income optimization, investment analysis, financial planning',
    model: 'x-ai/grok-4-fast',
    temperature: 0.3,
    maxTokens: 2000,
    enabled: true,
    tools: [
      {
        toolId: 'analyzeIncomeStreams',
        toolName: 'Analyze Income Streams',
        description: 'Evaluate and optimize corporation income sources',
        enabled: true
      },
      {
        toolId: 'evaluateInvestment',
        toolName: 'Evaluate Investment',
        description: 'Assess investment opportunities and ROI',
        enabled: true
      },
      {
        toolId: 'optimizeTaxation',
        toolName: 'Optimize Taxation',
        description: 'Analyze and optimize corporation tax strategy',
        enabled: true
      }
    ],
    lastUpdated: new Date().toISOString(),
    status: 'active'
  },
  market: {
    name: 'market',
    displayName: 'Market Specialist',
    description: 'Trading opportunities, market analysis, price forecasting',
    model: 'x-ai/grok-4-fast',
    temperature: 0.2,
    maxTokens: 2000,
    enabled: true,
    tools: [
      {
        toolId: 'analyzeMarketTrends',
        toolName: 'Analyze Market Trends',
        description: 'Analyze market trends and price movements',
        enabled: true
      },
      {
        toolId: 'identifyTradingOpportunities',
        toolName: 'Identify Trading Opportunities',
        description: 'Find profitable trading opportunities',
        enabled: true
      },
      {
        toolId: 'analyzeProfitability',
        toolName: 'Analyze Profitability',
        description: 'Analyze manufacturing and production profitability',
        enabled: true
      }
    ],
    lastUpdated: new Date().toISOString(),
    status: 'active'
  },
  mining: {
    name: 'mining',
    displayName: 'Mining Specialist',
    description: 'Fleet operations, yield optimization, ore analysis',
    model: 'x-ai/grok-4-fast',
    temperature: 0.4,
    maxTokens: 2000,
    enabled: true,
    tools: [
      {
        toolId: 'planMiningOperation',
        toolName: 'Plan Mining Operation',
        description: 'Plan comprehensive mining operations',
        enabled: true
      },
      {
        toolId: 'optimizeYield',
        toolName: 'Optimize Yield',
        description: 'Optimize mining fleet yield and efficiency',
        enabled: true
      },
      {
        toolId: 'analyzeOrePrices',
        toolName: 'Analyze Ore Prices',
        description: 'Analyze ore market prices and recommend targets',
        enabled: true
      }
    ],
    lastUpdated: new Date().toISOString(),
    status: 'active'
  },
  mission: {
    name: 'mission',
    displayName: 'Mission Specialist',
    description: 'PvE optimization, fitting recommendations, loyalty point analysis',
    model: 'x-ai/grok-4-fast',
    temperature: 0.3,
    maxTokens: 2000,
    enabled: true,
    tools: [
      {
        toolId: 'planMissionRunning',
        toolName: 'Plan Mission Running',
        description: 'Plan efficient mission running strategies',
        enabled: true
      },
      {
        toolId: 'optimizeFitting',
        toolName: 'Optimize Fitting',
        description: 'Recommend optimal ship fittings for missions',
        enabled: true
      },
      {
        toolId: 'analyzeLoyaltyPoints',
        toolName: 'Analyze Loyalty Points',
        description: 'Analyze LP store and recommend purchases',
        enabled: true
      }
    ],
    lastUpdated: new Date().toISOString(),
    status: 'active'
  }
};

export type AgentType = keyof typeof DEFAULT_AGENT_CONFIGS;