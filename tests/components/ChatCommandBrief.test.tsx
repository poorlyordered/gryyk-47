// @vitest-environment jsdom
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import Chat from '../../src/pages/Chat';

const loadBrief = vi.fn();

vi.mock('../../src/hooks/useAIChat', () => ({
  useAIChat: () => ({
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('../../src/store/auth', () => ({
  useAuthStore: (selector: any) =>
    selector({
      character: {
        id: 1793798962,
        name: 'Nolan Rulgin',
        corporation: {
          id: 917701062,
          name: 'EVE University',
        },
        portrait: '',
      },
    }),
}));

vi.mock('../../src/store/commandBrief', () => ({
  useCommandBriefStore: (selector?: any) => {
    const state = {
      snapshot: null,
      isLoading: false,
      loadBrief,
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../../src/store/chat', () => ({
  useChatStore: () => ({
    selectedModel: 'google/gemma-4-31b-it',
    availableModels: [],
    isLoadingModels: false,
    setSelectedModel: vi.fn(),
    fetchModels: vi.fn(),
    clearMessages: vi.fn(),
  }),
}));

vi.mock('../../src/components/chat/ChatMessageList', () => ({
  default: () => <div>Chat messages</div>,
}));

vi.mock('../../src/components/chat/OrchestrationControls', () => ({
  default: () => <div>Orchestration controls</div>,
}));

vi.mock('../../src/components/chat/StrategyRefreshPanel', () => ({
  default: () => <div>Strategy refresh</div>,
}));

vi.mock('../../src/components/chat/ResearchPullPanel', () => ({
  default: () => <div>Research panel</div>,
}));

vi.mock('../../src/components/chat/StrategicSessionManager', () => ({
  default: () => <div>Strategic session</div>,
}));

vi.mock('../../src/components/chat/UpdateProposal', () => ({
  default: () => <div>Update proposal</div>,
}));

vi.mock('../../src/components/chat/ChatHistory', () => ({
  default: () => <div>Chat history</div>,
}));

vi.mock('../../src/features/strategicMatrix', () => ({
  CollapsiblePanel: () => <div>Strategic matrix</div>,
  UpdateProcessor: () => null,
}));

describe('Chat command brief integration', () => {
  test('loads command brief from authenticated corporation context', async () => {
    loadBrief.mockClear();

    render(
      <ChakraProvider>
        <MemoryRouter>
          <Chat />
        </MemoryRouter>
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(loadBrief).toHaveBeenCalledWith('917701062');
    });
  });
});
