/**
 * Embeddings service using OpenAI API through OpenRouter
 */
export class EmbeddingsService {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(config?: {
    apiKey?: string;
    baseURL?: string;
    model?: string;
  }) {
    this.apiKey = config?.apiKey || process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';
    this.baseURL = config?.baseURL || 'https://openrouter.ai/api/v1';
    this.model = config?.model || 'text-embedding-3-small';
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window?.location?.origin || 'http://localhost:5173',
          'X-Title': 'Gryyk-47 EVE Online AI Assistant'
        },
        body: JSON.stringify({
          model: this.model,
          input: text
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Embeddings API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window?.location?.origin || 'http://localhost:5173',
          'X-Title': 'Gryyk-47 EVE Online AI Assistant'
        },
        body: JSON.stringify({
          model: this.model,
          input: texts
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Embeddings API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error('Failed to generate batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
export const embeddingsService = new EmbeddingsService();
