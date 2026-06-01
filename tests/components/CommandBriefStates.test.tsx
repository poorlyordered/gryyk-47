// @vitest-environment jsdom
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import CommandBrief from '../../src/components/chat/CommandBrief';
import type { CommandBriefSnapshot, CommandBriefStatus } from '../../src/types/commandBrief';

function makeSnapshot(status: CommandBriefStatus, errorMessage?: string): CommandBriefSnapshot {
  return {
    corporationId: '917701062',
    focus: 'grykk-47-eve-official-news',
    status,
    request: null,
    brief: null,
    errorMessage,
    freshness: 'unknown',
    nextHumanDecision: 'Review the available context and decide the next corporation leadership question.',
    loadedAt: '2026-05-31T11:00:00.000Z',
  };
}

function renderState(status: CommandBriefStatus, errorMessage?: string) {
  render(
    <ChakraProvider>
      <CommandBrief
        snapshot={makeSnapshot(status, errorMessage)}
        isLoading={false}
        onRefresh={vi.fn()}
        canRefresh
      />
    </ChakraProvider>
  );
}

describe('CommandBrief states', () => {
  test('renders processing state', () => {
    renderState('processing');
    expect(screen.getByText('Research is processing in OvernightDesk.')).toBeTruthy();
  });

  test('renders failed state with error message', () => {
    renderState('failed', 'Model provider failed');
    expect(screen.getByText(/Latest research failed/)).toBeTruthy();
    expect(screen.getByText(/Model provider failed/)).toBeTruthy();
  });

  test('renders unavailable state', () => {
    renderState('unavailable', 'Request timeout');
    expect(screen.getByText(/Command brief lookup failed/)).toBeTruthy();
    expect(screen.getByText(/Request timeout/)).toBeTruthy();
  });

  test('renders absent state', () => {
    renderState('absent');
    expect(screen.getByText('No OvernightDesk research request is available yet.')).toBeTruthy();
  });
});
