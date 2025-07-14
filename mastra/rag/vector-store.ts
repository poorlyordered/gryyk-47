import { VectorStore, Document, EmbeddingResult } from '@mastra/core';
import { EVE_RAG_CONFIG, EveDocumentMetadata, AGENT_QUERY_CATEGORIES } from './config';

export class EveVectorStore extends VectorStore<EveDocumentMetadata> {
  private documents: Map<string, Document<EveDocumentMetadata>> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  constructor() {
    super();
  }

  /**
   * Add documents to the vector store with embeddings
   */
  async addDocuments(
    documents: Document<EveDocumentMetadata>[],
    embeddings: number[][]
  ): Promise<void> {
    if (documents.length !== embeddings.length) {
      throw new Error('Documents and embeddings arrays must have the same length');
    }

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const embedding = embeddings[i];
      
      this.documents.set(doc.id, doc);
      this.embeddings.set(doc.id, embedding);
    }

    console.log(`Added ${documents.length} documents to EVE vector store`);
  }

  /**
   * Search for similar documents based on query embedding
   */
  async similaritySearch(
    queryEmbedding: number[],
    options: {
      topK?: number;
      minSimilarity?: number;
      filter?: Partial<EveDocumentMetadata>;
      agentType?: keyof typeof AGENT_QUERY_CATEGORIES;
    } = {}
  ): Promise<Array<{ document: Document<EveDocumentMetadata>; score: number }>> {
    const {
      topK = EVE_RAG_CONFIG.vectorStore.topK,
      minSimilarity = EVE_RAG_CONFIG.retrieval.minSimilarity,
      filter,
      agentType
    } = options;

    const results: Array<{ document: Document<EveDocumentMetadata>; score: number }> = [];

    // Calculate similarity for all documents
    for (const [docId, docEmbedding] of this.embeddings.entries()) {
      const document = this.documents.get(docId);
      if (!document) continue;

      // Apply filters
      if (filter && !this.matchesFilter(document.metadata, filter)) {
        continue;
      }

      // Apply agent-specific category filtering
      if (agentType && !this.matchesAgentCategories(document.metadata, agentType)) {
        continue;
      }

      const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
      
      if (similarity >= minSimilarity) {
        results.push({ document, score: similarity });
      }
    }

    // Sort by similarity score and return top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Search with text query (requires embedding the query first)
   */
  async search(
    query: string,
    embeddings: any, // OpenAI embeddings instance
    options: {
      topK?: number;
      agentType?: keyof typeof AGENT_QUERY_CATEGORIES;
      category?: EveDocumentMetadata['category'];
      securityLevel?: EveDocumentMetadata['securityLevel'];
    } = {}
  ): Promise<Array<{ document: Document<EveDocumentMetadata>; score: number; context: string }>> {
    // Embed the query
    const queryEmbedding = await embeddings.embed(query);
    
    // Build filter from options
    const filter: Partial<EveDocumentMetadata> = {};
    if (options.category) filter.category = options.category;
    if (options.securityLevel) filter.securityLevel = options.securityLevel;

    // Perform similarity search
    const results = await this.similaritySearch(queryEmbedding, {
      ...options,
      filter
    });

    // Enhance results with context
    return results.map(result => ({
      ...result,
      context: this.extractRelevantContext(result.document, query)
    }));
  }

  /**
   * Get documents by category for specific agent types
   */
  async getDocumentsByCategory(
    category: EveDocumentMetadata['category'],
    agentType?: keyof typeof AGENT_QUERY_CATEGORIES,
    limit: number = 10
  ): Promise<Document<EveDocumentMetadata>[]> {
    const results: Document<EveDocumentMetadata>[] = [];

    for (const document of this.documents.values()) {
      if (document.metadata.category === category) {
        // Check agent-specific relevance
        if (agentType && !this.matchesAgentCategories(document.metadata, agentType)) {
          continue;
        }
        results.push(document);
      }
    }

    // Sort by relevance and recency
    results.sort((a, b) => {
      const relevanceScore = this.getRelevanceScore(b) - this.getRelevanceScore(a);
      if (relevanceScore !== 0) return relevanceScore;
      
      return new Date(b.metadata.lastUpdated).getTime() - new Date(a.metadata.lastUpdated).getTime();
    });

    return results.slice(0, limit);
  }

  /**
   * Update document embeddings when content changes
   */
  async updateDocument(
    documentId: string,
    updatedDocument: Document<EveDocumentMetadata>,
    newEmbedding: number[]
  ): Promise<void> {
    this.documents.set(documentId, updatedDocument);
    this.embeddings.set(documentId, newEmbedding);
  }

  /**
   * Remove documents by ID or filter
   */
  async removeDocuments(
    filter: { ids?: string[]; category?: string; olderThan?: Date }
  ): Promise<number> {
    let removedCount = 0;

    if (filter.ids) {
      for (const id of filter.ids) {
        if (this.documents.delete(id) && this.embeddings.delete(id)) {
          removedCount++;
        }
      }
    } else {
      for (const [id, document] of this.documents.entries()) {
        let shouldRemove = false;

        if (filter.category && document.metadata.category === filter.category) {
          shouldRemove = true;
        }

        if (filter.olderThan && new Date(document.metadata.lastUpdated) < filter.olderThan) {
          shouldRemove = true;
        }

        if (shouldRemove) {
          this.documents.delete(id);
          this.embeddings.delete(id);
          removedCount++;
        }
      }
    }

    return removedCount;
  }

  /**
   * Get vector store statistics
   */
  async getStats(): Promise<{
    totalDocuments: number;
    documentsByCategory: Record<string, number>;
    documentsBySource: Record<string, number>;
    oldestDocument: string;
    newestDocument: string;
  }> {
    const categoryCount: Record<string, number> = {};
    const sourceCount: Record<string, number> = {};
    let oldest = new Date();
    let newest = new Date(0);

    for (const document of this.documents.values()) {
      // Count by category
      categoryCount[document.metadata.category] = (categoryCount[document.metadata.category] || 0) + 1;
      
      // Count by source
      sourceCount[document.metadata.source] = (sourceCount[document.metadata.source] || 0) + 1;
      
      // Track oldest and newest
      const docDate = new Date(document.metadata.lastUpdated);
      if (docDate < oldest) oldest = docDate;
      if (docDate > newest) newest = docDate;
    }

    return {
      totalDocuments: this.documents.size,
      documentsByCategory: categoryCount,
      documentsBySource: sourceCount,
      oldestDocument: oldest.toISOString(),
      newestDocument: newest.toISOString()
    };
  }

  // Private helper methods

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private matchesFilter(
    metadata: EveDocumentMetadata,
    filter: Partial<EveDocumentMetadata>
  ): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (metadata[key as keyof EveDocumentMetadata] !== value) {
        return false;
      }
    }
    return true;
  }

  private matchesAgentCategories(
    metadata: EveDocumentMetadata,
    agentType: keyof typeof AGENT_QUERY_CATEGORIES
  ): boolean {
    const relevantCategories = AGENT_QUERY_CATEGORIES[agentType];
    return relevantCategories.includes(metadata.category as any);
  }

  private extractRelevantContext(
    document: Document<EveDocumentMetadata>,
    query: string
  ): string {
    const content = document.content;
    const queryWords = query.toLowerCase().split(' ');
    
    // Find sentences that contain query words
    const sentences = content.split('. ');
    const relevantSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return queryWords.some(word => lowerSentence.includes(word));
    });

    // Return the most relevant context (up to 300 characters)
    const context = relevantSentences.slice(0, 3).join('. ');
    return context.length > 300 ? context.substring(0, 297) + '...' : context;
  }

  private getRelevanceScore(document: Document<EveDocumentMetadata>): number {
    const relevanceMap = { high: 3, medium: 2, low: 1 };
    return relevanceMap[document.metadata.relevance];
  }
}