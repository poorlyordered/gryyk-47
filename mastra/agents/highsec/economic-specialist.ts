import { Agent } from '@mastra/core';
import { z } from 'zod';
import { EVE_AI_MODELS } from '../../config/models';
import { createKnowledgeQueryTool, createKnowledgeManagementTool, injectRAGContext } from '../../rag';
import { getCorporationAnalysisTool, getMarketDataTool, getCorporationWealthTool } from '../../tools/esi-tools';

// Economic analysis input schemas
const IncomeAnalysisSchema = z.object({
  currentActivities: z.array(z.enum(['mining', 'missions', 'trading', 'manufacturing', 'research', 'hauling'])),
  memberCount: z.number().describe('Active corporation members'),
  averageOnlineTime: z.number().describe('Average daily online hours per member'),
  currentIskPerHour: z.number().optional().describe('Current average ISK per hour'),
  investmentCapital: z.number().optional().describe('Available investment capital'),
  riskTolerance: z.enum(['low', 'medium', 'high']).default('medium')
});

const InvestmentOpportunitySchema = z.object({
  opportunityType: z.enum(['infrastructure', 'market', 'production', 'services', 'expansion']),
  investmentAmount: z.number().describe('Proposed investment in ISK'),
  timeHorizon: z.enum(['short', 'medium', 'long']).describe('Expected return timeframe'),
  corporationAssets: z.string().optional().describe('Current corporation assets'),
  memberExpertise: z.array(z.string()).optional().describe('Available member skills')
});

export const economicSpecialist = new Agent({
  name: 'economic-specialist',
  instructions: injectRAGContext(`You are the Economic Opportunities Specialist for Gryyk-47, focused on maximizing ISK generation and financial growth in Highsec space.

LIVE DATA ACCESS:
You have access to real-time EVE Online data through ESI tools:
- Corporation financial analysis with live wallet balances and member metrics
- Real-time market data from The Forge (Jita) for pricing and trading opportunities
- Corporation wealth distribution and tax efficiency analysis

Always consult live data when making economic recommendations to ensure accuracy and current market conditions.`, 'economic')

MEMORY INTEGRATION:
When provided with previousExperiences, leverage historical economic data and outcomes:
- Past investment performance and ROI results
- Income stream effectiveness and member participation rates
- Market timing successes and failures  
- Optimization strategies that improved or hindered economic growth

Use this accumulated knowledge to provide more accurate projections and avoid previously unsuccessful economic strategies.

Your expertise includes:
- Income stream identification and optimization
- Investment opportunity evaluation and risk assessment
- Financial planning and budget management
- Resource allocation optimization
- Passive income development
- Corporation wealth building strategies

Highsec Economic Focus:
- Emphasize safe, steady income streams over high-risk ventures
- Focus on scalable activities that benefit from corporation cooperation
- Prioritize member engagement and skill development
- Build sustainable long-term wealth generation
- Consider member investment and participation levels

Economic Principles:
1. Diversification across multiple income streams
2. Risk management appropriate for Highsec operations
3. Member participation and benefit sharing
4. Sustainable growth over rapid expansion
5. Infrastructure investment for long-term gains
6. Market stability and predictable returns

Your responses should be practical, risk-aware, and focused on sustainable ISK generation that benefits all corporation members.`,

  model: {
    provider: 'openrouter',
    name: EVE_AI_MODELS.specialist,
    toolChoice: 'auto'
  },

  tools: {
    // RAG-enabled knowledge tools
    queryKnowledgeBase: createKnowledgeQueryTool('economic'),
    manageKnowledgeBase: createKnowledgeManagementTool(),
    
    // Live ESI data tools
    getCorporationAnalysis: getCorporationAnalysisTool,
    getMarketData: getMarketDataTool,
    getCorporationWealth: getCorporationWealthTool,
    
    analyzeIncomeStreams: {
      description: 'Analyze current income activities and recommend optimizations',
      parameters: IncomeAnalysisSchema,
      execute: async ({ currentActivities, memberCount, averageOnlineTime, currentIskPerHour, investmentCapital, riskTolerance }) => {
        const activityMultipliers = {
          mining: { isk_hour: 40000000, scalability: 0.8, safety: 0.9, cooperation_bonus: 0.3 },
          missions: { isk_hour: 60000000, scalability: 0.6, safety: 0.8, cooperation_bonus: 0.2 },
          trading: { isk_hour: 80000000, scalability: 0.7, safety: 0.7, cooperation_bonus: 0.1 },
          manufacturing: { isk_hour: 50000000, scalability: 0.9, safety: 0.9, cooperation_bonus: 0.4 },
          research: { isk_hour: 30000000, scalability: 0.8, safety: 0.95, cooperation_bonus: 0.5 },
          hauling: { isk_hour: 45000000, scalability: 0.5, safety: 0.8, cooperation_bonus: 0.3 }
        };

        const potentialIskPerHour = currentActivities.reduce((total, activity) => {
          const base = activityMultipliers[activity].isk_hour;
          const cooperation = base * activityMultipliers[activity].cooperation_bonus;
          return total + base + cooperation;
        }, 0);

        const totalDailyPotential = potentialIskPerHour * averageOnlineTime * memberCount;

        return {
          currentAnalysis: {
            activeStreams: currentActivities,
            memberUtilization: `${memberCount} members averaging ${averageOnlineTime}h/day`,
            currentIskPerHour: currentIskPerHour || 'Not specified',
            potentialIskPerHour: Math.round(potentialIskPerHour),
            dailyPotential: `${Math.round(totalDailyPotential / 1000000)}M ISK/day`
          },
          optimizationOpportunities: [
            'Implement corporation mining operations with Orca boosts',
            'Establish shared mission running fleets for better efficiency',
            'Create corporation market orders for better trading margins',
            'Set up manufacturing chains with member specialization',
            'Develop research cooperatives for blueprint optimization'
          ],
          recommendedChanges: {
            immediate: [
              'Organize daily mining fleets during peak hours',
              'Share mission sites among corporation members',
              'Establish corporation buy-back programs'
            ],
            shortTerm: [
              'Invest in Orca support for mining operations',
              'Set up corporation manufacturing facilities',
              'Create shared trading capital pools'
            ],
            longTerm: [
              'Develop specialized teams for each income stream',
              'Build corporation-owned infrastructure',
              'Establish passive income through services'
            ]
          },
          expectedImprovements: {
            efficiency: '25-40% increase through cooperation',
            memberSatisfaction: 'Higher through shared success',
            scalability: 'Better growth potential with infrastructure'
          }
        };
      }
    },

    evaluateInvestment: {
      description: 'Evaluate investment opportunities and provide detailed analysis',
      parameters: InvestmentOpportunitySchema,
      execute: async ({ opportunityType, investmentAmount, timeHorizon, corporationAssets, memberExpertise }) => {
        const investmentTypes = {
          infrastructure: { 
            roi: 0.15, 
            risk: 0.1, 
            payback: 180, 
            description: 'Citadels, refineries, and industrial structures' 
          },
          market: { 
            roi: 0.25, 
            risk: 0.3, 
            payback: 90, 
            description: 'Market trading capital and station trading' 
          },
          production: { 
            roi: 0.20, 
            risk: 0.2, 
            payback: 120, 
            description: 'Manufacturing equipment and blueprint research' 
          },
          services: { 
            roi: 0.18, 
            risk: 0.15, 
            payback: 150, 
            description: 'Hauling services, buy-back programs, member services' 
          },
          expansion: { 
            roi: 0.12, 
            risk: 0.25, 
            payback: 240, 
            description: 'New system expansion and territory acquisition' 
          }
        };

        const investment = investmentTypes[opportunityType];
        const annualReturn = investmentAmount * investment.roi;
        const monthlyReturn = annualReturn / 12;
        const breakEven = investment.payback;

        return {
          investmentSummary: {
            type: opportunityType,
            amount: `${Math.round(investmentAmount / 1000000)}M ISK`,
            description: investment.description,
            timeHorizon: timeHorizon
          },
          financialProjections: {
            expectedROI: `${(investment.roi * 100).toFixed(1)}% annually`,
            monthlyReturn: `${Math.round(monthlyReturn / 1000000)}M ISK`,
            breakEvenPeriod: `${breakEven} days`,
            riskLevel: investment.risk < 0.2 ? 'Low' : investment.risk < 0.3 ? 'Medium' : 'High'
          },
          riskAssessment: {
            primaryRisks: [
              'Market volatility affecting returns',
              'Member participation requirements',
              'Competition from other corporations',
              'EVE Online economic changes'
            ],
            mitigationStrategies: [
              'Diversify investment across multiple opportunities',
              'Start with smaller pilot programs',
              'Ensure member buy-in and training',
              'Monitor market conditions regularly'
            ],
            successFactors: [
              'Strong member participation',
              'Effective management and coordination',
              'Market knowledge and timing',
              'Long-term commitment to the investment'
            ]
          },
          recommendation: {
            proceed: investment.risk <= 0.25 && timeHorizon !== 'short',
            conditions: [
              'Secure member commitment for required activities',
              'Establish clear profit-sharing agreements',
              'Implement proper management oversight',
              'Plan for contingency scenarios'
            ],
            alternatives: opportunityType === 'market' ? ['infrastructure', 'production'] : ['market', 'services']
          },
          implementationPlan: [
            'Conduct detailed feasibility study',
            'Secure necessary member skills and participation',
            'Allocate initial capital and resources',
            'Launch pilot program with success metrics',
            'Scale based on initial results and learning'
          ]
        };
      }
    },

    optimizeTaxation: {
      description: 'Analyze and optimize corporation taxation strategy',
      parameters: z.object({
        currentTaxRate: z.number().min(0).max(100).describe('Current corporation tax rate percentage'),
        memberTypes: z.array(z.enum(['newbro', 'casual', 'active', 'veteran'])),
        corporationExpenses: z.number().describe('Monthly corporation expenses in ISK'),
        servicesProvided: z.array(z.string()).describe('Services corporation provides to members')
      }),
      execute: async ({ currentTaxRate, memberTypes, corporationExpenses, servicesProvided }) => {
        const optimalRates = {
          newbro: 5,     // Lower rate to encourage new players
          casual: 7.5,   // Moderate rate for casual players
          active: 10,    // Standard rate for active members
          veteran: 12.5  // Higher rate for veterans who benefit most
        };

        const averageOptimal = memberTypes.reduce((sum, type) => sum + optimalRates[type], 0) / memberTypes.length;
        
        return {
          currentSituation: {
            taxRate: `${currentTaxRate}%`,
            memberComposition: memberTypes,
            monthlyExpenses: `${Math.round(corporationExpenses / 1000000)}M ISK`,
            servicesProvided: servicesProvided
          },
          analysis: {
            currentVsOptimal: currentTaxRate > averageOptimal ? 'Above optimal' : 
                             currentTaxRate < averageOptimal - 2 ? 'Below optimal' : 'Near optimal',
            recommendedRate: `${Math.round(averageOptimal * 10) / 10}%`,
            tieredApproach: 'Consider different rates for different member types'
          },
          recommendations: {
            immediate: [
              currentTaxRate > averageOptimal + 3 ? 'Reduce tax rate to improve retention' :
              currentTaxRate < averageOptimal - 3 ? 'Increase tax rate to fund better services' :
              'Maintain current rate but improve service communication'
            ],
            structure: {
              newMembers: `${optimalRates.newbro}% for first 90 days`,
              regularMembers: `${optimalRates.active}% for active members`,
              veterans: `${optimalRates.veteran}% for experienced members`,
              specialRoles: 'Reduced rates for officers and specialists'
            },
            valueProposition: [
              'Clearly communicate tax benefits to members',
              'Provide regular financial transparency reports',
              'Tie tax rates to service quality and availability',
              'Offer alternative contribution methods'
            ]
          },
          projectedImpact: {
            memberSatisfaction: 'Improved through fair and transparent taxation',
            corporationRevenue: 'Sustainable funding for operations and growth',
            competitiveness: 'Better positioning against other corporations'
          }
        };
      }
    }
  }
});

export default economicSpecialist;