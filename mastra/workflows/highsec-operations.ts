import { Workflow } from '@mastra/core';
import { z } from 'zod';

// Comprehensive Highsec operations workflow
const HighsecOperationsInputSchema = z.object({
  corporationName: z.string(),
  memberCount: z.number().min(1),
  operationGoals: z.array(z.enum(['recruitment', 'income_optimization', 'mining_expansion', 'mission_efficiency', 'market_opportunities'])),
  timeHorizon: z.enum(['immediate', 'short-term', 'long-term']).default('short-term'),
  currentChallenges: z.string().optional().describe('Current operational challenges'),
  availableCapital: z.number().optional().describe('Available ISK for investments'),
  memberActivity: z.enum(['low', 'medium', 'high']).default('medium')
});

export const highsecOperationsWorkflow = new Workflow({
  name: 'highsec-operations',
  triggerSchema: HighsecOperationsInputSchema,
  
  steps: [
    // Step 1: Assess current recruitment needs and member capacity
    {
      id: 'assess-recruitment',
      agent: 'recruiting-specialist',
      action: 'developRecruitmentStrategy',
      input: (trigger) => ({
        targetRole: 'general', // Will be refined based on goals
        currentMembers: trigger.memberCount,
        activityLevel: trigger.memberActivity === 'high' ? 'hardcore' : 
                      trigger.memberActivity === 'medium' ? 'regular' : 'casual',
        experienceLevel: 'mixed'
      }),
      condition: (trigger) => trigger.operationGoals.includes('recruitment')
    },
    
    // Step 2: Analyze economic opportunities and optimization
    {
      id: 'analyze-economics',
      agent: 'economic-specialist',
      action: 'analyzeIncomeStreams',
      input: (trigger) => ({
        currentActivities: ['mining', 'missions', 'trading'], // Default Highsec activities
        memberCount: trigger.memberCount,
        averageOnlineTime: trigger.memberActivity === 'high' ? 6 : 
                          trigger.memberActivity === 'medium' ? 4 : 2,
        investmentCapital: trigger.availableCapital,
        riskTolerance: 'medium'
      }),
      condition: (trigger) => trigger.operationGoals.includes('income_optimization')
    },
    
    // Step 3: Evaluate market opportunities
    {
      id: 'evaluate-market',
      agent: 'market-specialist',
      action: 'analyzeMarketTrends',
      input: (trigger) => ({
        itemTypes: ['Tritanium', 'Mining Equipment', 'Mission Rewards'], // Common Highsec items
        regions: ['The Forge'],
        analysisType: 'trading',
        budget: trigger.availableCapital,
        timeframe: trigger.timeHorizon === 'immediate' ? 'daily' : 'weekly'
      }),
      condition: (trigger) => trigger.operationGoals.includes('market_opportunities')
    },
    
    // Step 4: Plan mining operations
    {
      id: 'plan-mining',
      agent: 'mining-specialist',
      action: 'planMiningOperation',
      input: (trigger, context) => ({
        operationType: 'belt_mining',
        fleetSize: Math.min(trigger.memberCount, 10), // Reasonable fleet size
        supportShips: trigger.memberCount > 5 ? ['orca', 'hauler'] : ['hauler'],
        sessionDuration: 3, // 3-hour mining sessions
        securityLevel: 0.8 // Typical Highsec
      }),
      condition: (trigger) => trigger.operationGoals.includes('mining_expansion')
    },
    
    // Step 5: Optimize mission running
    {
      id: 'optimize-missions',
      agent: 'mission-specialist',
      action: 'planMissionRunning',
      input: (trigger) => ({
        agentType: 'security',
        pilotSkills: {
          combatSkills: 6, // Average skill level
          shipClass: 'cruiser',
          tanking: 'shield',
          weapons: ['hybrid', 'missile']
        },
        timeAvailable: trigger.memberActivity === 'high' ? 4 : 2,
        riskTolerance: 'medium',
        currentStandings: 3.0 // Assumed starting standings
      }),
      condition: (trigger) => trigger.operationGoals.includes('mission_efficiency')
    },
    
    // Step 6: Synthesize comprehensive operational plan
    {
      id: 'synthesize-plan',
      agent: 'economic-specialist',
      action: 'analyzeIncomeStreams',
      input: (trigger, context) => {
        // Combine insights from all previous steps
        const recruitmentPlan = context['assess-recruitment']?.targetMetrics || {};
        const economicAnalysis = context['analyze-economics']?.expectedImprovements || {};
        const marketOpportunities = context['evaluate-market']?.tradingRecommendations || {};
        const miningPlan = context['plan-mining']?.yieldProjections || {};
        const missionPlan = context['optimize-missions']?.incomeProjections || {};
        
        return {
          currentActivities: trigger.operationGoals,
          memberCount: trigger.memberCount,
          averageOnlineTime: 4,
          currentIskPerHour: 50000000, // Will be calculated from specialist inputs
          investmentCapital: trigger.availableCapital,
          riskTolerance: 'medium'
        };
      }
    }
  ]
});

// Member development workflow for new recruits
const MemberDevelopmentInputSchema = z.object({
  newMemberProfile: z.object({
    characterAge: z.number().describe('Character age in days'),
    skillPoints: z.number().describe('Total skill points'),
    primaryInterest: z.enum(['mining', 'missions', 'trading', 'exploration', 'undecided']),
    availableTime: z.number().describe('Hours per week available for EVE')
  }),
  corporationResources: z.object({
    mentorAvailable: z.boolean(),
    trainingPrograms: z.array(z.string()),
    equipmentSupport: z.boolean()
  })
});

export const memberDevelopmentWorkflow = new Workflow({
  name: 'member-development',
  triggerSchema: MemberDevelopmentInputSchema,
  
  steps: [
    // Step 1: Assess member needs and create development plan
    {
      id: 'assess-member',
      agent: 'recruiting-specialist',
      action: 'evaluateApplication',
      input: (trigger) => ({
        applicantInfo: {
          characterAge: trigger.newMemberProfile.characterAge,
          skillPoints: trigger.newMemberProfile.skillPoints,
          previousCorps: 1, // Assumed for new members
          securityStatus: 0.0,
          primaryActivities: [trigger.newMemberProfile.primaryInterest]
        },
        applicationText: `New member interested in ${trigger.newMemberProfile.primaryInterest}, available ${trigger.newMemberProfile.availableTime} hours/week`,
        recommendedRole: trigger.newMemberProfile.primaryInterest
      })
    },
    
    // Step 2: Create activity-specific development path
    {
      id: 'create-development-path',
      agent: trigger => {
        switch (trigger.newMemberProfile.primaryInterest) {
          case 'mining': return 'mining-specialist';
          case 'missions': return 'mission-specialist';
          case 'trading': return 'market-specialist';
          default: return 'economic-specialist';
        }
      },
      action: trigger => {
        switch (trigger.newMemberProfile.primaryInterest) {
          case 'mining': return 'optimizeYield';
          case 'missions': return 'planMissionRunning';
          case 'trading': return 'identifyTradingOpportunities';
          default: return 'analyzeIncomeStreams';
        }
      },
      input: (trigger, context) => {
        const baseInput = {
          memberProfile: trigger.newMemberProfile,
          developmentGoals: context['assess-member']?.suggestedRole || 'general'
        };
        
        // Customize input based on interest
        switch (trigger.newMemberProfile.primaryInterest) {
          case 'mining':
            return {
              minerTypes: ['venture'], // Starting ship
              boostShips: [],
              upgradeGoals: ['Progress to Retriever', 'Learn belt mining']
            };
          case 'missions':
            return {
              agentType: 'security',
              pilotSkills: {
                combatSkills: trigger.newMemberProfile.skillPoints > 1000000 ? 4 : 2,
                shipClass: 'frigate',
                tanking: 'shield',
                weapons: ['hybrid']
              },
              timeAvailable: trigger.newMemberProfile.availableTime / 7, // Convert to daily
              riskTolerance: 'low'
            };
          case 'trading':
            return {
              tradeType: 'station_trading',
              capitalAvailable: 10000000, // Starter capital
              riskTolerance: 'low',
              tradingSkills: ['Trade']
            };
          default:
            return {
              currentActivities: ['missions'],
              memberCount: 1,
              averageOnlineTime: trigger.newMemberProfile.availableTime / 7,
              riskTolerance: 'low'
            };
        }
      }
    },
    
    // Step 3: Create 30-day progression plan
    {
      id: 'create-progression-plan',
      agent: 'recruiting-specialist',
      action: 'developRecruitmentStrategy',
      input: (trigger, context) => ({
        targetRole: trigger.newMemberProfile.primaryInterest,
        currentMembers: 1,
        activityLevel: trigger.newMemberProfile.availableTime > 20 ? 'hardcore' : 
                      trigger.newMemberProfile.availableTime > 10 ? 'regular' : 'casual',
        experienceLevel: trigger.newMemberProfile.skillPoints > 5000000 ? 'intermediate' : 'newbro'
      })
    }
  ]
});

export default {
  highsecOperationsWorkflow,
  memberDevelopmentWorkflow
};