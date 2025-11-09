// RAG System Exports
export { EVE_RAG_CONFIG, AGENT_QUERY_CATEGORIES, type EveDocumentMetadata } from './config';
export { Document } from './document';
export { EmbeddingsService, embeddingsService } from './embeddings-service';
export { EveDocumentProcessor } from './document-processor';
export { EveVectorStore } from './vector-store';
export { EveDataIngestionPipeline, eveDataPipeline } from './data-ingestion';
export {
  createRAGEnhancedTool,
  createKnowledgeQueryTool,
  createKnowledgeManagementTool,
  storeRAGInteraction,
  injectRAGContext,
  initializeRAGSystem
} from './agent-rag-integration';