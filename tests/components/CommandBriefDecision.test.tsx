// @vitest-environment jsdom
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import CommandBrief from '../../src/components/chat/CommandBrief';
import type { CommandBriefSnapshot } from '../../src/types/commandBrief';

describe('CommandBrief decision framing', () => {
  test('shows recommendations and watchlist as decision inputs', () => {
    const snapshot: CommandBriefSnapshot = {
      corporationId: '917701062',
      focus: 'grykk-47-eve-official-news',
      status: 'processed',
      request: null,
      freshness: 'fresh',
      nextHumanDecision: 'Decide whether to act on: Run a recruitment event.',
      loadedAt: '2026-05-31T11:00:00.000Z',
      brief: {
        _id: 'brief-1',
        corporationId: '917701062',
        focus: 'grykk-47-eve-official-news',
        createdAt: '2026-05-31T10:00:00.000Z',
        sourceCount: 2,
        brief: {
          executiveSummary: 'Recruiting window is open.',
          briefMarkdown: '',
          strategicImpacts: [
            {
              area: 'Official EVE news',
              impact: 'New patch interest can support recruiting.',
              urgency: 'medium',
            },
          ],
          recommendedActions: ['Run a recruitment event.'],
          watchlist: ['Watch new player activity.'],
          memory: '',
          confidence: 0.8,
        },
      },
    };

    render(
      <ChakraProvider>
        <CommandBrief
          snapshot={snapshot}
          isLoading={false}
          onRefresh={vi.fn()}
          canRefresh
        />
      </ChakraProvider>
    );

    expect(screen.getByText('Recommended Actions')).toBeTruthy();
    expect(screen.getByText('Run a recruitment event.')).toBeTruthy();
    expect(screen.getByText('Watchlist')).toBeTruthy();
    expect(screen.getByText('Watch new player activity.')).toBeTruthy();
  });
});
