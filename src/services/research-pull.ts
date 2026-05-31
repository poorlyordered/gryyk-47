import { apiClient } from '../core/api-client';

export const RESEARCH_FOCUS = 'grykk-47-eve-official-news';

export type ResearchStatusValue = 'queued' | 'raw_captured' | 'processing' | 'processed' | 'failed';

export interface ResearchRequestStatus {
  _id: string;
  createdAt: string;
  updatedAt?: string;
  requestedBy?: string;
  corporationId: string;
  focus: string;
  limit?: number;
  status: ResearchStatusValue;
  source?: string;
  errorMessage?: string;
  rawItemCount?: number;
  briefId?: string;
}

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

export interface ResearchBriefDocument {
  _id: string;
  id?: string;
  requestId?: string;
  corporationId: string;
  createdAt: string;
  focus: string;
  model?: string;
  sources?: string[];
  sourceCount?: number;
  itemCount?: number;
  items?: Array<{
    title: string;
    url: string;
    publishedAt?: string;
    source?: string;
    sourceType?: string;
    description?: string;
  }>;
  brief: ResearchBrief;
  processingMetadata?: Record<string, unknown>;
}

export interface ResearchSnapshot {
  request: ResearchRequestStatus | null;
  brief: ResearchBriefDocument | null;
  corporationId: string;
  focus: string;
}

export async function getResearchSnapshot(input: {
  corporationId: string;
  focus?: string;
}): Promise<ResearchSnapshot> {
  return apiClient.post<ResearchSnapshot>(
    '/research-pull',
    {
      corporationId: input.corporationId,
      focus: input.focus || RESEARCH_FOCUS,
    },
    { timeout: 10000 }
  );
}
