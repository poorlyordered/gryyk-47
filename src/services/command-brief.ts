import type { ResearchBriefDocument, ResearchSnapshot } from './research-pull';
import { RESEARCH_FOCUS } from './research-pull';
import type {
  CommandBriefBuildInput,
  CommandBriefFreshness,
  CommandBriefSnapshot,
  CommandBriefStatus,
} from '../types/commandBrief';

const PROCESSING_STATUSES = new Set(['queued', 'raw_captured', 'processing']);
const DEFAULT_CORPORATION_ID = '917701062';
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function getBriefDate(brief: ResearchBriefDocument | null): Date | null {
  if (!brief?.createdAt) return null;
  const date = new Date(brief.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getCommandBriefFreshness(
  brief: ResearchBriefDocument | null,
  now = new Date()
): CommandBriefFreshness {
  const createdAt = getBriefDate(brief);
  if (!createdAt) return 'unknown';
  return now.getTime() - createdAt.getTime() > STALE_AFTER_MS ? 'stale' : 'fresh';
}

export function getCommandBriefSourceCount(brief: ResearchBriefDocument | null): number {
  if (!brief) return 0;
  if (typeof brief.sourceCount === 'number') return brief.sourceCount;
  if (typeof brief.itemCount === 'number') return brief.itemCount;
  if (Array.isArray(brief.sources)) return brief.sources.length;
  if (Array.isArray(brief.items)) return brief.items.length;
  return 0;
}

export function getCommandBriefStatus(snapshot: ResearchSnapshot | null): CommandBriefStatus {
  if (!snapshot?.request) return 'absent';
  return snapshot.request.status;
}

export function deriveNextHumanDecision(
  status: CommandBriefStatus,
  brief: ResearchBriefDocument | null
): string {
  const firstAction = brief?.brief?.recommendedActions?.find(Boolean);
  if (firstAction) {
    return `Decide whether to act on: ${firstAction}`;
  }

  const firstWatchItem = brief?.brief?.watchlist?.find(Boolean);
  if (firstWatchItem) {
    return `Decide whether to monitor or investigate: ${firstWatchItem}`;
  }

  if (status === 'failed') {
    return 'Decide whether to use the previous brief or rerun research from OvernightDesk.';
  }

  if (PROCESSING_STATUSES.has(status)) {
    return 'Decide whether to work from the previous brief while newer research finishes.';
  }

  if (status === 'unavailable') {
    return 'Decide whether to retry loading the command brief or continue without research context.';
  }

  return 'Review the available context and decide the next corporation leadership question.';
}

export function buildCommandBriefSnapshot({
  snapshot,
  previous,
  errorMessage,
  loadedAt = new Date(),
}: CommandBriefBuildInput): CommandBriefSnapshot {
  const status: CommandBriefStatus = errorMessage ? 'unavailable' : getCommandBriefStatus(snapshot);
  const currentBrief = snapshot?.brief || null;
  const preservedBrief =
    currentBrief ||
    (status === 'failed' || PROCESSING_STATUSES.has(status) || status === 'unavailable'
      ? previous?.brief || null
      : null);

  const corporationId =
    snapshot?.corporationId || previous?.corporationId || DEFAULT_CORPORATION_ID;
  const focus = snapshot?.focus || previous?.focus || RESEARCH_FOCUS;

  return {
    corporationId,
    focus,
    status,
    request: snapshot?.request || previous?.request || null,
    brief: preservedBrief,
    errorMessage: errorMessage || snapshot?.request?.errorMessage,
    freshness: getCommandBriefFreshness(preservedBrief, loadedAt),
    nextHumanDecision: deriveNextHumanDecision(status, preservedBrief),
    loadedAt: loadedAt.toISOString(),
  };
}

export function buildCommandBriefGrounding(snapshot: CommandBriefSnapshot | null): string {
  if (!snapshot?.brief) return '';

  const brief = snapshot.brief.brief;
  const impacts = brief.strategicImpacts?.map((impact) => `- ${impact.impact}`).join('\n') || 'None provided';
  const actions = brief.recommendedActions?.map((action) => `- ${action}`).join('\n') || 'None provided';
  const watchlist = brief.watchlist?.map((item) => `- ${item}`).join('\n') || 'None provided';
  const confidence =
    typeof brief.confidence === 'number' ? `${Math.round(brief.confidence * 100)}%` : 'unknown';

  return [
    '--- ACTIVE COMMAND BRIEF CONTEXT ---',
    `Status: ${snapshot.status}`,
    `Created: ${snapshot.brief.createdAt || 'unknown'}`,
    `Freshness: ${snapshot.freshness}`,
    `Model: ${snapshot.brief.model || 'unknown'}`,
    `Sources: ${getCommandBriefSourceCount(snapshot.brief)}`,
    `Confidence: ${confidence}`,
    `Next human decision: ${snapshot.nextHumanDecision}`,
    '',
    `Executive summary: ${brief.executiveSummary || 'None provided'}`,
    '',
    'Strategic impacts:',
    impacts,
    '',
    'Recommended actions:',
    actions,
    '',
    'Watchlist:',
    watchlist,
    '--- END COMMAND BRIEF CONTEXT ---',
  ].join('\n');
}
