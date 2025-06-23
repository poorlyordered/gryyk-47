import { apiClient } from '../core/api-client';
import { AxiosResponse } from 'axios';
import { CorporationInfo } from './esi';

export interface StrategicDocument {
  _id: string;
  corporationId: string;
  documentType: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrategicContext {
  summary: string;
  documents: StrategicDocument[];
  liveEveData: {
    corporationInfo: CorporationInfo;
  };
}

/**
 * Initiates a strategic session on the backend.
 * This will trigger the context loading and analysis process.
 * @param {string} corporationId - The ID of the corporation to initiate the session for.
 * @returns {Promise<StrategicContext>} The initial strategic context.
 */
export const initiateSession = async (corporationId: string): Promise<StrategicContext> => {
  try {
    const response: AxiosResponse<StrategicContext> = await apiClient.post(
      '/strategic-workflows/initiate-session',
      { corporationId }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to initiate strategic session:', error);
    // Re-throw the error to be handled by the calling function
    throw error;
  }
}; 