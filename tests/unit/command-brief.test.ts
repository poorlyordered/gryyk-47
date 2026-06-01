import { describe, expect, test } from 'vitest';
import {
  buildCommandBriefGrounding,
  buildCommandBriefSnapshot,
  deriveNextHumanDecision,
  getCommandBriefSourceCount,
} from '../../src/services/command-brief';
import type { ResearchSnapshot } from '../../src/services/research-pull';

const processedSnapshot: ResearchSnapshot = {
  corporationId: '917701062',
  focus: 'grykk-47-eve-official-news',
  request: {
    _id: 'request-1',
    corporationId: '917701062',
    focus: 'grykk-47-eve-official-news',
    status: 'processed',
    createdAt: '2026-05-31T10:00:00.000Z',
  },
  brief: {
    _id: 'brief-1',
    corporationId: '917701062',
    focus: 'grykk-47-eve-official-news',
    createdAt: '2026-05-31T10:02:00.000Z',
    model: 'google/gemma-4-31b-it',
    sourceCount: 8,
    brief: {
      executiveSummary: 'Patch changes create a recruiting opportunity.',
      briefMarkdown: '# Brief',
      strategicImpacts: [
        {
          area: 'Official EVE news',
          impact: 'Expansion changes may increase new player activity.',
          urgency: 'medium',
        },
      ],
      recommendedActions: ['Prepare a recruitment push around expansion interest.'],
      watchlist: ['Watch official patch follow-ups.'],
      memory: 'Expansion research reviewed.',
      confidence: 0.95,
    },
  },
};

describe('command brief mapping', () => {
  test('maps processed research snapshots into command brief snapshots', () => {
    const commandBrief = buildCommandBriefSnapshot({
      snapshot: processedSnapshot,
      loadedAt: new Date('2026-05-31T11:00:00.000Z'),
    });

    expect(commandBrief.status).toBe('processed');
    expect(commandBrief.freshness).toBe('fresh');
    expect(commandBrief.brief?._id).toBe('brief-1');
    expect(commandBrief.nextHumanDecision).toContain('Prepare a recruitment push');
  });

  test('preserves previous brief during processing', () => {
    const previous = buildCommandBriefSnapshot({
      snapshot: processedSnapshot,
      loadedAt: new Date('2026-05-31T11:00:00.000Z'),
    });

    const next = buildCommandBriefSnapshot({
      previous,
      loadedAt: new Date('2026-05-31T11:30:00.000Z'),
      snapshot: {
        corporationId: '917701062',
        focus: 'grykk-47-eve-official-news',
        request: {
          _id: 'request-2',
          corporationId: '917701062',
          focus: 'grykk-47-eve-official-news',
          status: 'processing',
          createdAt: '2026-05-31T11:20:00.000Z',
        },
        brief: null,
      },
    });

    expect(next.status).toBe('processing');
    expect(next.brief?._id).toBe('brief-1');
  });

  test('maps failed lookups to unavailable while preserving prior brief', () => {
    const previous = buildCommandBriefSnapshot({ snapshot: processedSnapshot });
    const next = buildCommandBriefSnapshot({
      previous,
      snapshot: null,
      errorMessage: 'Request timeout',
    });

    expect(next.status).toBe('unavailable');
    expect(next.errorMessage).toBe('Request timeout');
    expect(next.brief?._id).toBe('brief-1');
  });

  test('derives fallback next decisions', () => {
    expect(deriveNextHumanDecision('processing', null)).toContain('previous brief');
    expect(deriveNextHumanDecision('unavailable', null)).toContain('retry');
  });

  test('builds concise chat grounding context', () => {
    const commandBrief = buildCommandBriefSnapshot({ snapshot: processedSnapshot });
    const grounding = buildCommandBriefGrounding(commandBrief);

    expect(grounding).toContain('ACTIVE COMMAND BRIEF CONTEXT');
    expect(grounding).toContain('Prepare a recruitment push');
    expect(grounding).toContain('Sources: 8');
  });

  test('derives source count from available fields', () => {
    expect(getCommandBriefSourceCount(processedSnapshot.brief)).toBe(8);
  });
});
