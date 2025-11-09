import { Tool } from '@mastra/core';
import { eveDataPipeline } from './data-ingestion';
import { AGENT_QUERY_CATEGORIES } from './config';

/**
 * RAG-enhanced tool wrapper that provides context from the knowledge base
 */
export function createRAGEnhancedTool<T extends Record<string, any>>(
  originalTool: Tool<T>,
  agentType: keyof typeof AGENT_QUERY_CATEGORIES,
  _contextCategories?: string[]
): Tool<T & { query: string; useRAG?: boolean }> {
  return {
    ...originalTool,
    description: `${originalTool.description} (Enhanced with EVE knowledge base)`,
    parameters: {
      ...originalTool.parameters,
      query: {
        type: 'string',
        description: 'The main query or task description'
      },
      useRAG: {
        type: 'boolean',
        description: 'Whether to use RAG knowledge retrieval (default: true)',
        default: true
      }
    },
    execute: async (params: T & { query: string; useRAG?: boolean }) => {
      const { query, useRAG = true, ...originalParams } = params;
      
      let context = '';
      
      if (useRAG) {
        try {
          // Retrieve relevant context from knowledge base
          const ragResults = await eveDataPipeline.search(query, {
            agentType,
            topK: 3
          });

          if (ragResults.length > 0) {
            context = '\n\n--- Relevant EVE Knowledge ---\n' +
              ragResults.map(result => 
                `Source: ${result.document.metadata.source} (${result.document.metadata.category})\n` +
                `Relevance: ${(result.score * 100).toFixed(1)}%\n` +
                `Context: ${result.context}\n`
              ).join('\n---\n') +
              '\n--- End Knowledge Context ---\n\n';
          }
        } catch (error) {
          console.warn(`RAG retrieval failed for ${agentType}:`, error);
          // Continue without RAG context
        }
      }

      // Execute original tool with enhanced context
      const enhancedParams = {
        ...originalParams,
        additionalContext: context
      } as T;

      return await originalTool.execute(enhancedParams);
    }
  };
}

/**
 * Create a knowledge query tool for agents
 */
export function createKnowledgeQueryTool(agentType: keyof typeof AGENT_QUERY_CATEGORIES) {
  return {
    name: 'queryKnowledgeBase',
    description: `Search the EVE Online knowledge base for relevant information specific to ${agentType} operations`,
    parameters: {
      query: {
        type: 'string',
        description: 'The search query for EVE information'
      },
      category: {
        type: 'string',
        enum: ['ships', 'modules', 'market', 'strategy', 'api', 'corporation', 'mechanics'],
        description: 'Specific category to search within (optional)'
      },
      securityLevel: {
        type: 'string',
        enum: ['highsec', 'lowsec', 'nullsec', 'wormhole'],
        description: 'Security level focus for the search (optional)'
      }
    },
    execute: async ({ query, category, securityLevel }: {
      query: string;
      category?: string;
      securityLevel?: string;
    }) => {
      try {
        const results = await eveDataPipeline.search(query, {
          agentType,
          category: category as any,
          securityLevel: securityLevel as any,
          topK: 5
        });

        if (results.length === 0) {
          return {
            status: 'no_results',
            message: 'No relevant information found in the knowledge base',
            query,
            suggestions: [
              'Try broader search terms',
              'Check if the information category exists',
              'Consider searching without category filters'
            ]
          };
        }

        return {
          status: 'success',
          query,
          results: results.map(result => ({
            title: result.document.metadata.source,
            category: result.document.metadata.category,
            relevance: `${(result.score * 100).toFixed(1)}%`,
            context: result.context,
            metadata: {
              lastUpdated: result.document.metadata.lastUpdated,
              tags: result.document.metadata.tags,
              url: result.document.metadata.url
            }
          })),
          summary: `Found ${results.length} relevant documents with average relevance of ${
            (results.reduce((sum, r) => sum + r.score, 0) / results.length * 100).toFixed(1)
          }%`
        };
      } catch (error) {
        console.error(`Knowledge query failed for ${agentType}:`, error);
        return {
          status: 'error',
          message: 'Failed to search knowledge base',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  };
}

/**
 * Enhanced memory integration that stores successful RAG retrievals
 */
export async function storeRAGInteraction(
  agentType: keyof typeof AGENT_QUERY_CATEGORIES,
  query: string,
  ragResults: any[],
  finalResponse: string,
  success: boolean
) {
  try {
    // Store the interaction in corporation memory for learning
    await eveDataPipeline.ingestCorporationStrategy(
      `RAG Interaction - ${agentType}`,
      `
Query: ${query}
Agent: ${agentType}
Retrieved Documents: ${ragResults.length}
Success: ${success}
Response Quality: ${success ? 'Good' : 'Needs Improvement'}

RAG Results Summary:
${ragResults.map(r => `- ${r.document.metadata.category}: ${r.context.substring(0, 100)}...`).join('\n')}

Final Response:
${finalResponse.substring(0, 500)}...

Learning Notes:
- RAG retrieval ${ragResults.length > 0 ? 'provided' : 'failed to provide'} relevant context
- Agent response was ${success ? 'satisfactory' : 'unsatisfactory'}
- Consider ${ragResults.length < 2 ? 'expanding knowledge base' : 'refining search parameters'}
      `,
      'rag-interaction'
    );
  } catch (error) {
    console.warn('Failed to store RAG interaction:', error);
  }
}

/**
 * Knowledge base management tool for agents
 */
export function createKnowledgeManagementTool() {
  return {
    name: 'manageKnowledgeBase',
    description: 'Manage the EVE knowledge base by adding new information or updating existing data',
    parameters: {
      action: {
        type: 'string',
        enum: ['add_strategy', 'add_market_data', 'update_ship_info', 'get_stats'],
        description: 'The management action to perform'
      },
      data: {
        type: 'object',
        description: 'The data for the action (structure depends on action type)'
      }
    },
    execute: async ({ action, data }: { action: string; data: any }) => {
      try {
        switch (action) {
          case 'add_strategy': {
            await eveDataPipeline.ingestStrategyGuide({
              title: data.title,
              category: data.category,
              securityLevel: data.securityLevel,
              content: data.content,
              author: data.author || 'Corporation Member'
            });
            return { status: 'success', message: 'Strategy guide added to knowledge base' };
          }

          case 'add_market_data': {
            await eveDataPipeline.ingestMarketData([data]);
            return { status: 'success', message: 'Market data added to knowledge base' };
          }

          case 'update_ship_info': {
            await eveDataPipeline.ingestShipData([data]);
            return { status: 'success', message: 'Ship information updated in knowledge base' };
          }

          case 'get_stats': {
            const stats = await eveDataPipeline.getStats();
            return { status: 'success', stats };
          }

          default:
            return { status: 'error', message: 'Unknown action' };
        }
      } catch (error) {
        console.error('Knowledge management failed:', error);
        return {
          status: 'error',
          message: 'Failed to manage knowledge base',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  };
}

/**
 * Context injection utility for agent responses
 */
export function injectRAGContext(
  agentInstructions: string,
  agentType: keyof typeof AGENT_QUERY_CATEGORIES
): string {
  return `${agentInstructions}

RAG KNOWLEDGE INTEGRATION:
You have access to an EVE Online knowledge base through the queryKnowledgeBase tool. Use this to:

1. Retrieve specific ship, module, and market information
2. Access corporation strategies and best practices
3. Find relevant EVE mechanics and game data
4. Get recent market trends and pricing information

When answering queries:
- Always search the knowledge base first for relevant context
- Cite specific sources when using retrieved information
- Combine knowledge base data with your expertise
- If knowledge base lacks information, clearly state this limitation

Your knowledge base categories relevant to ${agentType}:
${AGENT_QUERY_CATEGORIES[agentType].map(cat => `- ${cat}`).join('\n')}

Use the RAG context to provide more accurate, data-driven recommendations that are grounded in actual EVE Online information and corporation experience.`;
}

/**
 * Initialize RAG system and populate with essential data
 */
export async function initializeRAGSystem(): Promise<void> {
  try {
    console.log('🔄 Initializing EVE RAG system...');
    await eveDataPipeline.initialize();
    console.log('✅ RAG system ready for agent integration');
  } catch (error) {
    console.error('❌ RAG system initialization failed:', error);
    throw error;
  }
}