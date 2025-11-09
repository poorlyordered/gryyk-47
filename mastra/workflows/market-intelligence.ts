import { Workflow } from '@mastra/core';
import { z } from 'zod';

// Market intelligence workflow input schema
const MarketIntelligenceInputSchema = z.object({
  targetItems: z.array(z.string()).describe('Items to analyze'),
  regions: z.array(z.string()).optional().default(['The Forge']),
  analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed'),
  investmentBudget: z.number().optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).default('medium')
});

export const marketIntelligenceWorkflow = new Workflow({
  name: 'market-intelligence',
  triggerSchema: MarketIntelligenceInputSchema,
  
  steps: [
    // Step 1: Analyze market trends for each target item
    {
      id: 'analyze-market-trends',
      agent: 'market-analyst',
      action: 'analyzeMarketTrends',
      input: (trigger) => ({
        itemName: trigger.targetItems[0], // Start with first item
        region: trigger.regions[0],
        timeframe: 'weekly',
        pricePoint: undefined
      })
    },
    
    // Step 2: Evaluate investment opportunities
    {
      id: 'evaluate-investments',
      agent: 'market-analyst',
      action: 'evaluateInvestment',
      input: (trigger, context) => ({
        investmentType: 'trading',
        budget: trigger.investmentBudget || 500000000, // 500M ISK default
        riskTolerance: trigger.riskTolerance,
        timeHorizon: 'medium'
      })
    },
    
    // Step 3: Supply chain optimization analysis
    {
      id: 'supply-chain-analysis',
      agent: 'market-analyst',
      action: 'optimizeSupplyChain',
      input: (trigger, context) => ({
        productionGoals: `Production and trading of: ${trigger.targetItems.join(', ')}`,
        currentAssets: 'Current corporation manufacturing and trading assets',
        targetMarkets: trigger.regions.join(', ')
      })
    },
    
    // Step 4: Strategic recommendations synthesis
    {
      id: 'strategic-synthesis',
      agent: 'strategic-advisor',
      action: 'analyzeStrategicSituation',
      input: (trigger, context) => {
        const marketTrends = context['analyze-market-trends']?.forecast || '';
        const investmentOpportunities = context['evaluate-investments']?.recommendations?.join(', ') || '';
        const supplyChainOptimization = context['supply-chain-analysis']?.recommendations?.join(', ') || '';
        
        return {
          situation: `Market intelligence analysis for ${trigger.targetItems.join(', ')}`,
          assets: `Market trends: ${marketTrends}\nInvestment opportunities: ${investmentOpportunities}\nSupply chain: ${supplyChainOptimization}`,
          objectives: `Maximize profitability from ${trigger.targetItems.join(', ')} market activities`,
          timeframe: 'short-term'
        };
      }
    }
  ]
});

export default marketIntelligenceWorkflow;