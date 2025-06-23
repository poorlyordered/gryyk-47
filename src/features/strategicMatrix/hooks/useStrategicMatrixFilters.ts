import { useState, useCallback, useMemo } from 'react';
import { StrategicMatrixDocument } from '../types';

type SortField = 'title' | 'category' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';

interface FilterOptions {
  searchTerm?: string;
  category?: string;
  sortBy?: SortField;
  sortDirection?: SortDirection;
}

/**
 * Custom hook for filtering and sorting Strategic Matrix documents
 */
export const useStrategicMatrixFilters = (documents: StrategicMatrixDocument[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastUpdated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  /**
   * Update all filter options at once
   */
  const setFilterOptions = useCallback((options: FilterOptions) => {
    if (options.searchTerm !== undefined) setSearchTerm(options.searchTerm);
    if (options.category !== undefined) setCategoryFilter(options.category);
    if (options.sortBy !== undefined) setSortField(options.sortBy);
    if (options.sortDirection !== undefined) setSortDirection(options.sortDirection);
  }, []);

  /**
   * Reset all filters to default values
   */
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setCategoryFilter('');
    setSortField('lastUpdated');
    setSortDirection('desc');
  }, []);

  /**
   * Toggle sort direction
   */
  const toggleSortDirection = useCallback(() => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  /**
   * Set sort field and optionally reset direction
   */
  const changeSortField = useCallback((field: SortField, resetDirection = true) => {
    setSortField(field);
    if (resetDirection) {
      setSortDirection('asc');
    }
  }, []);

  /**
   * Filter and sort documents based on current filter settings
   */
  const filteredDocuments = useMemo(() => {
    // First, filter the documents
    const filtered = documents.filter(doc => {
      const matchesSearch = searchTerm === '' || 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === '' || doc.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });

    // Then, sort the filtered documents
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'lastUpdated':
          comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [documents, searchTerm, categoryFilter, sortField, sortDirection]);

  return {
    // Filter state
    searchTerm,
    categoryFilter,
    sortField,
    sortDirection,
    
    // Filter methods
    setSearchTerm,
    setCategoryFilter,
    setSortField,
    setSortDirection,
    setFilterOptions,
    resetFilters,
    toggleSortDirection,
    changeSortField,
    
    // Filtered results
    filteredDocuments,
  };
};
