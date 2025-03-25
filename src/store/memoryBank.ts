import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MemoryBankDocument } from '../types/memoryBank';

interface MemoryBankState {
  documents: MemoryBankDocument[];
  addDocument: (document: Omit<MemoryBankDocument, 'id'>) => void;
  updateDocument: (document: MemoryBankDocument) => void;
  deleteDocument: (id: string) => void;
  getDocumentById: (id: string) => MemoryBankDocument | undefined;
  getDocumentsByCategory: (category: string) => MemoryBankDocument[];
}

// Initial sample documents
const initialDocuments: MemoryBankDocument[] = [
  {
    id: '1',
    title: 'Corporation Overview',
    content: 'Our corporation focuses on industrial operations in high-security space, with a growing presence in low-security mining operations.',
    category: 'Corporation Context',
    lastUpdated: new Date('2025-03-15'),
  },
  {
    id: '2',
    title: 'Current Operations',
    content: 'We are currently expanding our mining fleet and establishing a more efficient logistics chain for resource transportation.',
    category: 'Active Context',
    lastUpdated: new Date('2025-03-20'),
  },
  {
    id: '3',
    title: 'Fleet Assets',
    content: 'Our current fleet consists of 5 mining barges, 2 exhumers, 3 industrial ships, and 2 combat escorts.',
    category: 'Asset Information',
    lastUpdated: new Date('2025-03-18'),
  },
];

export const useMemoryBankStore = create<MemoryBankState>()(
  persist(
    (set, get) => ({
      documents: initialDocuments,
      
      addDocument: (document) => {
        const newDocument: MemoryBankDocument = {
          ...document,
          id: crypto.randomUUID(),
          lastUpdated: new Date(),
        };
        
        set((state) => ({
          documents: [...state.documents, newDocument],
        }));
      },
      
      updateDocument: (document) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === document.id
              ? { ...document, lastUpdated: new Date() }
              : doc
          ),
        }));
      },
      
      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
        }));
      },
      
      getDocumentById: (id) => {
        return get().documents.find((doc) => doc.id === id);
      },
      
      getDocumentsByCategory: (category) => {
        return get().documents.filter((doc) => doc.category === category);
      },
    }),
    {
      name: 'memory-bank-storage',
      partialize: (state) => ({ documents: state.documents }),
    }
  )
);
