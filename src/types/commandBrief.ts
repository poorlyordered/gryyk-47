import type {
  ResearchBriefDocument,
  ResearchRequestStatus,
  ResearchSnapshot,
  ResearchStatusValue,
} from '../services/research-pull';

export type CommandBriefStatus = ResearchStatusValue | 'unavailable' | 'absent';

export type CommandBriefFreshness = 'fresh' | 'stale' | 'unknown';

export interface CommandBriefSnapshot {
  corporationId: string;
  focus: string;
  status: CommandBriefStatus;
  request: ResearchRequestStatus | null;
  brief: ResearchBriefDocument | null;
  errorMessage?: string;
  freshness: CommandBriefFreshness;
  nextHumanDecision: string;
  loadedAt: string;
}

export interface CommandBriefState {
  snapshot: CommandBriefSnapshot | null;
  isLoading: boolean;
  error: string | null;
  loadBrief: (corporationId: string, focus?: string) => Promise<void>;
  clearBrief: () => void;
}

export interface CommandBriefBuildInput {
  snapshot: ResearchSnapshot | null;
  previous?: CommandBriefSnapshot | null;
  errorMessage?: string;
  loadedAt?: Date;
}
