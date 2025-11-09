import { getEveOnlineToken } from './eve';

// Interface for strategic matrix document
export interface StrategicMatrixDocument {
  id?: string;
  userId?: string;
  title: string;
  content: string;
  category: string;
  lastUpdated?: Date;
}

// Base URL for Netlify functions
const FUNCTIONS_BASE_URL = '/.netlify/functions';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }
  return response.json();
};

// Fetch all strategic matrix documents
export const fetchDocuments = async (): Promise<StrategicMatrixDocument[]> => {
  const token = getEveOnlineToken();
  if (!token) {
    // For development/testing, return mock data if no token is available
    console.warn('No authentication token available, returning mock data');
    return [
      {
        id: '1',
        userId: 'mock-user',
        title: 'Mock Strategic Matrix Document',
        content: 'This is a mock document for testing purposes.',
        category: 'Test',
        lastUpdated: new Date()
      }
    ];
    // In production, uncomment the following line:
    // throw new Error('Authentication required');
  }

  const response = await fetch(`${FUNCTIONS_BASE_URL}/strategic-matrix`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return handleResponse(response);
};

// Create a new strategic matrix document
export const createDocument = async (document: StrategicMatrixDocument): Promise<StrategicMatrixDocument> => {
  const token = getEveOnlineToken();
  if (!token) {
    // For development/testing, return mock data if no token is available
    console.warn('No authentication token available, returning mock data');
    return {
      id: crypto.randomUUID(),
      userId: 'mock-user',
      title: document.title,
      content: document.content,
      category: document.category,
      lastUpdated: new Date()
    };
    // In production, uncomment the following line:
    // throw new Error('Authentication required');
  }

  const response = await fetch(`${FUNCTIONS_BASE_URL}/strategic-matrix`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(document)
  });

  return handleResponse(response);
};

// Update an existing strategic matrix document
export const updateDocument = async (id: string, document: Partial<StrategicMatrixDocument>): Promise<{ success: boolean }> => {
  const token = getEveOnlineToken();
  if (!token) {
    // For development/testing, return mock success if no token is available
    console.warn('No authentication token available, returning mock success');
    return { success: true };
    // In production, uncomment the following line:
    // throw new Error('Authentication required');
  }

  const response = await fetch(`${FUNCTIONS_BASE_URL}/strategic-matrix/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(document)
  });

  return handleResponse(response);
};

// Delete a strategic matrix document
export const deleteDocument = async (id: string): Promise<{ success: boolean }> => {
  const token = getEveOnlineToken();
  if (!token) {
    // For development/testing, return mock success if no token is available
    console.warn('No authentication token available, returning mock success');
    return { success: true };
    // In production, uncomment the following line:
    // throw new Error('Authentication required');
  }

  const response = await fetch(`${FUNCTIONS_BASE_URL}/strategic-matrix/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return handleResponse(response);
};
