export interface MemoryPattern {
  id: string;
  type: 'behavioral' | 'strategic' | 'temporal' | 'context' | 'outcome';
  pattern: string;
  description: string;
  confidence: number;
  frequency: number;
  contexts: string[];
  outcomes: string[];
  discoveredAt: string;
  lastSeen: string;
  examples: Array<{
    conversationId: string;
    timestamp: string;
    context: string;
    trigger: string;
    response: string;
    outcome?: string;
  }>;
  metadata: Record<string, any>;
}

export interface PatternAnalysis {
  id: string;
  timestamp: string;
  conversationId: string;
  agentId: string;
  input: {
    message: string;
    context: string;
    previousExperiences: string[];
  };
  response: {
    content: string;
    confidence: number;
    toolsUsed: string[];
    ragQueries: string[];
    esiCalls: string[];
  };
  patterns: {
    detected: MemoryPattern[];
    reinforced: string[];
    newly_formed: MemoryPattern[];
  };
  effectiveness: {
    userSatisfaction?: number;
    outcomeSuccess?: boolean;
    followupRequired?: boolean;
    implementationStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
  };
}

export interface ContextualMemory {
  id: string;
  type: 'conversation' | 'decision' | 'outcome' | 'learning';
  agentId: string;
  content: {
    summary: string;
    details: string;
    context: string;
    participants: string[];
  };
  metadata: {
    timestamp: string;
    tags: string[];
    importance: number; // 0-100
    confidence: number; // 0-100
    linkedMemories: string[];
    retrievalCount: number;
    lastAccessed: string;
  };
  outcomes?: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    lessons: string[];
  };
  embedding?: number[]; // Vector embedding for similarity search
}

export interface LearningInsight {
  id: string;
  category: 'strategy' | 'behavior' | 'preference' | 'outcome' | 'error';
  title: string;
  description: string;
  confidence: number;
  evidence: Array<{
    memoryId: string;
    timestamp: string;
    context: string;
    supporting_data: any;
  }>;
  implications: string[];
  recommendations: string[];
  applicableAgents: string[];
  discoveredAt: string;
  validatedAt?: string;
  status: 'hypothesis' | 'validated' | 'deprecated';
  metadata: Record<string, any>;
}

export interface BehavioralTrend {
  agentId: string;
  timeframe: {
    start: string;
    end: string;
  };
  trends: Array<{
    aspect: string;
    direction: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
    magnitude: number;
    confidence: number;
    description: string;
    supporting_patterns: MemoryPattern[];
  }>;
  adaptations: Array<{
    trigger: string;
    adaptation: string;
    effectiveness: number;
    context: string;
  }>;
  predictions: Array<{
    scenario: string;
    likelihood: number;
    expected_behavior: string;
    confidence: number;
  }>;
}

export interface PatternRecognitionConfig {
  enabled: boolean;
  sensitivity: number; // 0-100, how sensitive to detect patterns
  minOccurrences: number; // Minimum occurrences to form a pattern
  memoryRetention: number; // Days to retain memories
  learningThreshold: number; // Confidence threshold for learning insights
  vectorDimensions: number; // Dimensions for embeddings
  similarityThreshold: number; // Threshold for memory similarity
  patternTypes: {
    behavioral: boolean;
    strategic: boolean;
    temporal: boolean;
    context: boolean;
    outcome: boolean;
  };
  autoAdaptation: {
    enabled: boolean;
    agentUpdates: boolean;
    promptModification: boolean;
    toolOptimization: boolean;
  };
}

export interface MemorySearch {
  query: string;
  filters?: {
    agentId?: string;
    type?: ContextualMemory['type'];
    tags?: string[];
    timeRange?: {
      start: string;
      end: string;
    };
    importance?: {
      min: number;
      max: number;
    };
    confidence?: {
      min: number;
      max: number;
    };
  };
  options?: {
    limit?: number;
    includeEmbeddings?: boolean;
    includeSimilar?: boolean;
    similarityThreshold?: number;
  };
}

export interface MemoryCluster {
  id: string;
  centroid: number[];
  memories: ContextualMemory[];
  commonThemes: string[];
  averageImportance: number;
  timeSpan: {
    start: string;
    end: string;
  };
  insights: LearningInsight[];
  representativeMemory: ContextualMemory;
}

export interface AdaptationSuggestion {
  id: string;
  agentId: string;
  type: 'prompt_modification' | 'tool_optimization' | 'behavior_adjustment' | 'knowledge_update';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rationale: {
    patterns: MemoryPattern[];
    insights: LearningInsight[];
    evidence: string[];
  };
  proposedChanges: {
    before: string;
    after: string;
    diff: string;
  };
  impact: {
    expectedImprovement: string;
    potentialRisks: string[];
    affectedCapabilities: string[];
  };
  validation: {
    testCases: Array<{
      scenario: string;
      expectedOutcome: string;
      successCriteria: string;
    }>;
    rollbackPlan: string;
    monitoringRequirements: string[];
  };
  status: 'pending' | 'approved' | 'testing' | 'deployed' | 'rejected';
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  deployedAt?: string;
}