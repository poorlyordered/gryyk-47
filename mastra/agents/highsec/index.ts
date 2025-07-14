// Export all Highsec specialist agents
export { default as recruitingSpecialist } from './recruiting-specialist';
export { default as economicSpecialist } from './economic-specialist';
export { default as marketSpecialist } from './market-specialist';
export { default as miningSpecialist } from './mining-specialist';
export { default as missionSpecialist } from './mission-specialist';

// Agent registry for easy access
export const HIGHSEC_AGENTS = {
  recruiting: 'recruiting-specialist',
  economic: 'economic-specialist',
  market: 'market-specialist',
  mining: 'mining-specialist',
  mission: 'mission-specialist'
} as const;

export type HighsecAgentType = keyof typeof HIGHSEC_AGENTS;