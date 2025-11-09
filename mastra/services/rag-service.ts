import { initializeRAGSystem, eveDataPipeline } from '../rag';

export class RAGService {
  private static instance: RAGService;
  private initialized = false;

  static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('🔄 RAG system already initialized');
      return;
    }

    try {
      console.log('🚀 Starting EVE RAG system initialization...');
      await initializeRAGSystem();
      this.initialized = true;
      console.log('✅ EVE RAG system fully operational');
    } catch (error) {
      console.error('❌ RAG system initialization failed:', error);
      throw error;
    }
  }

  async ingestESIData(endpoint: string, data: any): Promise<void> {
    if (!this.initialized) {
      console.warn('⚠️ RAG system not initialized, skipping ESI data ingestion');
      return;
    }

    try {
      await eveDataPipeline.ingestESIData(endpoint, data);
      console.log(`📊 Successfully ingested ESI data from ${endpoint}`);
    } catch (error) {
      console.error(`❌ Failed to ingest ESI data from ${endpoint}:`, error);
    }
  }

  async ingestMarketData(marketData: any[]): Promise<void> {
    if (!this.initialized) {
      console.warn('⚠️ RAG system not initialized, skipping market data ingestion');
      return;
    }

    try {
      await eveDataPipeline.ingestMarketData(marketData);
      console.log(`💰 Successfully ingested ${marketData.length} market data entries`);
    } catch (error) {
      console.error('❌ Failed to ingest market data:', error);
    }
  }

  async search(query: string, options: any = {}): Promise<any> {
    if (!this.initialized) {
      throw new Error('RAG system not initialized');
    }

    return await eveDataPipeline.search(query, options);
  }

  async getStats(): Promise<any> {
    if (!this.initialized) {
      throw new Error('RAG system not initialized');
    }

    return await eveDataPipeline.getStats();
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const ragService = RAGService.getInstance();