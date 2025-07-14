import {
  MemoryPattern,
  PatternAnalysis,
  ContextualMemory,
  LearningInsight,
  BehavioralTrend,
  PatternRecognitionConfig,
  MemorySearch,
  MemoryCluster,
  AdaptationSuggestion
} from './types';
import { EventBus } from '../../core/event-bus';

export class PatternRecognizer {
  private config: PatternRecognitionConfig;
  private patterns: Map<string, MemoryPattern> = new Map();
  private memories: Map<string, ContextualMemory> = new Map();
  private insights: Map<string, LearningInsight> = new Map();
  private eventBus: EventBus;
  private analysisInterval: NodeJS.Timeout | null = null;

  constructor(config: PatternRecognitionConfig) {
    this.config = config;
    this.eventBus = EventBus.getInstance();
    this.setupEventListeners();
    this.startPatternAnalysis();
  }

  private setupEventListeners() {
    this.eventBus.on('conversation:message:processed', this.processMessage.bind(this));
    this.eventBus.on('agent:decision:made', this.recordDecision.bind(this));
    this.eventBus.on('outcome:observed', this.recordOutcome.bind(this));
    this.eventBus.on('user:feedback:received', this.incorporateFeedback.bind(this));
  }

  private startPatternAnalysis() {
    // Run pattern analysis every 5 minutes
    this.analysisInterval = setInterval(() => {
      this.analyzePatterns();
      this.generateInsights();
      this.suggestAdaptations();
    }, 5 * 60 * 1000);
  }

  private async processMessage(data: {
    conversationId: string;
    agentId: string;
    message: string;
    context: string;
    response: string;
    confidence: number;
    toolsUsed: string[];
    ragQueries: string[];
    esiCalls: string[];
    timestamp: string;
  }) {
    // Store as contextual memory
    const memory = this.createContextualMemory(data);
    this.memories.set(memory.id, memory);

    // Analyze for patterns
    const analysis = await this.analyzeMessageForPatterns(data);
    
    // Emit analysis event
    this.eventBus.emit('pattern:analysis:complete', analysis);
  }

  private createContextualMemory(data: any): ContextualMemory {
    const memoryId = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: memoryId,
      type: 'conversation',
      agentId: data.agentId,
      content: {
        summary: this.generateSummary(data.message, data.response),
        details: JSON.stringify({
          message: data.message,
          response: data.response,
          context: data.context
        }),
        context: data.context,
        participants: [data.agentId, 'user']
      },
      metadata: {
        timestamp: data.timestamp,
        tags: this.extractTags(data.message, data.context),
        importance: this.calculateImportance(data),
        confidence: data.confidence,
        linkedMemories: [],
        retrievalCount: 0,
        lastAccessed: data.timestamp
      },
      embedding: this.generateEmbedding(data.message + ' ' + data.context + ' ' + data.response)
    };
  }

  private async analyzeMessageForPatterns(data: any): Promise<PatternAnalysis> {
    const detectedPatterns: MemoryPattern[] = [];
    const reinforcedPatterns: string[] = [];
    const newPatterns: MemoryPattern[] = [];

    // Check for existing patterns
    for (const [patternId, pattern] of this.patterns) {
      if (this.matchesPattern(data, pattern)) {
        detectedPatterns.push(pattern);
        reinforcedPatterns.push(patternId);
        this.reinforcePattern(patternId, data);
      }
    }

    // Look for new patterns
    const similarMemories = this.findSimilarMemories(data.message, data.context);
    if (similarMemories.length >= this.config.minOccurrences) {
      const newPattern = this.formNewPattern(data, similarMemories);
      if (newPattern) {
        newPatterns.push(newPattern);
        this.patterns.set(newPattern.id, newPattern);
      }
    }

    return {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: data.timestamp,
      conversationId: data.conversationId,
      agentId: data.agentId,
      input: {
        message: data.message,
        context: data.context,
        previousExperiences: this.getRelevantExperiences(data.agentId, data.context)
      },
      response: {
        content: data.response,
        confidence: data.confidence,
        toolsUsed: data.toolsUsed || [],
        ragQueries: data.ragQueries || [],
        esiCalls: data.esiCalls || []
      },
      patterns: {
        detected: detectedPatterns,
        reinforced: reinforcedPatterns,
        newly_formed: newPatterns
      },
      effectiveness: {
        userSatisfaction: undefined, // Will be updated when feedback is received
        outcomeSuccess: undefined,
        followupRequired: undefined,
        implementationStatus: 'pending'
      }
    };
  }

  private matchesPattern(data: any, pattern: MemoryPattern): boolean {
    // Simple pattern matching - in production, this would use more sophisticated NLP
    const content = `${data.message} ${data.context} ${data.response}`.toLowerCase();
    
    // Check if any of the pattern contexts appear in the content
    return pattern.contexts.some(context => 
      content.includes(context.toLowerCase())
    );
  }

  private reinforcePattern(patternId: string, data: any) {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    // Increase frequency and confidence
    pattern.frequency += 1;
    pattern.confidence = Math.min(100, pattern.confidence + 1);
    pattern.lastSeen = data.timestamp;

    // Add example if we don't have too many
    if (pattern.examples.length < 10) {
      pattern.examples.push({
        conversationId: data.conversationId,
        timestamp: data.timestamp,
        context: data.context,
        trigger: data.message,
        response: data.response
      });
    }

    this.patterns.set(patternId, pattern);
  }

  private findSimilarMemories(message: string, context: string): ContextualMemory[] {
    const queryEmbedding = this.generateEmbedding(message + ' ' + context);
    const similarMemories: Array<{ memory: ContextualMemory; similarity: number }> = [];

    for (const memory of this.memories.values()) {
      if (memory.embedding) {
        const similarity = this.calculateCosineSimilarity(queryEmbedding, memory.embedding);
        if (similarity > this.config.similarityThreshold) {
          similarMemories.push({ memory, similarity });
        }
      }
    }

    return similarMemories
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20) // Top 20 similar memories
      .map(item => item.memory);
  }

  private formNewPattern(data: any, similarMemories: ContextualMemory[]): MemoryPattern | null {
    if (similarMemories.length < this.config.minOccurrences) return null;

    // Extract common themes and contexts
    const commonTags = this.findCommonTags(similarMemories);
    const commonContexts = this.extractCommonContexts(similarMemories);

    if (commonTags.length === 0) return null;

    const patternId = `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: patternId,
      type: this.determinePatternType(commonTags, commonContexts),
      pattern: commonTags.join(' + '),
      description: this.generatePatternDescription(commonTags, commonContexts),
      confidence: Math.min(80, similarMemories.length * 10), // Start with moderate confidence
      frequency: similarMemories.length,
      contexts: commonContexts,
      outcomes: this.extractCommonOutcomes(similarMemories),
      discoveredAt: data.timestamp,
      lastSeen: data.timestamp,
      examples: similarMemories.slice(0, 5).map(memory => ({
        conversationId: memory.id,
        timestamp: memory.metadata.timestamp,
        context: memory.content.context,
        trigger: memory.content.summary.split('->')[0] || '',
        response: memory.content.summary.split('->')[1] || '',
        outcome: memory.outcomes?.immediate[0]
      })),
      metadata: {
        discoveryMethod: 'similarity_analysis',
        minOccurrences: this.config.minOccurrences,
        similarityThreshold: this.config.similarityThreshold
      }
    };
  }

  private analyzePatterns() {
    if (!this.config.enabled) return;

    // Analyze pattern evolution and trends
    for (const [patternId, pattern] of this.patterns) {
      this.analyzePatternEvolution(pattern);
    }

    // Cluster related patterns
    this.clusterPatterns();

    // Clean up old or low-confidence patterns
    this.cleanupPatterns();
  }

  private generateInsights() {
    const newInsights: LearningInsight[] = [];

    // Analyze behavioral trends
    for (const agentId of this.getUniqueAgentIds()) {
      const behavioralTrends = this.analyzeBehavioralTrends(agentId);
      const insights = this.deriveInsightsFromTrends(agentId, behavioralTrends);
      newInsights.push(...insights);
    }

    // Analyze cross-agent patterns
    const crossAgentInsights = this.analyzeCrossAgentPatterns();
    newInsights.push(...crossAgentInsights);

    // Store new insights
    for (const insight of newInsights) {
      this.insights.set(insight.id, insight);
    }

    // Emit insights discovered event
    if (newInsights.length > 0) {
      this.eventBus.emit('insights:discovered', newInsights);
    }
  }

  private suggestAdaptations() {
    const adaptations: AdaptationSuggestion[] = [];

    // Analyze each agent's patterns for optimization opportunities
    for (const agentId of this.getUniqueAgentIds()) {
      const agentAdaptations = this.generateAgentAdaptations(agentId);
      adaptations.push(...agentAdaptations);
    }

    // Emit adaptation suggestions
    if (adaptations.length > 0) {
      this.eventBus.emit('adaptations:suggested', adaptations);
    }
  }

  // Public API methods
  public searchMemories(search: MemorySearch): ContextualMemory[] {
    let results = Array.from(this.memories.values());

    // Apply filters
    if (search.filters) {
      if (search.filters.agentId) {
        results = results.filter(m => m.agentId === search.filters!.agentId);
      }
      if (search.filters.type) {
        results = results.filter(m => m.type === search.filters!.type);
      }
      if (search.filters.tags) {
        results = results.filter(m => 
          search.filters!.tags!.some(tag => m.metadata.tags.includes(tag))
        );
      }
      if (search.filters.timeRange) {
        results = results.filter(m => 
          m.metadata.timestamp >= search.filters!.timeRange!.start &&
          m.metadata.timestamp <= search.filters!.timeRange!.end
        );
      }
      if (search.filters.importance) {
        results = results.filter(m => 
          m.metadata.importance >= search.filters!.importance!.min &&
          m.metadata.importance <= search.filters!.importance!.max
        );
      }
    }

    // If query provided, rank by similarity
    if (search.query) {
      const queryEmbedding = this.generateEmbedding(search.query);
      const scored = results.map(memory => ({
        memory,
        score: memory.embedding 
          ? this.calculateCosineSimilarity(queryEmbedding, memory.embedding)
          : 0
      }));
      
      results = scored
        .sort((a, b) => b.score - a.score)
        .map(item => item.memory);
    }

    // Apply limit
    const limit = search.options?.limit || 50;
    return results.slice(0, limit);
  }

  public getPatterns(agentId?: string): MemoryPattern[] {
    const patterns = Array.from(this.patterns.values());
    
    if (agentId) {
      return patterns.filter(pattern => 
        pattern.examples.some(ex => ex.conversationId.includes(agentId))
      );
    }
    
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  public getInsights(category?: string): LearningInsight[] {
    const insights = Array.from(this.insights.values());
    
    if (category) {
      return insights.filter(insight => insight.category === category);
    }
    
    return insights
      .filter(insight => insight.status === 'validated' || insight.confidence > this.config.learningThreshold)
      .sort((a, b) => b.confidence - a.confidence);
  }

  public getBehavioralTrends(agentId: string, timeframe?: { start: string; end: string }): BehavioralTrend | null {
    return this.analyzeBehavioralTrends(agentId, timeframe);
  }

  public clusterMemories(agentId?: string): MemoryCluster[] {
    const memories = agentId 
      ? Array.from(this.memories.values()).filter(m => m.agentId === agentId)
      : Array.from(this.memories.values());

    return this.performMemoryClustering(memories);
  }

  // Helper methods
  private generateSummary(message: string, response: string): string {
    // Simplified summary generation
    const messagePreview = message.length > 50 ? message.substring(0, 50) + '...' : message;
    const responsePreview = response.length > 50 ? response.substring(0, 50) + '...' : response;
    return `${messagePreview} -> ${responsePreview}`;
  }

  private extractTags(message: string, context: string): string[] {
    const text = `${message} ${context}`.toLowerCase();
    const tags: string[] = [];

    // Simple keyword extraction
    const keywords = [
      'mining', 'trading', 'combat', 'exploration', 'industry',
      'corp', 'corporation', 'alliance', 'recruitment', 'mission',
      'market', 'isk', 'profit', 'efficiency', 'strategy', 'optimization'
    ];

    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return tags;
  }

  private calculateImportance(data: any): number {
    let importance = 50; // Base importance

    // Increase for high confidence responses
    if (data.confidence > 80) importance += 20;
    
    // Increase for tool usage
    if (data.toolsUsed && data.toolsUsed.length > 0) importance += 15;
    
    // Increase for ESI calls (real-time data)
    if (data.esiCalls && data.esiCalls.length > 0) importance += 10;
    
    // Increase for RAG queries (knowledge access)
    if (data.ragQueries && data.ragQueries.length > 0) importance += 5;

    return Math.min(100, importance);
  }

  private generateEmbedding(text: string): number[] {
    // Simplified embedding generation - in production, use proper vector embedding
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(this.config.vectorDimensions).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[hash % this.config.vectorDimensions] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
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

  private getRelevantExperiences(agentId: string, context: string): string[] {
    const agentMemories = Array.from(this.memories.values())
      .filter(m => m.agentId === agentId);
    
    const contextEmbedding = this.generateEmbedding(context);
    
    return agentMemories
      .filter(m => m.embedding && 
        this.calculateCosineSimilarity(contextEmbedding, m.embedding) > 0.7
      )
      .sort((a, b) => b.metadata.importance - a.metadata.importance)
      .slice(0, 5)
      .map(m => m.content.summary);
  }

  private findCommonTags(memories: ContextualMemory[]): string[] {
    const tagCounts = new Map<string, number>();
    
    memories.forEach(memory => {
      memory.metadata.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .filter(([tag, count]) => count >= Math.max(2, memories.length * 0.3))
      .map(([tag]) => tag);
  }

  private extractCommonContexts(memories: ContextualMemory[]): string[] {
    // Extract common contextual elements
    const contexts = memories.map(m => m.content.context);
    // Simplified - in production, use more sophisticated context analysis
    return [...new Set(contexts)].slice(0, 5);
  }

  private extractCommonOutcomes(memories: ContextualMemory[]): string[] {
    const outcomes: string[] = [];
    memories.forEach(memory => {
      if (memory.outcomes) {
        outcomes.push(...memory.outcomes.immediate);
      }
    });
    return [...new Set(outcomes)];
  }

  private determinePatternType(tags: string[], contexts: string[]): MemoryPattern['type'] {
    if (tags.some(tag => ['strategy', 'optimization', 'efficiency'].includes(tag))) {
      return 'strategic';
    }
    if (tags.some(tag => ['behavior', 'response', 'action'].includes(tag))) {
      return 'behavioral';
    }
    if (contexts.some(ctx => ctx.includes('time') || ctx.includes('schedule'))) {
      return 'temporal';
    }
    if (tags.some(tag => ['outcome', 'result', 'success'].includes(tag))) {
      return 'outcome';
    }
    return 'context';
  }

  private generatePatternDescription(tags: string[], contexts: string[]): string {
    return `Pattern involving ${tags.join(', ')} in contexts: ${contexts.slice(0, 3).join(', ')}`;
  }

  private analyzePatternEvolution(pattern: MemoryPattern) {
    // Analyze how pattern has evolved over time
    // Implementation would track pattern changes and effectiveness
  }

  private clusterPatterns() {
    // Group related patterns together
    // Implementation would use clustering algorithms
  }

  private cleanupPatterns() {
    const now = new Date();
    const retentionPeriod = this.config.memoryRetention * 24 * 60 * 60 * 1000;
    
    for (const [patternId, pattern] of this.patterns) {
      const lastSeenTime = new Date(pattern.lastSeen).getTime();
      const age = now.getTime() - lastSeenTime;
      
      // Remove old patterns with low confidence
      if (age > retentionPeriod && pattern.confidence < 30) {
        this.patterns.delete(patternId);
      }
    }
  }

  private getUniqueAgentIds(): string[] {
    const agentIds = new Set<string>();
    for (const memory of this.memories.values()) {
      agentIds.add(memory.agentId);
    }
    return Array.from(agentIds);
  }

  private analyzeBehavioralTrends(agentId: string, timeframe?: { start: string; end: string }): BehavioralTrend | null {
    // Implementation would analyze agent behavior trends over time
    return null;
  }

  private deriveInsightsFromTrends(agentId: string, trends: BehavioralTrend | null): LearningInsight[] {
    // Implementation would derive actionable insights from behavioral trends
    return [];
  }

  private analyzeCrossAgentPatterns(): LearningInsight[] {
    // Implementation would analyze patterns across multiple agents
    return [];
  }

  private generateAgentAdaptations(agentId: string): AdaptationSuggestion[] {
    // Implementation would generate specific adaptation suggestions for an agent
    return [];
  }

  private performMemoryClustering(memories: ContextualMemory[]): MemoryCluster[] {
    // Implementation would cluster memories by similarity
    return [];
  }

  private recordDecision(data: any) {
    // Record agent decision-making patterns
  }

  private recordOutcome(data: any) {
    // Record outcome of agent actions
  }

  private incorporateFeedback(data: any) {
    // Incorporate user feedback into pattern learning
  }

  public destroy() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
    
    // Remove event listeners
    this.eventBus.off('conversation:message:processed', this.processMessage);
    this.eventBus.off('agent:decision:made', this.recordDecision);
    this.eventBus.off('outcome:observed', this.recordOutcome);
    this.eventBus.off('user:feedback:received', this.incorporateFeedback);
  }
}