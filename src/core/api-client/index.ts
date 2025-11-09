import { getAuthToken } from '../auth';

export class APIError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  [key: string]: unknown;
}

export class APIClient {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || import.meta.env.VITE_API_BASE_URL || '';
    this.defaultTimeout = 10000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async buildHeaders(customHeaders?: Record<string, string>): Promise<Record<string, string>> {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    
    const token = await getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  private buildURL(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return `${this.baseURL}${url.startsWith('/') ? url : `/${url}`}`;
  }

  private async makeRequest<T>(
    method: string,
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const fullURL = this.buildURL(url);
    const headers = await this.buildHeaders(config?.headers);
    const timeout = config?.timeout || this.defaultTimeout;

    console.debug(`[API] ${method.toUpperCase()} ${fullURL}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const requestInit: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestInit.body = JSON.stringify(data);
      }

      const response = await fetch(fullURL, requestInit);
      clearTimeout(timeoutId);

      console.debug(`[API] ${response.status} ${fullURL}`);

      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        
        const apiError = new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
        console.error('[API] Response error:', apiError);
        throw apiError;
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        const text = await response.text();
        return (text ? text : null) as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const timeoutError = new APIError('Request timeout', 408);
          console.error('[API] Request timeout:', timeoutError);
          throw timeoutError;
        }
        
        const apiError = new APIError(error.message);
        console.error('[API] Request error:', apiError);
        throw apiError;
      }
      
      throw error;
    }
  }

  public async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>('GET', url, undefined, config);
  }

  public async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>('POST', url, data, config);
  }

  public async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>('PUT', url, data, config);
  }

  public async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>('DELETE', url, undefined, config);
  }

  public async patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>('PATCH', url, data, config);
  }
}

export const apiClient = new APIClient();