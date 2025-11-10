/**
 * Agent type definitions and metadata
 */

export interface AgentMetadata {
  name: string;
  description: string;
  defaultTools: string[];
  specialization: string;
}

export type AgentId =
  | 'economic-specialist'
  | 'recruiting-specialist'
  | 'market-specialist'
  | 'mining-specialist'
  | 'mission-specialist';

export const AGENT_INFO: Record<AgentId, AgentMetadata> = {
  'economic-specialist': {
    name: 'Economic Specialist',
    description: 'Focuses on ISK generation, investment opportunities, and financial optimization',
    defaultTools: ['getCorporationAnalysis', 'getMarketData', 'getCorporationWealth'],
    specialization: 'Financial analysis, market trends, profitability optimization'
  },
  'recruiting-specialist': {
    name: 'Recruiting Specialist',
    description: 'Handles member recruitment, retention strategies, and onboarding processes',
    defaultTools: ['getCorporationAnalysis', 'getCorporationMembers'],
    specialization: 'Member management, recruitment strategies, retention analytics'
  },
  'market-specialist': {
    name: 'Market Specialist',
    description: 'Provides market intelligence, trading opportunities, and price analysis',
    defaultTools: ['getMarketData', 'getSystemInfo'],
    specialization: 'Market analysis, trading strategies, price forecasting'
  },
  'mining-specialist': {
    name: 'Mining Specialist',
    description: 'Optimizes mining operations, fleet compositions, and ore selection',
    defaultTools: ['getMarketData', 'getSystemInfo', 'getMiningInfo'],
    specialization: 'Mining optimization, fleet management, yield analysis'
  },
  'mission-specialist': {
    name: 'Mission Specialist',
    description: 'Advises on mission running, PvE strategies, and system navigation',
    defaultTools: ['getSystemInfo'],
    specialization: 'Mission planning, PvE strategies, system analysis'
  }
};

export const getAgentInfo = (agentId: string): AgentMetadata | undefined => {
  return AGENT_INFO[agentId as AgentId];
};

export const isValidAgentId = (agentId: string): agentId is AgentId => {
  return agentId in AGENT_INFO;
};
