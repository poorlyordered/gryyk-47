import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCommandBriefStore } from '../../src/store/commandBrief';
import { getResearchSnapshot } from '../../src/services/research-pull';

vi.mock('../../src/services/research-pull', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/research-pull')>(
    '../../src/services/research-pull'
  );
  return {
    ...actual,
    getResearchSnapshot: vi.fn(),
  };
});

const mockedGetResearchSnapshot = vi.mocked(getResearchSnapshot);

describe('command brief store', () => {
  beforeEach(() => {
    useCommandBriefStore.getState().clearBrief();
    mockedGetResearchSnapshot.mockReset();
  });

  test('preserves previous brief when refresh fails', async () => {
    mockedGetResearchSnapshot.mockResolvedValueOnce({
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
        sourceCount: 1,
        brief: {
          executiveSummary: 'Summary',
          briefMarkdown: '',
          strategicImpacts: [],
          recommendedActions: ['Act'],
          watchlist: [],
          memory: '',
          confidence: 0.9,
        },
      },
    });

    await useCommandBriefStore.getState().loadBrief('917701062');
    mockedGetResearchSnapshot.mockRejectedValueOnce(new Error('Request timeout'));
    await useCommandBriefStore.getState().loadBrief('917701062');

    const state = useCommandBriefStore.getState();
    expect(state.snapshot?.status).toBe('unavailable');
    expect(state.snapshot?.brief?._id).toBe('brief-1');
    expect(state.error).toBe('Request timeout');
  });
});
