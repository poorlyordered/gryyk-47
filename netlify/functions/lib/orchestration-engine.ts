/**
 * Gryyk-47 Orchestration Engine
 *
 * Implements parallel multi-agent orchestration with:
 * - Router pattern for specialist selection
 * - Parallel agent execution
 * - Memory-driven learning
 * - Strategic synthesis
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { MongoClient } from 'mongodb';
import type { AgentExperience, StrategicDecision } from '../../../mastra/services/memory-service';
import { fetchMERContext, formatMERContext } from './mer-data-fetcher';

// Configure OpenRouter
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

// Specialist agent types
export type SpecialistType = 'recruiting' | 'economic' | 'market' | 'mining' | 'mission';

// Agent response interface
export interface SpecialistResponse {
  specialist: SpecialistType;
  analysis: string;
  recommendations: string[];
  confidence: number;
  reasoning: string;
  executionTime: number;
}

// Orchestration request
export interface OrchestrationRequest {
  query: string;
  sessionId: string;
  corporationId: string;
  conversationHistory?: any[];
}

// Orchestration response
export interface OrchestrationResponse {
  response: string;
  specialistsConsulted: SpecialistType[];
  confidence: number;
  memories: number;
  sessionId: string;
}

/**
 * Router: Determines which specialists should be consulted for a given query
 */
export async function routeQuery(query: string): Promise<SpecialistType[]> {
  const queryLower = query.toLowerCase();
  const specialists: SpecialistType[] = [];

  // Keyword-based routing (fast, no LLM call needed)
  const keywords: Record<SpecialistType, string[]> = {
    recruiting: ['recruit', 'member', 'retention', 'onboard', 'application', 'join', 'leave', 'activity'],
    economic: ['isk', 'income', 'profit', 'revenue', 'financial', 'wealth', 'money', 'earnings'],
    market: ['market', 'trading', 'trade', 'price', 'sell', 'buy', 'arbitrage', 'margin', 'orders'],
    mining: ['mining', 'mine', 'ore', 'asteroid', 'belt', 'yield', 'orca', 'miner', 'extraction'],
    mission: ['mission', 'agent', 'loyalty', 'standings', 'pve', 'rat', 'fitting', 'combat']
  };

  for (const [specialist, words] of Object.entries(keywords)) {
    if (words.some(word => queryLower.includes(word))) {
      specialists.push(specialist as SpecialistType);
    }
  }

  // Strategic queries consult multiple specialists
  const strategicKeywords = ['strategy', 'plan', 'overall', 'improve', 'optimize', 'grow'];
  if (strategicKeywords.some(kw => queryLower.includes(kw))) {
    // For strategic questions, consult core team
    return ['economic', 'recruiting', 'market'];
  }

  // If no specialists matched, default to economic for general advice
  if (specialists.length === 0) {
    specialists.push('economic');
  }

  return specialists;
}

/**
 * Get relevant memories for a specialist
 */
export async function getSpecialistMemories(
  specialist: SpecialistType,
  query: string,
  corporationId: string,
  mongoUri: string,
  limit: number = 3
): Promise<AgentExperience[]> {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('gryyk47');

    // Extract keywords from query
    const keywords = query.toLowerCase()
      .split(' ')
      .filter(word => word.length > 4);

    // Find relevant past experiences
    const memories = await db.collection<AgentExperience>('agent_experiences')
      .find({
        agentType: specialist,
        corporationId,
        'experience.effectiveness': { $gte: 7 }, // Only successful experiences
        $or: [
          { tags: { $in: keywords } },
          { 'experience.situation': { $regex: keywords.join('|'), $options: 'i' } }
        ]
      })
      .sort({ 'experience.effectiveness': -1, timestamp: -1 })
      .limit(limit)
      .toArray();

    return memories;

  } catch (error) {
    console.warn(`Failed to fetch memories for ${specialist}:`, error);
    return [];
  } finally {
    await client.close();
  }
}

/**
 * Consult a single specialist agent
 */
export async function consultSpecialist(
  specialist: SpecialistType,
  query: string,
  corporationContext: any,
  memories: AgentExperience[],
  mongoUri: string
): Promise<SpecialistResponse> {
  const startTime = Date.now();

  // Specialist system prompts
  const prompts: Record<SpecialistType, string> = {
    recruiting: `You are the Recruiting Specialist for EVE Online Highsec corporations.

Your expertise includes:
- Recruitment strategy development for Highsec operations
- Application screening and candidate evaluation
- Member retention strategies and onboarding optimization
- Activity tracking and engagement planning
- Newbro training program development

Focus on:
- Building supportive communities for new and returning players
- Long-term member retention over rapid expansion
- Security-conscious recruiting (avoiding corp theft)
- Member progression and advancement opportunities`,

    economic: `You are the Economic Specialist for EVE Online Highsec corporations.

Your expertise includes:
- Income stream identification and optimization
- Investment opportunity evaluation and risk assessment
- Financial planning and budget management
- Resource allocation optimization
- Passive income development for Highsec space

Focus on:
- Safe, steady income streams over high-risk ventures
- Scalable activities that benefit from corporation cooperation
- Sustainable long-term wealth generation
- Member engagement through shared economic success`,

    market: `You are the Market Specialist for EVE Online.

Your expertise includes:
- Market trend analysis and price forecasting
- Trading opportunity identification
- Margin analysis and profit optimization
- Market manipulation detection
- Station trading and regional arbitrage

Focus on:
- Highsec market opportunities (Jita, Amarr, etc.)
- Risk-appropriate trading strategies
- Market timing and volume analysis
- Competitive advantage in trading`,

    mining: `You are the Mining Operations Specialist for EVE Online Highsec.

Your expertise includes:
- Mining fleet coordination and optimization
- Yield calculations and efficiency improvements
- Ore selection and pricing analysis
- Fleet composition (Orcas, haulers, miners)
- Moon mining and ice harvesting

Focus on:
- Highsec belt mining and moon operations
- Safety and anti-ganking measures
- Fleet logistics and ore buyback programs
- Member participation and profit sharing`,

    mission: `You are the Mission Running Specialist for EVE Online Highsec.

Your expertise includes:
- PvE mission optimization and efficiency
- Ship fitting recommendations for mission running
- Loyalty point (LP) optimization strategies
- Agent selection and standings management
- Blitz strategies and time optimization

Focus on:
- Highsec Level 4 missions
- ISK/hour and LP/hour optimization
- Safe and efficient mission completion
- Progression paths for new mission runners`
  };

  // Fetch MER context for relevant specialists
  const merContext = await fetchMERContext(specialist, mongoUri);
  const merData = formatMERContext(merContext);

  // Format memory context
  const memoryContext = memories.length > 0
    ? `\n\nPREVIOUS SUCCESSFUL EXPERIENCES:\n${memories.map(m =>
        `- ${m.experience.situation}\n  Recommendation: ${m.experience.recommendation}\n  Outcome: ${m.experience.outcome || 'Pending'} (Effectiveness: ${m.experience.effectiveness}/10)`
      ).join('\n\n')}`
    : '';

  // Format corporation context
  const corpContext = corporationContext
    ? `\n\nCORPORATION CONTEXT:\n${JSON.stringify(corporationContext, null, 2)}`
    : '';

  const fullPrompt = `${prompts[specialist]}${merData}${memoryContext}${corpContext}

USER QUERY: "${query}"

Provide your analysis in the following JSON format:
{
  "analysis": "Brief 2-3 sentence analysis of the situation",
  "recommendations": ["Specific actionable recommendation 1", "Recommendation 2", "Recommendation 3"],
  "confidence": 0.85,
  "reasoning": "Brief explanation of your analysis approach"
}`;

  try {
    const result = await generateText({
      model: openrouter('x-ai/grok-4-fast'),
      prompt: fullPrompt,
      temperature: 0.7,
      maxTokens: 1000
    });

    // Parse JSON response
    const parsed = JSON.parse(result.text);

    return {
      specialist,
      analysis: parsed.analysis,
      recommendations: parsed.recommendations || [],
      confidence: parsed.confidence || 0.7,
      reasoning: parsed.reasoning || 'Analysis completed',
      executionTime: Date.now() - startTime
    };

  } catch (error) {
    console.error(`Specialist ${specialist} execution failed:`, error);

    // Fallback response
    return {
      specialist,
      analysis: `${specialist} specialist encountered an error during analysis.`,
      recommendations: [],
      confidence: 0,
      reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      executionTime: Date.now() - startTime
    };
  }
}

/**
 * Synthesize specialist responses using Gryyk-47
 */
export async function synthesizeResponses(
  query: string,
  specialistResponses: SpecialistResponse[],
  corporationContext: any
): Promise<string> {
  // If no specialists were consulted (error case), provide simple response
  if (specialistResponses.length === 0) {
    const result = await generateText({
      model: openrouter('x-ai/grok-4-fast'),
      prompt: `You are Gryyk-47, an EVE Online strategic advisor.\n\nUser query: ${query}\n\nProvide helpful strategic advice for Highsec operations.`,
      temperature: 0.8,
      maxTokens: 1500
    });
    return result.text;
  }

  // Build specialist summary
  const specialistSummary = specialistResponses.map(sr =>
    `**${sr.specialist.toUpperCase()} SPECIALIST** (${(sr.confidence * 100).toFixed(0)}% confidence):\n` +
    `Analysis: ${sr.analysis}\n` +
    `Recommendations:\n${sr.recommendations.map(r => `  • ${r}`).join('\n')}`
  ).join('\n\n');

  const corpContextText = corporationContext
    ? `\n\nCorporation: ${corporationContext.name || 'Unknown'}\nMembers: ${corporationContext.memberCount || 'Unknown'}\n`
    : '';

  const synthesisPrompt = `You are Gryyk-47, the supreme commander and strategic advisor for EVE Online Highsec corporations.${corpContextText}

You have consulted your specialist council regarding the following query:
"${query}"

SPECIALIST COUNCIL REPORTS:
${specialistSummary}

Your task:
1. Synthesize these specialist insights into a cohesive strategic response
2. Provide clear, prioritized action steps
3. Explain how the different specialist perspectives complement each other
4. Give your personal strategic assessment as Gryyk-47

Write as a seasoned EVE Online commander addressing corporation leadership. Be decisive, strategic, and actionable. Speak in first person as Gryyk-47.

Format your response with clear sections but natural prose. Include specific recommendations from specialists when relevant.`;

  try {
    const result = await generateText({
      model: openrouter('x-ai/grok-4-fast'),
      prompt: synthesisPrompt,
      temperature: 0.75,
      maxTokens: 2000
    });

    return result.text;

  } catch (error) {
    console.error('Synthesis failed:', error);

    // Fallback: concatenate specialist responses
    return `Based on consultation with ${specialistResponses.length} specialists:\n\n${specialistSummary}`;
  }
}

/**
 * Store orchestration decision in memory
 */
export async function storeOrchestrationMemory(
  sessionId: string,
  corporationId: string,
  query: string,
  specialistResponses: SpecialistResponse[],
  synthesis: string,
  mongoUri: string
): Promise<void> {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('gryyk47');

    // Store strategic decision
    const decision: Omit<StrategicDecision, '_id'> = {
      timestamp: new Date(),
      decisionContext: query,
      agentsConsulted: specialistResponses.map(sr => sr.specialist),
      agentRecommendations: specialistResponses.map(sr => ({
        agentType: sr.specialist,
        recommendation: JSON.stringify(sr.recommendations),
        confidence: sr.confidence,
        reasoning: sr.reasoning
      })),
      gryykSynthesis: synthesis,
      finalDecision: extractKeyDecision(synthesis),
      corporationId
    };

    await db.collection<StrategicDecision>('strategic_decisions').insertOne(decision);

    // Store individual agent experiences
    for (const response of specialistResponses) {
      const experience: Omit<AgentExperience, '_id'> = {
        agentType: response.specialist,
        timestamp: new Date(),
        sessionId,
        experience: {
          situation: query,
          recommendation: response.recommendations.join('; '),
          effectiveness: undefined // Will be updated based on user feedback
        },
        tags: extractTags(query, response.specialist),
        corporationId
      };

      await db.collection<AgentExperience>('agent_experiences').insertOne(experience);
    }

    console.log(`✅ Stored orchestration memory for session ${sessionId}`);

  } catch (error) {
    console.error('Failed to store orchestration memory:', error);
  } finally {
    await client.close();
  }
}

/**
 * Extract key decision from synthesis text
 */
function extractKeyDecision(synthesis: string): string {
  // Find sentences with "recommend" or "should"
  const sentences = synthesis.split(/[.!?]+/).map(s => s.trim());
  const decisionSentence = sentences.find(s =>
    s.toLowerCase().includes('recommend') ||
    s.toLowerCase().includes('should')
  );

  if (decisionSentence && decisionSentence.length < 200) {
    return decisionSentence;
  }

  // Fallback: take first substantial sentence
  const firstSentence = sentences.find(s => s.length > 20);
  return firstSentence || 'Strategic guidance provided';
}

/**
 * Extract tags from query for memory indexing
 */
function extractTags(query: string, specialist: SpecialistType): string[] {
  const queryLower = query.toLowerCase();
  const tags: string[] = [specialist];

  const tagKeywords: Record<string, string[]> = {
    strategy: ['strategy', 'plan', 'strategic', 'planning'],
    operations: ['operation', 'fleet', 'coordinate', 'organize'],
    growth: ['grow', 'expand', 'increase', 'scale'],
    efficiency: ['efficiency', 'optimize', 'improve', 'better'],
    risk: ['risk', 'safety', 'secure', 'danger'],
    newbro: ['new', 'beginner', 'novice', 'newbro', 'learning']
  };

  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(kw => queryLower.includes(kw))) {
      tags.push(tag);
    }
  }

  return tags;
}

/**
 * Main orchestration engine
 */
export async function orchestrate(
  request: OrchestrationRequest,
  mongoUri: string
): Promise<OrchestrationResponse> {
  console.log(`🎯 Orchestrating query: "${request.query}"`);

  // Step 1: Route query to determine required specialists
  const specialists = await routeQuery(request.query);
  console.log(`📋 Specialists selected: ${specialists.join(', ')}`);

  // Step 2: Get corporation context (simplified for now)
  const corporationContext = {
    corporationId: request.corporationId,
    // TODO: Fetch from Strategic Matrix or ESI
  };

  // Step 3: Fetch memories for each specialist in parallel
  const memoriesPromises = specialists.map(specialist =>
    getSpecialistMemories(specialist, request.query, request.corporationId, mongoUri)
  );
  const memoriesResults = await Promise.all(memoriesPromises);
  const memoriesMap = Object.fromEntries(
    specialists.map((specialist, index) => [specialist, memoriesResults[index]])
  );

  const totalMemories = memoriesResults.reduce((sum, memories) => sum + memories.length, 0);
  console.log(`🧠 Loaded ${totalMemories} relevant memories`);

  // Step 4: Consult all specialists in PARALLEL
  const specialistPromises = specialists.map(specialist =>
    consultSpecialist(
      specialist,
      request.query,
      corporationContext,
      memoriesMap[specialist] || [],
      mongoUri
    )
  );

  const specialistResponses = await Promise.all(specialistPromises);
  const avgExecutionTime = specialistResponses.reduce((sum, sr) => sum + sr.executionTime, 0) / specialistResponses.length;
  console.log(`⚡ Specialists completed in avg ${avgExecutionTime.toFixed(0)}ms (parallel execution)`);

  // Step 5: Gryyk-47 synthesizes the responses
  const synthesis = await synthesizeResponses(request.query, specialistResponses, corporationContext);
  console.log(`✨ Synthesis complete`);

  // Step 6: Store in memory for future learning
  await storeOrchestrationMemory(
    request.sessionId,
    request.corporationId,
    request.query,
    specialistResponses,
    synthesis,
    mongoUri
  );

  // Step 7: Calculate overall confidence
  const avgConfidence = specialistResponses.reduce((sum, sr) => sum + sr.confidence, 0) / specialistResponses.length;
  const confidence = Math.min(1.0, avgConfidence + (specialistResponses.length > 1 ? 0.1 : 0));

  return {
    response: synthesis,
    specialistsConsulted: specialists,
    confidence,
    memories: totalMemories,
    sessionId: request.sessionId
  };
}
