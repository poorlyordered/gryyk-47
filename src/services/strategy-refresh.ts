import { apiClient } from '../core/api-client';

export interface StrategyRefreshReport {
  executiveSummary: string;
  progressReportMarkdown: string;
  flywheelAssessment: string;
  suggestedActions: string[];
  questionsForLeadership: string[];
  strategicMemory: string;
  confidence: number;
}

export interface StrategyRefreshResponse {
  id: string;
  createdAt: string;
  corporationId: string;
  sessionId?: string;
  focus: string;
  leadershipInput: string;
  report: StrategyRefreshReport;
  contextSummary: {
    strategicDocuments: number;
    recentMessages: number;
    previousReports: number;
    strategicDecisions: number;
    agentExperiences: number;
    researchBriefs: number;
  };
}

export async function runStrategyRefresh(input: {
  corporationId: string;
  sessionId?: string;
  focus?: string;
  leadershipInput?: string;
}): Promise<StrategyRefreshResponse> {
  return apiClient.post<StrategyRefreshResponse>(
    '/strategy-refresh',
    input,
    { timeout: 60000 }
  );
}
