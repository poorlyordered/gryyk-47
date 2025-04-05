/**
 * Gryyk-47 Strategic Context Data Models
 * Auto-generated from strategic_context_schemas.md
 */

export interface CorporationContext {
  corpId: string;
  name: string;
  ticker: string;
  founded?: string;
  description?: string;
  leadership?: string[];
  values?: string;
  vision?: string;
}

export interface ActiveContext {
  corpId: string;
  timestamp: string;
  currentInitiatives?: string[];
  recentDecisions?: string[];
  immediateThreats?: string[];
  immediateOpportunities?: string[];
}

export interface AssetInformation {
  corpId: string;
  territoryHoldings?: string[];
  fleetComposition?: string[];
  infrastructure?: string[];
}

export interface DiplomaticRelations {
  corpId: string;
  alliances?: string[];
  relationships?: string[];
  treaties?: string[];
  enemies?: string[];
}

export interface OperationalDetails {
  corpId: string;
  pvpOperations?: string[];
  pveOperations?: string[];
  industrialActivities?: string[];
  logistics?: string[];
}

export interface ThreatAnalysis {
  corpId: string;
  hostileEntities?: string[];
  marketThreats?: string[];
  vulnerabilities?: string[];
}

export interface OpportunityAssessment {
  corpId: string;
  expansionTargets?: string[];
  economicOpportunities?: string[];
  recruitmentTargets?: string[];
}

export interface SessionContext {
  sessionId: string;
  corpId: string;
  startTime: string;
  endTime?: string;
  userQueries?: string[];
  aiAnalysis?: string[];
  recommendations?: { text: string; confidence: number }[];
  feedback?: string;
}