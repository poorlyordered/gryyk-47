// Export all EVE Online workflows
export { strategicPlanningWorkflow } from './strategic-planning';
export { marketIntelligenceWorkflow } from './market-intelligence';

// Workflow registry for easy access
export const EVE_WORKFLOWS = {
  strategicPlanning: 'strategic-planning',
  marketIntelligence: 'market-intelligence'
} as const;

export type EVEWorkflowType = keyof typeof EVE_WORKFLOWS;