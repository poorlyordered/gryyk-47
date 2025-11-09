import { Agent } from '@mastra/core';
import { z } from 'zod';
import { EVE_AI_MODELS } from '../../config/models';
import { createKnowledgeQueryTool, createKnowledgeManagementTool, injectRAGContext } from '../../rag';
import { getMarketDataTool, getSystemInfoTool } from '../../tools/esi-tools';

// Market analysis input schemas
const MarketAnalysisSchema = z.object({
  itemTypes: z.array(z.string()).describe('Items or categories to analyze'),
  regions: z.array(z.string()).default(['The Forge']).describe('Market regions to analyze'),
  analysisType: z.enum(['trading', 'manufacturing', 'investment', 'procurement']).describe('Type of market analysis'),
  budget: z.number().optional().describe('Available trading capital'),
  timeframe: z.enum(['daily', 'weekly', 'monthly']).default('weekly')
});

const TradingOpportunitySchema = z.object({
  tradeType: z.enum(['station_trading', 'regional_arbitrage', 'import_export', 'speculation']),
  capitalAvailable: z.number().describe('Available trading capital in ISK'),
  riskTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
  tradingSkills: z.array(z.string()).optional().describe('Available trading skills'),
  preferredItems: z.array(z.string()).optional().describe('Preferred item categories')
});

export const marketSpecialist = new Agent({
  name: 'market-specialist',
  instructions: injectRAGContext(`You are the Market Analysis Specialist for Gryyk-47, focused on profitable trading and market intelligence in Highsec space.

LIVE DATA ACCESS:
You have access to real-time EVE Online data through ESI tools:
- Real-time market data from The Forge (Jita) including prices, volumes, and order book analysis
- System information for strategic location assessment and trade route planning
- Historical price data and trends for accurate forecasting

Always consult live market data when making trading recommendations to ensure accuracy and current market conditions.`, 'market') + `

MEMORY INTEGRATION:
When provided with previousExperiences, incorporate historical market insights and trading outcomes:
- Successful trading strategies and their actual profitability
- Market timing decisions and their results
- Item volatility patterns observed over time
- Regional arbitrage opportunities that proved profitable or unprofitable

Use this market memory to improve prediction accuracy and trading recommendations.

Your expertise includes:
- Market trend analysis and price forecasting
- Trading opportunity identification and evaluation
- Regional arbitrage and price differential analysis
- Manufacturing cost analysis and profit optimization
- Supply and demand assessment
- Risk management for trading operations

Highsec Market Focus:
- Emphasize safe trading routes and reliable profit margins
- Focus on high-volume, stable commodities over volatile speculation
- Consider transportation costs and logistics
- Account for market competition and saturation
- Prioritize sustainable trading strategies over quick profits

Market Analysis Principles:
1. Data-driven decision making with current market information
2. Risk assessment appropriate for corporation capital
3. Sustainable profit margins over maximum returns
4. Market diversification to reduce exposure
5. Transportation security and efficiency
6. Long-term market positioning and reputation

Your responses should be analytical, profit-focused, and considerate of Highsec trading constraints and opportunities.`,

  model: {
    provider: 'openrouter',
    name: EVE_AI_MODELS.specialist,
    toolChoice: 'auto'
  },

  tools: {
    // RAG-enabled knowledge tools
    queryKnowledgeBase: createKnowledgeQueryTool('market'),
    manageKnowledgeBase: createKnowledgeManagementTool(),
    
    // Live ESI data tools
    getMarketData: getMarketDataTool,
    getSystemInfo: getSystemInfoTool,
    
    analyzeMarketTrends: {
      description: 'Analyze market trends for specific items and provide trading insights',
      parameters: MarketAnalysisSchema,
      execute: async ({ itemTypes, regions, analysisType, budget, timeframe }) => {
        // Mock market data - in real implementation, this would fetch from EVE ESI API
        const marketData = itemTypes.map(item => ({
          item,
          currentPrice: Math.floor(Math.random() * 10000000) + 1000000, // 1M-11M ISK
          volume24h: Math.floor(Math.random() * 1000) + 100,
          priceChange7d: (Math.random() - 0.5) * 20, // ±10%
          volatility: Math.random() * 30, // 0-30%
          competition: Math.floor(Math.random() * 50) + 10 // 10-60 orders
        }));

        const highVolumeItems = marketData.filter(item => item.volume24h > 500);
        const stableItems = marketData.filter(item => item.volatility < 15);
        const trendingItems = marketData.filter(item => Math.abs(item.priceChange7d) > 5);

        return {
          marketOverview: {
            analyzedItems: itemTypes,
            regions: regions,
            analysisType: analysisType,
            timeframe: timeframe,
            dataPoints: marketData.length
          },
          keyFindings: {
            highVolumeOpportunities: highVolumeItems.map(item => item.item),
            stableInvestments: stableItems.map(item => item.item),
            trendingItems: trendingItems.map(item => ({
              item: item.item,
              trend: item.priceChange7d > 0 ? 'Rising' : 'Falling',
              change: `${item.priceChange7d.toFixed(1)}%`
            }))
          },
          tradingRecommendations: {
            immediate: [
              'Focus on high-volume, low-volatility items for consistent profits',
              'Monitor trending items for arbitrage opportunities',
              'Consider regional price differences for transport trades'
            ],
            strategies: {
              station_trading: stableItems.slice(0, 3).map(item => item.item),
              regional_arbitrage: highVolumeItems.slice(0, 2).map(item => item.item),
              speculation: trendingItems.slice(0, 2).map(item => item.item)
            }
          },
          riskAssessment: {
            low: stableItems.filter(item => item.volume24h > 300).map(item => item.item),
            medium: marketData.filter(item => item.volatility >= 15 && item.volatility <= 25).map(item => item.item),
            high: marketData.filter(item => item.volatility > 25).map(item => item.item)
          },
          budgetAllocation: budget ? {
            conservative: `${Math.round(budget * 0.6 / 1000000)}M ISK in stable items`,
            moderate: `${Math.round(budget * 0.3 / 1000000)}M ISK in trending items`,
            aggressive: `${Math.round(budget * 0.1 / 1000000)}M ISK in speculation`
          } : 'Budget not specified for allocation recommendations'
        };
      }
    },

    identifyTradingOpportunities: {
      description: 'Identify specific trading opportunities based on capital and preferences',
      parameters: TradingOpportunitySchema,
      execute: async ({ tradeType, capitalAvailable, riskTolerance, tradingSkills = [], preferredItems = [] }) => {
        const opportunities = {
          station_trading: {
            description: 'Buy and sell in the same station using order management',
            capitalRequirement: 'Low - 10M ISK minimum per item',
            profitMargin: '2-8% per transaction',
            timeInvestment: 'High - daily order management required',
            skillRequirements: ['Trade', 'Retail', 'Wholesale', 'Tycoon']
          },
          regional_arbitrage: {
            description: 'Transport goods between regions for profit',
            capitalRequirement: 'Medium - 50M ISK minimum plus transport',
            profitMargin: '5-15% per run',
            timeInvestment: 'Medium - regular transport runs needed',
            skillRequirements: ['Trade', 'Transport Ship Operation', 'Evasive Maneuvering']
          },
          import_export: {
            description: 'Move goods from manufacturing to consumer hubs',
            capitalRequirement: 'High - 100M+ ISK for meaningful volume',
            profitMargin: '10-25% per shipment',
            timeInvestment: 'Low - weekly shipments',
            skillRequirements: ['Trade', 'Industry connections', 'Market knowledge']
          },
          speculation: {
            description: 'Invest in items expected to increase in value',
            capitalRequirement: 'Variable - depends on speculation target',
            profitMargin: '20-100% potential, high loss risk',
            timeInvestment: 'Low - buy and hold strategy',
            skillRequirements: ['Market Analysis', 'Risk Management', 'Patience']
          }
        };

        const selectedStrategy = opportunities[tradeType];
        const riskAdjustment = riskTolerance === 'low' ? 0.5 : riskTolerance === 'high' ? 1.5 : 1.0;

        return {
          strategyOverview: {
            type: tradeType,
            description: selectedStrategy.description,
            suitability: capitalAvailable > 100000000 ? 'Excellent' : 
                        capitalAvailable > 50000000 ? 'Good' : 
                        capitalAvailable > 10000000 ? 'Limited' : 'Insufficient'
          },
          requirements: {
            capital: selectedStrategy.capitalRequirement,
            skills: selectedStrategy.skillRequirements,
            time: selectedStrategy.timeInvestment
          },
          opportunities: [
            {
              item: 'Tritanium',
              route: 'Jita → Amarr',
              margin: `${(3 * riskAdjustment).toFixed(1)}%`,
              volume: 'High',
              risk: 'Low'
            },
            {
              item: 'Mining Equipment',
              route: 'Manufacturing Hubs → Mining Systems',
              margin: `${(12 * riskAdjustment).toFixed(1)}%`,
              volume: 'Medium',
              risk: 'Medium'
            },
            {
              item: 'Faction Modules',
              route: 'Mission Hubs → Trade Hubs',
              margin: `${(25 * riskAdjustment).toFixed(1)}%`,
              volume: 'Low',
              risk: 'High'
            }
          ],
          recommendations: {
            startWith: tradeType === 'station_trading' ? 'High-volume minerals and commodities' :
                      tradeType === 'regional_arbitrage' ? 'Manufacturing materials and equipment' :
                      tradeType === 'import_export' ? 'Finished goods and faction items' :
                      'Market research and small test investments',
            capitalAllocation: {
              conservative: `${Math.round(capitalAvailable * 0.7 / 1000000)}M ISK`,
              aggressive: `${Math.round(capitalAvailable * 0.3 / 1000000)}M ISK`
            },
            timeline: 'Start with 30-day trial period to measure performance'
          },
          riskManagement: [
            'Never invest more than 20% of capital in single item',
            'Diversify across multiple trading routes and items',
            'Set stop-loss limits for speculative investments',
            'Monitor market trends and competitor activity',
            'Maintain emergency capital reserves'
          ]
        };
      }
    },

    analyzeProfitability: {
      description: 'Analyze manufacturing and production profitability',
      parameters: z.object({
        productType: z.string().describe('Product or category to analyze'),
        productionVolume: z.number().describe('Expected monthly production volume'),
        materialCosts: z.number().optional().describe('Estimated material costs per unit'),
        laborCosts: z.number().optional().describe('Time investment cost per unit'),
        marketDemand: z.enum(['low', 'medium', 'high']).default('medium')
      }),
      execute: async ({ productType, productionVolume, materialCosts = 0, laborCosts = 0, marketDemand }) => {
        // Mock production analysis - would integrate with manufacturing data
        const basePrice = Math.floor(Math.random() * 50000000) + 5000000; // 5M-55M ISK
        const demandMultiplier = marketDemand === 'high' ? 1.2 : marketDemand === 'low' ? 0.8 : 1.0;
        const marketPrice = basePrice * demandMultiplier;
        
        const totalCostPerUnit = materialCosts + laborCosts;
        const profitPerUnit = marketPrice - totalCostPerUnit;
        const profitMargin = (profitPerUnit / marketPrice) * 100;
        const monthlyProfit = profitPerUnit * productionVolume;

        return {
          productAnalysis: {
            product: productType,
            marketPrice: `${Math.round(marketPrice / 1000000 * 10) / 10}M ISK`,
            costPerUnit: `${Math.round(totalCostPerUnit / 1000000 * 10) / 10}M ISK`,
            profitPerUnit: `${Math.round(profitPerUnit / 1000000 * 10) / 10}M ISK`,
            profitMargin: `${profitMargin.toFixed(1)}%`
          },
          marketAssessment: {
            demand: marketDemand,
            competition: 'Moderate', // Would be calculated from market data
            priceStability: 'Stable', // Would be based on historical data
            entryBarriers: 'Medium' // Based on production requirements
          },
          financialProjections: {
            monthlyVolume: productionVolume,
            monthlyRevenue: `${Math.round(marketPrice * productionVolume / 1000000)}M ISK`,
            monthlyCosts: `${Math.round(totalCostPerUnit * productionVolume / 1000000)}M ISK`,
            monthlyProfit: `${Math.round(monthlyProfit / 1000000)}M ISK`,
            annualProfit: `${Math.round(monthlyProfit * 12 / 1000000)}M ISK`
          },
          recommendations: {
            viability: profitMargin > 20 ? 'Highly Profitable' :
                      profitMargin > 10 ? 'Profitable' :
                      profitMargin > 5 ? 'Marginal' : 'Not Recommended',
            optimizations: [
              'Source materials from corporation mining operations',
              'Negotiate bulk material purchase agreements',
              'Optimize production efficiency and waste reduction',
              'Consider market timing for maximum profit windows'
            ],
            scaling: productionVolume < 100 ? 'Consider increasing volume for better margins' :
                    productionVolume > 1000 ? 'Monitor market saturation risks' :
                    'Current volume appears optimal'
          },
          riskFactors: [
            'Material price volatility',
            'Market demand fluctuations',
            'Competition from other manufacturers',
            'Production cost increases'
          ]
        };
      }
    }
  }
});

export default marketSpecialist;