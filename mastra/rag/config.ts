// RAG configuration without dependencies that don't exist in current @mastra/core version
// This will be updated when the proper RAG features are available

// EVE Online RAG configuration
export const EVE_RAG_CONFIG = {
  // Document sources for EVE information
  sources: {
    gameData: {
      name: 'eve-game-data',
      description: 'EVE Online game mechanics, ships, modules, and systems',
      chunkSize: 1000,
      chunkOverlap: 100,
      priority: 'high' as const
    },
    marketData: {
      name: 'eve-market-data',
      description: 'Market prices, trading data, and economic trends',
      chunkSize: 500,
      chunkOverlap: 50,
      priority: 'high' as const
    },
    corporationData: {
      name: 'corporation-data',
      description: 'Corporation-specific strategies, decisions, and outcomes',
      chunkSize: 800,
      chunkOverlap: 80,
      priority: 'medium' as const
    },
    strategyGuides: {
      name: 'strategy-guides',
      description: 'EVE Online strategy guides and best practices',
      chunkSize: 1200,
      chunkOverlap: 120,
      priority: 'medium' as const
    },
    apiData: {
      name: 'esi-api-data',
      description: 'Real-time EVE ESI API data and responses',
      chunkSize: 600,
      chunkOverlap: 60,
      priority: 'high' as const
    }
  },
  
  // Embedding configuration
  embeddings: {
    model: 'text-embedding-3-small', // OpenAI embedding model
    dimensions: 1536,
    batchSize: 100
  },
  
  // Vector store configuration
  vectorStore: {
    provider: 'memory', // Can be extended to Pinecone, Weaviate, etc.
    namespace: 'eve-online-rag',
    similarity: 'cosine' as const,
    topK: 5
  },
  
  // Retrieval settings
  retrieval: {
    minSimilarity: 0.7,
    maxResults: 10,
    rerankResults: true,
    includeMetadata: true
  }
};

// Document metadata schema for EVE content
export interface EveDocumentMetadata {
  source: keyof typeof EVE_RAG_CONFIG.sources;
  category: 'ships' | 'modules' | 'market' | 'strategy' | 'api' | 'corporation' | 'mechanics';
  securityLevel?: 'highsec' | 'lowsec' | 'nullsec' | 'wormhole';
  timestamp: string;
  url?: string;
  author?: string;
  tags: string[];
  relevance: 'high' | 'medium' | 'low';
  lastUpdated: string;
}

// RAG Engine initialization - placeholder until proper RAG features are available
export const createEveRagEngine = async () => {
  // Placeholder implementation
  return {
    search: async (query: string) => ({ results: [], query }),
    ingest: async (docs: any[]) => ({ success: true, count: docs.length }),
    isInitialized: () => true,
  };
};

// Query categories for different specialist agents
export const AGENT_QUERY_CATEGORIES = {
  recruiting: ['corporation', 'strategy', 'mechanics'],
  economic: ['market', 'strategy', 'api', 'mechanics'],
  market: ['market', 'api', 'strategy'],
  mining: ['ships', 'modules', 'market', 'strategy', 'mechanics'],
  mission: ['ships', 'modules', 'strategy', 'mechanics']
} as const;

// Document processing templates for different EVE content types
export const EVE_DOCUMENT_TEMPLATES = {
  shipData: {
    template: `
Ship: {name}
Class: {shipClass}
Faction: {faction}
Description: {description}
Bonuses: {bonuses}
Fitting: {fittingInfo}
Usage: {recommendedUsage}
`,
    requiredFields: ['name', 'shipClass', 'description']
  },
  
  moduleData: {
    template: `
Module: {name}
Category: {category}
Meta Level: {metaLevel}
Description: {description}
Effects: {effects}
Fitting Requirements: {fittingRequirements}
Usage Notes: {usageNotes}
`,
    requiredFields: ['name', 'category', 'description']
  },
  
  marketData: {
    template: `
Item: {itemName}
Current Price: {currentPrice}
Volume: {volume}
Price Trend: {priceTrend}
Market Analysis: {analysis}
Trading Opportunities: {opportunities}
`,
    requiredFields: ['itemName', 'currentPrice', 'analysis']
  },
  
  strategyGuide: {
    template: `
Strategy: {title}
Category: {category}
Security Level: {securityLevel}
Overview: {overview}
Steps: {steps}
Tips: {tips}
Risks: {risks}
Expected Outcome: {expectedOutcome}
`,
    requiredFields: ['title', 'category', 'overview']
  }
};