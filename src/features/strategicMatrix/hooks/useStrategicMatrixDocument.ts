import { useState } from 'react';
import { useStrategicMatrixStore } from '../store';
import { StrategicMatrixDocument } from '../types';

/**
 * Custom hook for Strategic Matrix document operations
 * Provides methods for creating, reading, updating, and deleting documents
 */
export const useStrategicMatrixDocument = () => {
  const { 
    documents,
    addDocument, 
    updateDocument, 
    deleteDocument, 
    getDocumentById,
    getDocumentsByCategory,
    getLatestDocumentByCategory
  } = useStrategicMatrixStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new document
   */
  const createDocument = async (document: Omit<StrategicMatrixDocument, 'id'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      addDocument(document);
      return true;
    } catch (err) {
      setError('Failed to create document');
      console.error('Error creating document:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing document
   */
  const saveDocument = async (document: StrategicMatrixDocument) => {
    setIsLoading(true);
    setError(null);
    
    try {
      updateDocument(document);
      return true;
    } catch (err) {
      setError('Failed to update document');
      console.error('Error updating document:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Remove a document
   */
  const removeDocument = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      deleteDocument(id);
      return true;
    } catch (err) {
      setError('Failed to delete document');
      console.error('Error deleting document:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get all documents
   */
  const getAllDocuments = () => {
    return documents;
  };

  /**
   * Get a document by ID
   */
  const getDocument = (id: string) => {
    return getDocumentById(id);
  };

  /**
   * Get documents by category
   */
  const getDocumentsForCategory = (category: string) => {
    return getDocumentsByCategory(category);
  };

  /**
   * Get the most recent document for a category
   */
  const getLatestDocument = (category: string) => {
    return getLatestDocumentByCategory(category);
  };

  return {
    // State
    documents,
    isLoading,
    error,
    
    // Methods
    createDocument,
    saveDocument,
    removeDocument,
    getAllDocuments,
    getDocument,
    getDocumentsForCategory,
    getLatestDocument,
  };
};
