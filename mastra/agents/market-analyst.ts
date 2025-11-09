import { Agent } from '@mastra/core';
import { z } from 'zod';
import { EVE_AI_MODELS } from '../config/models';

// Market analysis input schemas
const MarketAnalysisSchema = z.object({
  itemName: z.string().describe('Item or ship type to analyze'),
  region: z.string().optional().describe('EVE region for analysis'),
  timeframe: z.enum(['daily', 'weekly', 'monthly']).optional().default('weekly'),
  pricePoint: z.number().optional().describe('Target price point for comparison')
});

const InvestmentAnalysisSchema = z.object({
  investmentType: z.enum(['manufacturing', 'trading', 'mining', 'research']),
  budget: z.number().describe('Available ISK for investment'),
  riskTolerance: z.enum(['low', 'medium', 'high']),
  timeHorizon: z.enum(['short', 'medium', 'long'])
});

export const marketAnalystAgent = new Agent({
  name: 'market-analyst',
  instructions: `You are Gryyk-47's Market Analyst, an expert in EVE Online economic analysis and market intelligence.

Your specializations include:
- Market trend analysis and price prediction
- Investment opportunity identification
- Supply chain optimization
- Manufacturing cost analysis
- Trade route planning and profitability assessment
- Resource allocation for maximum ROI
- Risk assessment for economic ventures

When providing market analysis:
1. Use data-driven insights and quantitative analysis
2. Consider market volatility and external factors
3. Account for corporation's current assets and capabilities
4. Provide clear ROI projections and risk assessments
5. Consider regional variations and trade hub differences
6. Factor in competition and market saturation
7. Always include actionable recommendations

Your responses should be analytical, precise, and focused on maximizing economic returns while managing risk.`,

  model: {
    provider: 'openrouter',
    name: EVE_AI_MODELS.analytical,
    toolChoice: 'auto'
  },

  tools: {
    analyzeMarketTrends: {
      description: 'Analyze market trends for specific items or categories',
      parameters: MarketAnalysisSchema,
      execute: async ({ itemName, region = 'The Forge', timeframe, pricePoint }) => {
        return {
          item: itemName,
          region: region,
          currentPrice: 'Would fetch from EVE ESI API',
          priceHistory: `${timeframe} price trend analysis`,
          volatility: 'Price volatility assessment',
          volumeAnalysis: 'Trading volume trends',
          supplyDemand: 'Supply and demand balance',
          forecast: 'Price projection for next period',
          recommendations: [
            'Buy/sell recommendations',
            'Optimal trading strategies',
            'Risk mitigation approaches'
          ],
          profitability: 'Estimated profit margins and ROI'
        };
      }
    },

    evaluateInvestment: {
      description: 'Evaluate investment opportunities and provide recommendations',
      parameters: InvestmentAnalysisSchema,
      execute: async ({ investmentType, budget, riskTolerance, timeHorizon }) => {
        return {
          investmentType: investmentType,
          budget: budget,
          riskAssessment: `${riskTolerance} risk investment analysis`,
          projectedROI: 'Expected return on investment',
          breakEvenPoint: 'Time to break even',
          capitalRequirements: 'Initial and ongoing capital needs',
          marketOpportunities: 'Current market opportunities',
          competitiveAnalysis: 'Competition and market positioning',
          recommendations: [
            'Specific investment recommendations',
            'Portfolio diversification suggestions',
            'Risk management strategies'
          ],
          implementationPlan: 'Step-by-step implementation guide'
        };
      }
    },

    optimizeSupplyChain: {
      description: 'Analyze and optimize supply chain efficiency',
      parameters: z.object({
        productionGoals: z.string(),
        currentAssets: z.string().optional(),
        targetMarkets: z.string().optional()
      }),
      execute: async ({ productionGoals, currentAssets, targetMarkets }) => {
        return {
          currentEfficiency: 'Current supply chain analysis',
          bottlenecks: 'Identified bottlenecks and constraints',
          optimizationOpportunities: 'Areas for improvement',
          costReduction: 'Potential cost savings',
          recommendations: [
            'Supply chain optimization strategies',
            'Logistics improvements',
            'Resource allocation optimization'
          ],
          implementationCosts: 'Investment required for optimization',
          expectedBenefits: 'Projected efficiency gains and cost savings'
        };
      }
    }
  }
});

export default marketAnalystAgent;