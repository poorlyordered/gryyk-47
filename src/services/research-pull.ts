import { apiClient } from '../core/api-client';

export interface ResearchBrief {
  executiveSummary: string;
  briefMarkdown: string;
  strategicImpacts: Array<{
    area: string;
    impact: string;
    urgency: 'low' | 'medium' | 'high';
  }>;
  recommendedActions: string[];
  watchlist: string[];
  memory: string;
  confidence: number;
}

export interface ResearchPullResponse {
  id: string;
  createdAt: string;
  corporationId: string;
  focus: string;
  itemCount: number;
  brief: ResearchBrief;
  items: Array<{
    title: string;
    url: string;
    publishedAt?: string;
    source: string;
    sourceType: string;
    description?: string;
  }>;
}

export async function runResearchPull(input: {
  corporationId: string;
  focus?: string;
  limit?: number;
}): Promise<ResearchPullResponse> {
  return apiClient.post<ResearchPullResponse>(
    '/research-pull',
    input,
    { timeout: 60000 }
  );
}
