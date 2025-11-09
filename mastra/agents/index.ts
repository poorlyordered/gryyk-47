// Export all EVE Online AI agents
export { strategicAdvisorAgent } from './strategic-advisor';
export { marketAnalystAgent } from './market-analyst';
export { fleetCommanderAgent } from './fleet-commander';

// Agent registry for easy access
export const EVE_AGENTS = {
  strategicAdvisor: 'strategic-advisor',
  marketAnalyst: 'market-analyst',
  fleetCommander: 'fleet-commander'
} as const;

export type EVEAgentType = keyof typeof EVE_AGENTS;