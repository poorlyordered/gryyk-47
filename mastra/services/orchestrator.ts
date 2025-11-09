import { MemoryService, AgentExperience, StrategicDecision } from './memory-service';
import { 
  recruitingSpecialist, 
  economicSpecialist, 
  marketSpecialist, 
  miningSpecialist, 
  missionSpecialist 
} from '../agents/highsec';

// Agent registry
const AGENT_REGISTRY = {
  recruiting: recruitingSpecialist,
  economic: economicSpecialist,
  market: marketSpecialist,
  mining: miningSpecialist,
  mission: missionSpecialist
} as const;

export type AgentType = keyof typeof AGENT_REGISTRY;

export interface AgentResponse {
  agentType: AgentType;
  response: any;
  confidence: number;
  reasoning: string;
  executionTime: number;
}

export interface OrchestrationRequest {
  query: string;
  sessionId: string;
  corporationId: string;
  userContext?: Record<string, any>;
  requiredAgents?: AgentType[];
}

export interface OrchestrationResponse {
  agentResponses: AgentResponse[];
  synthesis: string;
  recommendations: string[];
  confidence: number;
  memoryStored: boolean;
}

export class GryykOrchestrator {
  private memoryService: MemoryService;

  constructor(memoryService: MemoryService) {
    this.memoryService = memoryService;
  }

  /**
   * Main orchestration method - analyzes query, consults specialists, and synthesizes response
   */
  async processQuery(request: OrchestrationRequest): Promise<OrchestrationResponse> {
    const startTime = Date.now();

    try {
      // 1. Analyze query and determine required agents
      const requiredAgents = request.requiredAgents || await this.analyzeQueryRequirements(request.query);
      
      // 2. Load relevant memories for each agent
      const agentMemories = await this.loadRelevantMemories(requiredAgents, request.query, request.corporationId);
      
      // 3. Execute specialists with memory context
      const agentResponses = await this.consultSpecialists(requiredAgents, request.query, agentMemories);
      
      // 4. Synthesize responses using Gryyk-47 logic
      const synthesis = await this.synthesizeResponses(request.query, agentResponses, request.corporationId);
      
      // 5. Store the decision experience
      const memoryStored = await this.storeDecisionExperience(request, agentResponses, synthesis);
      
      // 6. Generate final recommendations
      const recommendations = this.generateRecommendations(agentResponses, synthesis);
      
      return {
        agentResponses,
        synthesis: synthesis.gryykSynthesis,
        recommendations,
        confidence: this.calculateOverallConfidence(agentResponses),
        memoryStored
      };

    } catch (error) {
      console.error('Orchestration error:', error);
      throw new Error(`Gryyk-47 orchestration failed: ${error}`);
    }
  }

  /**
   * Analyze query to determine which specialist agents are needed
   */
  private async analyzeQueryRequirements(query: string): Promise<AgentType[]> {
    const queryLower = query.toLowerCase();
    const requiredAgents: AgentType[] = [];

    // Keyword-based agent selection (would be enhanced with ML in production)
    const agentKeywords = {
      recruiting: ['recruit', 'member', 'application', 'join', 'retention', 'onboard'],
      economic: ['isk', 'income', 'profit', 'investment', 'revenue', 'financial', 'economic'],
      market: ['market', 'trading', 'price', 'sell', 'buy', 'arbitrage', 'margin'],
      mining: ['mining', 'ore', 'asteroid', 'belt', 'yield', 'orca', 'miner'],
      mission: ['mission', 'agent', 'loyalty', 'standings', 'pve', 'ratting', 'fitting']
    };

    for (const [agent, keywords] of Object.entries(agentKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        requiredAgents.push(agent as AgentType);
      }
    }

    // Default agents for general queries
    if (requiredAgents.length === 0) {
      requiredAgents.push('economic'); // Economic specialist for general strategic advice
    }

    // Strategic queries should involve multiple specialists
    if (queryLower.includes('strategy') || queryLower.includes('plan') || queryLower.includes('overall')) {
      return ['recruiting', 'economic', 'market']; // Core strategic team
    }

    return requiredAgents;
  }

  /**
   * Load relevant memories for each required agent
   */
  private async loadRelevantMemories(
    agents: AgentType[], 
    query: string, 
    corporationId: string
  ): Promise<Record<AgentType, any[]>> {
    const memories: Record<string, any[]> = {};

    await Promise.all(agents.map(async (agent) => {
      try {
        const agentMemories = await this.memoryService.getAgentMemories(agent, query, corporationId, 5);
        memories[agent] = agentMemories;
      } catch (error) {
        console.warn(`Failed to load memories for ${agent}:`, error);
        memories[agent] = [];
      }
    }));

    return memories as Record<AgentType, any[]>;
  }

  /**
   * Execute specialist agents with memory context
   */
  private async consultSpecialists(
    agents: AgentType[], 
    query: string, 
    memories: Record<AgentType, any[]>
  ): Promise<AgentResponse[]> {
    const responses: AgentResponse[] = [];

    await Promise.all(agents.map(async (agentType) => {
      const startTime = Date.now();
      
      try {
        const agent = AGENT_REGISTRY[agentType];
        const agentMemories = memories[agentType] || [];
        
        // Format memories for agent context
        const memoryContext = agentMemories.map(mem => mem.content).join('\n\n');
        
        // Enhanced input with memory context
        const enhancedInput = {
          query,
          previousExperiences: memoryContext,
          memoryCount: agentMemories.length
        };

        // Execute agent (this would be the actual Mastra agent execution)
        const response = await this.simulateAgentExecution(agentType, enhancedInput);
        
        responses.push({
          agentType,
          response: response.result,
          confidence: response.confidence,
          reasoning: response.reasoning,
          executionTime: Date.now() - startTime
        });

      } catch (error) {
        console.error(`Agent ${agentType} execution failed:`, error);
        responses.push({
          agentType,
          response: { error: `Agent ${agentType} unavailable` },
          confidence: 0,
          reasoning: `Execution failed: ${error}`,
          executionTime: Date.now() - startTime
        });
      }
    }));

    return responses;
  }

  /**
   * Simulate agent execution (would be replaced with actual Mastra agent calls)
   */
  private async simulateAgentExecution(agentType: AgentType, input: any): Promise<{
    result: any;
    confidence: number;
    reasoning: string;
  }> {
    // This would be replaced with actual agent.run() calls
    return {
      result: {
        analysis: `${agentType} analysis of: ${input.query}`,
        recommendations: [`${agentType} recommendation 1`, `${agentType} recommendation 2`],
        memoryIntegration: input.memoryCount > 0 ? 'Used previous experiences' : 'No relevant memories'
      },
      confidence: 0.8,
      reasoning: `${agentType} provided domain-specific analysis based on query content`
    };
  }

  /**
   * Synthesize specialist responses using Gryyk-47 orchestrator logic
   */
  private async synthesizeResponses(
    query: string, 
    agentResponses: AgentResponse[], 
    corporationId: string
  ): Promise<StrategicDecision> {
    // Load strategic context from previous decisions
    const strategicContext = await this.memoryService.getStrategicContext(query, corporationId, 3);
    
    // Create synthesis (would use Grok-3 model in production)
    const synthesis = this.createSynthesis(query, agentResponses, strategicContext);
    
    // Format as strategic decision
    const decision: Omit<StrategicDecision, '_id'> = {
      decisionContext: query,
      agentsConsulted: agentResponses.map(r => r.agentType),
      agentRecommendations: agentResponses.map(r => ({
        agentType: r.agentType,
        recommendation: JSON.stringify(r.response),
        confidence: r.confidence,
        reasoning: r.reasoning
      })),
      gryykSynthesis: synthesis,
      finalDecision: this.extractFinalDecision(synthesis),
      corporationId,
      timestamp: new Date()
    };

    return decision as StrategicDecision;
  }

  /**
   * Create synthesis from agent responses
   */
  private createSynthesis(
    query: string, 
    responses: AgentResponse[], 
    context: StrategicDecision[]
  ): string {
    let synthesis = `Gryyk-47 Strategic Analysis for: "${query}"\n\n`;
    
    // Historical context
    if (context.length > 0) {
      synthesis += `Historical Context:\n`;
      context.forEach(ctx => {
        synthesis += `- Previous decision: ${ctx.finalDecision}\n`;
      });
      synthesis += '\n';
    }

    // Agent insights
    synthesis += `Specialist Analysis:\n`;
    responses.forEach(response => {
      synthesis += `\n${response.agentType.toUpperCase()} SPECIALIST:\n`;
      synthesis += `- Confidence: ${(response.confidence * 100).toFixed(0)}%\n`;
      synthesis += `- Analysis: ${response.reasoning}\n`;
      
      if (response.response.recommendations) {
        synthesis += `- Recommendations: ${response.response.recommendations.join(', ')}\n`;
      }
    });

    // Strategic synthesis
    synthesis += `\nSTRATEGIC SYNTHESIS:\n`;
    synthesis += `Based on specialist consultation, I recommend a coordinated approach that balances `;
    
    const agentTypes = responses.map(r => r.agentType);
    if (agentTypes.includes('economic') && agentTypes.includes('market')) {
      synthesis += `economic growth with market opportunities`;
    } else if (agentTypes.includes('recruiting') && agentTypes.includes('mining')) {
      synthesis += `member acquisition with operational capacity`;
    } else {
      synthesis += `the insights from our specialist teams`;
    }
    
    synthesis += `. This multi-perspective analysis ensures our decisions support long-term corporation success in Highsec space.`;

    return synthesis;
  }

  /**
   * Extract final decision from synthesis
   */
  private extractFinalDecision(synthesis: string): string {
    // Extract the key decision point (would be enhanced with NLP)
    if (synthesis.includes('recommend')) {
      const sentences = synthesis.split('. ');
      const decisionSentence = sentences.find(s => s.includes('recommend'));
      return decisionSentence ? decisionSentence.trim() : 'Proceed with specialist recommendations';
    }
    return 'Continue with current strategic approach';
  }

  /**
   * Store the complete decision experience in memory
   */
  private async storeDecisionExperience(
    request: OrchestrationRequest,
    responses: AgentResponse[],
    synthesis: StrategicDecision
  ): Promise<boolean> {
    try {
      // Store the strategic decision
      await this.memoryService.storeStrategicDecision(synthesis);

      // Store individual agent experiences
      await Promise.all(responses.map(async (response) => {
        const experience: Omit<AgentExperience, '_id'> = {
          agentType: response.agentType,
          sessionId: request.sessionId,
          experience: {
            situation: request.query,
            recommendation: JSON.stringify(response.response),
            effectiveness: undefined // Will be updated based on user feedback
          },
          tags: this.extractTags(request.query, response.agentType),
          corporationId: request.corporationId,
          timestamp: new Date()
        };

        await this.memoryService.storeAgentExperience(experience);
      }));

      return true;
    } catch (error) {
      console.error('Failed to store decision experience:', error);
      return false;
    }
  }

  /**
   * Extract relevant tags from query for memory indexing
   */
  private extractTags(query: string, agentType: AgentType): string[] {
    const queryLower = query.toLowerCase();
    const baseTags = [agentType];

    // Add context-specific tags
    const tagKeywords = {
      strategy: ['strategy', 'plan', 'strategic'],
      operations: ['operation', 'fleet', 'coordination'],
      growth: ['grow', 'expand', 'increase'],
      efficiency: ['efficiency', 'optimize', 'improve'],
      risk: ['risk', 'safety', 'secure'],
      newbro: ['new', 'beginner', 'novice', 'newbro']
    };

    for (const [tag, keywords] of Object.entries(tagKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        baseTags.push(tag);
      }
    }

    return baseTags;
  }

  /**
   * Generate actionable recommendations from responses
   */
  private generateRecommendations(responses: AgentResponse[], synthesis: StrategicDecision): string[] {
    const recommendations: string[] = [];

    // Extract recommendations from each agent
    responses.forEach(response => {
      if (response.response.recommendations) {
        recommendations.push(...response.response.recommendations);
      }
    });

    // Add synthesis-level recommendations
    if (responses.length > 1) {
      recommendations.push('Coordinate actions across specialist domains for maximum effectiveness');
    }

    // Add memory-based recommendations
    recommendations.push('Monitor outcomes and provide feedback to improve future recommendations');

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Calculate overall confidence from agent responses
   */
  private calculateOverallConfidence(responses: AgentResponse[]): number {
    if (responses.length === 0) return 0;
    
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    const consistencyBonus = responses.length > 1 ? 0.1 : 0; // Multi-agent consistency bonus
    
    return Math.min(1.0, avgConfidence + consistencyBonus);
  }

  /**
   * Update memory effectiveness based on user feedback
   */
  async updateMemoryEffectiveness(
    sessionId: string,
    effectiveness: number,
    outcome: string
  ): Promise<void> {
    // This would update all memories from the session
    // Implementation would track session-to-memory mappings
    console.log(`Updating memory effectiveness for session ${sessionId}: ${effectiveness}/10`);
  }

  /**
   * Get orchestrator statistics
   */
  async getStats(corporationId: string): Promise<{
    memoryStats: any;
    recentDecisions: number;
    agentUtilization: Record<string, number>;
  }> {
    const [memoryStats, recentDecisions] = await Promise.all([
      this.memoryService.getMemoryStats(corporationId),
      this.memoryService.getStrategicContext('', corporationId, 10)
    ]);

    // Calculate agent utilization from recent decisions
    const agentUtilization: Record<string, number> = {};
    recentDecisions.forEach(decision => {
      decision.agentsConsulted.forEach(agent => {
        agentUtilization[agent] = (agentUtilization[agent] || 0) + 1;
      });
    });

    return {
      memoryStats,
      recentDecisions: recentDecisions.length,
      agentUtilization
    };
  }
}

export default GryykOrchestrator;