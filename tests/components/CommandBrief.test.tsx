// @vitest-environment jsdom
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import CommandBrief from '../../src/components/chat/CommandBrief';
import type { CommandBriefSnapshot } from '../../src/types/commandBrief';

const processedSnapshot: CommandBriefSnapshot = {
  corporationId: '917701062',
  focus: 'grykk-47-eve-official-news',
  status: 'processed',
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
  freshness: 'fresh',
  nextHumanDecision: 'Decide whether to act on: Prepare a recruitment push around expansion interest.',
  loadedAt: '2026-05-31T11:00:00.000Z',
};

function renderBrief(snapshot: CommandBriefSnapshot | null = processedSnapshot) {
  const onRefresh = vi.fn();
  render(
    <ChakraProvider>
      <CommandBrief
        snapshot={snapshot}
        isLoading={false}
        onRefresh={onRefresh}
        canRefresh
      />
    </ChakraProvider>
  );
  return { onRefresh };
}

describe('CommandBrief', () => {
  test('renders processed command brief content and metadata', () => {
    renderBrief();

    expect(screen.getByText('Command Brief')).toBeTruthy();
    expect(screen.getByText('Latest processed brief is ready.')).toBeTruthy();
    expect(screen.getByText('Patch changes create a recruiting opportunity.')).toBeTruthy();
    expect(screen.getByText('Prepare a recruitment push around expansion interest.')).toBeTruthy();
    expect(screen.getByText('8 sources')).toBeTruthy();
    expect(screen.getByText('95% confidence')).toBeTruthy();
  });

  test('refresh button uses read-only refresh callback', () => {
    const { onRefresh } = renderBrief();

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
