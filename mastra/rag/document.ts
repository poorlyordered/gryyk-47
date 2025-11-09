/**
 * Document class for RAG system
 */
export class Document<T = Record<string, any>> {
  id: string;
  content: string;
  metadata: T;

  constructor(params: { id: string; content: string; metadata: T }) {
    this.id = params.id;
    this.content = params.content;
    this.metadata = params.metadata;
  }

  /**
   * Create a new document with updated content
   */
  withContent(content: string): Document<T> {
    return new Document({
      id: this.id,
      content,
      metadata: this.metadata
    });
  }

  /**
   * Create a new document with updated metadata
   */
  withMetadata(metadata: Partial<T>): Document<T> {
    return new Document({
      id: this.id,
      content: this.content,
      metadata: { ...this.metadata, ...metadata }
    });
  }

  /**
   * Get document length
   */
  get length(): number {
    return this.content.length;
  }
}
