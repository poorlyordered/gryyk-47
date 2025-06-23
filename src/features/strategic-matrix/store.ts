import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { apiClient } from '../../core/api-client';
import type { StrategicMatrixDocument } from './types';

interface StrategicMatrixState {
  documents: StrategicMatrixDocument[];
  isLoading: boolean;
  error: string | null;
  
  loadDocuments: () => Promise<void>;
  addDocument: (doc: StrategicMatrixDocument) => void;
  updateDocument: (id: string, updates: Partial<StrategicMatrixDocument>) => void;
  removeDocument: (id: string) => void;
}

export const useStrategicMatrixStore = create<StrategicMatrixState>()(
  immer((set) => ({
    documents: [],
    isLoading: false,
    error: null,

    loadDocuments: async () => {
      set({ isLoading: true, error: null });
      try {
        const docs = await apiClient.get<StrategicMatrixDocument[]>('/api/strategic-matrix');
        set({ documents: docs, isLoading: false });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load documents';
        set({ error: message, isLoading: false });
      }
    },

    addDocument: (doc) => {
      set((state) => {
        state.documents.push(doc);
      });
    },

    updateDocument: (id, updates) => {
      set((state) => {
        const index = state.documents.findIndex((d: StrategicMatrixDocument) => d.id === id);
        if (index >= 0) {
          state.documents[index] = { ...state.documents[index], ...updates };
        }
      });
    },

    removeDocument: (id) => {
      set((state) => {
        state.documents = state.documents.filter((d: StrategicMatrixDocument) => d.id !== id);
      });
    }
  }))
);