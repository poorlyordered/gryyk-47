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
  queued?: boolean;
  eventIds?: string[];
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

export interface QueuedResearchPullResponse {
  queued: true;
  eventIds: string[];
  corporationId: string;
  focus: string;
  limit: number;
}

export async function runResearchPull(input: {
  corporationId: string;
  focus?: string;
  limit?: number;
}): Promise<ResearchPullResponse | QueuedResearchPullResponse> {
  return apiClient.post<ResearchPullResponse | QueuedResearchPullResponse>(
    '/research-pull',
    input,
    { timeout: 15000 }
  );
}
