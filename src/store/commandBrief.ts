import { create } from 'zustand';
import { getResearchSnapshot } from '../services/research-pull';
import { buildCommandBriefSnapshot } from '../services/command-brief';
import type { CommandBriefState } from '../types/commandBrief';

export const useCommandBriefStore = create<CommandBriefState>()((set) => ({
  snapshot: null,
  isLoading: false,
  error: null,

  loadBrief: async (corporationId: string, focus?: string) => {
    if (!corporationId) return;

    set({ isLoading: true, error: null });
    try {
      const researchSnapshot = await getResearchSnapshot({ corporationId, focus });
      set((state) => ({
        snapshot: buildCommandBriefSnapshot({
          snapshot: researchSnapshot,
          previous: state.snapshot,
        }),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Command brief lookup failed';
      set((state) => ({
        snapshot: buildCommandBriefSnapshot({
          snapshot: null,
          previous: state.snapshot,
          errorMessage: message,
        }),
        isLoading: false,
        error: message,
      }));
    }
  },

  clearBrief: () => set({ snapshot: null, isLoading: false, error: null }),
}));
