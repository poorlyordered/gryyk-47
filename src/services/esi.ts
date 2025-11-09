import { apiClient } from '../core/api-client';
import { AxiosResponse } from 'axios';

// Interfaces for ESI data can be expanded as more endpoints are added
export interface CorporationInfo {
  name: string;
  ticker: string;
  member_count: number;
  alliance_id?: number;
  ceo_id: number;
  // Add other relevant fields
}

/**
 * Fetches data from a specific ESI endpoint via our backend proxy.
 * @param endpoint - The ESI endpoint to target (e.g., 'corporation_info').
 * @param corporationId - The ID of the corporation.
 * @returns The data from the ESI endpoint.
 */
const fetchFromEsiProxy = async <T>(endpoint: string, corporationId: string): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await apiClient.post('/eve-api-proxy', {
      endpoint,
      corporationId,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch from ESI proxy endpoint '${endpoint}':`, error);
    throw error;
  }
};

/**
 * Retrieves public corporation information from ESI.
 * @param corporationId - The ID of the corporation.
 */
export const getCorporationInfo = (corporationId: string) => {
  return fetchFromEsiProxy<CorporationInfo>('corporation_info', corporationId);
}; 