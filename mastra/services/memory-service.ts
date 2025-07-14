import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// Memory data interfaces
export interface AgentExperience {
  _id?: ObjectId;
  agentType: 'recruiting' | 'economic' | 'market' | 'mining' | 'mission';
  timestamp: Date;
  sessionId: string;
  experience: {
    situation: string;
    recommendation: string;
    userFeedback?: string;
    outcome?: string;
    effectiveness?: number; // 1-10 scale
  };
  tags: string[];
  corporationId: string;
}

export interface StrategicDecision {
  _id?: ObjectId;
  timestamp: Date;
  decisionContext: string;
  agentsConsulted: string[];
  agentRecommendations: {
    agentType: string;
    recommendation: string;
    confidence: number;
    reasoning: string;
  }[];
  gryykSynthesis: string;
  finalDecision: string;
  outcome?: string;
  corporationId: string;
}

export interface MemoryPattern {
  _id?: ObjectId;
  timestamp: Date;
  pattern: string;
  sourceExperiences: ObjectId[];
  applicableAgents: string[];
  confidence: number;
  applications: number;
  corporationId: string;
}

export interface Memory {
  id: string;
  content: string;
  relevanceScore: number;
  timestamp: Date;
  tags: string[];
}

export class MemoryService {
  private client: MongoClient;
  private db: Db;
  private agentExperiences: Collection<AgentExperience>;
  private strategicDecisions: Collection<StrategicDecision>;
  private memoryPatterns: Collection<MemoryPattern>;

  constructor(mongoUri: string, dbName: string = 'gryyk47') {
    this.client = new MongoClient(mongoUri);
    this.db = this.client.db(dbName);
    this.agentExperiences = this.db.collection('agent_experiences');
    this.strategicDecisions = this.db.collection('strategic_decisions');
    this.memoryPatterns = this.db.collection('memory_patterns');
  }

  async connect(): Promise<void> {
    await this.client.connect();
    await this.createIndexes();
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  private async createIndexes(): Promise<void> {
    // Create indexes for efficient querying
    await this.agentExperiences.createIndex({ agentType: 1, timestamp: -1 });
    await this.agentExperiences.createIndex({ tags: 1 });
    await this.agentExperiences.createIndex({ corporationId: 1 });
    
    await this.strategicDecisions.createIndex({ timestamp: -1 });
    await this.strategicDecisions.createIndex({ corporationId: 1 });
    
    await this.memoryPatterns.createIndex({ applicableAgents: 1 });
    await this.memoryPatterns.createIndex({ confidence: -1 });
  }

  // Store new agent experience
  async storeAgentExperience(experience: Omit<AgentExperience, '_id'>): Promise<string> {
    const result = await this.agentExperiences.insertOne({
      ...experience,
      timestamp: new Date()
    });
    return result.insertedId.toString();
  }

  // Store strategic decision
  async storeStrategicDecision(decision: Omit<StrategicDecision, '_id'>): Promise<string> {
    const result = await this.strategicDecisions.insertOne({
      ...decision,
      timestamp: new Date()
    });
    return result.insertedId.toString();
  }

  // Retrieve relevant memories for an agent
  async getAgentMemories(
    agentType: string, 
    context: string, 
    corporationId: string,
    limit: number = 10
  ): Promise<Memory[]> {
    // Extract keywords from context for relevance matching
    const keywords = this.extractKeywords(context);
    
    // Find experiences with matching tags or keywords
    const experiences = await this.agentExperiences.find({
      agentType: agentType as AgentExperience['agentType'],
      corporationId,
      $or: [
        { tags: { $in: keywords } },
        { 'experience.situation': { $regex: keywords.join('|'), $options: 'i' } }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();

    // Convert to Memory format with relevance scoring
    return experiences.map(exp => ({
      id: exp._id!.toString(),
      content: this.formatExperienceForMemory(exp),
      relevanceScore: this.calculateRelevanceScore(exp, keywords),
      timestamp: exp.timestamp,
      tags: exp.tags
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Get strategic context for decision making
  async getStrategicContext(
    query: string, 
    corporationId: string,
    limit: number = 5
  ): Promise<StrategicDecision[]> {
    const keywords = this.extractKeywords(query);
    
    return await this.strategicDecisions.find({
      corporationId,
      $or: [
        { decisionContext: { $regex: keywords.join('|'), $options: 'i' } },
        { gryykSynthesis: { $regex: keywords.join('|'), $options: 'i' } }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  }

  // Store pattern identified by Gryyk-47
  async storePattern(pattern: Omit<MemoryPattern, '_id'>): Promise<string> {
    const result = await this.memoryPatterns.insertOne({
      ...pattern,
      timestamp: new Date()
    });
    return result.insertedId.toString();
  }

  // Get applicable patterns for agents
  async getApplicablePatterns(
    agentTypes: string[], 
    corporationId: string
  ): Promise<MemoryPattern[]> {
    return await this.memoryPatterns.find({
      corporationId,
      applicableAgents: { $in: agentTypes },
      confidence: { $gte: 0.7 } // Only high-confidence patterns
    })
    .sort({ confidence: -1, applications: -1 })
    .limit(5)
    .toArray();
  }

  // Update memory effectiveness based on outcomes
  async updateMemoryEffectiveness(
    memoryId: string, 
    effectiveness: number,
    outcome: string
  ): Promise<void> {
    await this.agentExperiences.updateOne(
      { _id: new ObjectId(memoryId) },
      { 
        $set: { 
          'experience.effectiveness': effectiveness,
          'experience.outcome': outcome
        }
      }
    );
  }

  // Pattern recognition - identify cross-agent insights
  async identifyPatterns(corporationId: string): Promise<MemoryPattern[]> {
    // This would implement pattern recognition algorithms
    // For now, return a simple implementation
    
    // Find recurring themes across agent experiences
    const pipeline = [
      { $match: { corporationId } },
      { $unwind: '$tags' },
      { $group: { 
        _id: '$tags', 
        count: { $sum: 1 }, 
        experiences: { $push: '$_id' },
        agents: { $addToSet: '$agentType' }
      }},
      { $match: { count: { $gte: 3 }, agents: { $size: { $gte: 2 } } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ];

    const commonPatterns = await this.agentExperiences.aggregate(pipeline).toArray();
    
    const patterns: MemoryPattern[] = [];
    for (const patternData of commonPatterns) {
      const pattern: MemoryPattern = {
        pattern: `Common theme: ${patternData._id}`,
        sourceExperiences: patternData.experiences,
        applicableAgents: patternData.agents,
        confidence: Math.min(0.9, patternData.count / 10), // Scale confidence
        applications: 0,
        corporationId,
        timestamp: new Date()
      };
      patterns.push(pattern);
    }

    return patterns;
  }

  // Helper method to extract keywords from context
  private extractKeywords(context: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return context
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 10); // Limit to top 10 keywords
  }

  // Calculate relevance score for memory retrieval
  private calculateRelevanceScore(experience: AgentExperience, keywords: string[]): number {
    let score = 0;
    
    // Tag matching
    const matchingTags = experience.tags.filter(tag => 
      keywords.some(keyword => tag.toLowerCase().includes(keyword))
    );
    score += matchingTags.length * 0.3;
    
    // Content matching
    const situationText = experience.experience.situation.toLowerCase();
    const keywordMatches = keywords.filter(keyword => 
      situationText.includes(keyword)
    );
    score += keywordMatches.length * 0.2;
    
    // Recency bonus (more recent = higher score)
    const daysSince = (Date.now() - experience.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, (30 - daysSince) / 30) * 0.3; // 30-day sliding scale
    
    // Effectiveness bonus
    if (experience.experience.effectiveness) {
      score += (experience.experience.effectiveness / 10) * 0.2;
    }
    
    return Math.min(1.0, score); // Cap at 1.0
  }

  // Format experience for memory context
  private formatExperienceForMemory(experience: AgentExperience): string {
    let content = `Situation: ${experience.experience.situation}\n`;
    content += `Recommendation: ${experience.experience.recommendation}\n`;
    
    if (experience.experience.outcome) {
      content += `Outcome: ${experience.experience.outcome}\n`;
    }
    
    if (experience.experience.effectiveness) {
      content += `Effectiveness: ${experience.experience.effectiveness}/10\n`;
    }
    
    content += `Tags: ${experience.tags.join(', ')}`;
    
    return content;
  }

  // Get memory statistics for monitoring
  async getMemoryStats(corporationId: string): Promise<{
    totalExperiences: number;
    totalDecisions: number;
    totalPatterns: number;
    agentBreakdown: Record<string, number>;
  }> {
    const [totalExperiences, totalDecisions, totalPatterns, agentBreakdown] = await Promise.all([
      this.agentExperiences.countDocuments({ corporationId }),
      this.strategicDecisions.countDocuments({ corporationId }),
      this.memoryPatterns.countDocuments({ corporationId }),
      this.agentExperiences.aggregate([
        { $match: { corporationId } },
        { $group: { _id: '$agentType', count: { $sum: 1 } } }
      ]).toArray()
    ]);

    const breakdown: Record<string, number> = {};
    agentBreakdown.forEach(item => {
      breakdown[item._id] = item.count;
    });

    return {
      totalExperiences,
      totalDecisions,
      totalPatterns,
      agentBreakdown: breakdown
    };
  }
}

export default MemoryService;