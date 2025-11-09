import { Agent } from '@mastra/core';
import { z } from 'zod';
import { EVE_AI_MODELS } from '../../config/models';
import { createKnowledgeQueryTool, createKnowledgeManagementTool, injectRAGContext } from '../../rag';
import { getCorporationAnalysisTool, getCorporationMembersTool } from '../../tools/esi-tools';

// Recruiting analysis input schemas
const RecruitmentStrategySchema = z.object({
  targetRole: z.enum(['miner', 'mission_runner', 'trader', 'industrialist', 'general']).describe('Primary role to recruit for'),
  currentMembers: z.number().describe('Current corporation member count'),
  activityLevel: z.enum(['casual', 'regular', 'hardcore']).describe('Desired activity level'),
  experienceLevel: z.enum(['newbro', 'intermediate', 'veteran', 'mixed']).describe('Target experience level'),
  recruitmentChannels: z.array(z.string()).optional().describe('Available recruitment channels'),
  corporationPerks: z.string().optional().describe('Corporation benefits and perks')
});

const ApplicationEvaluationSchema = z.object({
  applicantInfo: z.object({
    characterAge: z.number().describe('Character age in days'),
    skillPoints: z.number().describe('Total skill points'),
    previousCorps: z.number().describe('Number of previous corporations'),
    securityStatus: z.number().describe('Security status'),
    primaryActivities: z.array(z.string()).describe('Main EVE activities')
  }),
  applicationText: z.string().describe('Application message from candidate'),
  recommendedRole: z.string().optional().describe('Suggested role for candidate')
});

export const recruitingSpecialist = new Agent({
  name: 'recruiting-specialist',
  instructions: injectRAGContext(`You are the Recruiting Specialist for Gryyk-47, focused on building and maintaining a strong Highsec corporation membership.

LIVE DATA ACCESS:
You have access to real-time EVE Online data through ESI tools:
- Corporation member analysis with activity tracking and retention metrics
- Real-time member demographics and participation levels
- Corporation analysis for competitive intelligence and benchmarking

Always consult live data when making recruitment recommendations to ensure accuracy and current corporation status.`, 'recruiting') + `

MEMORY INTEGRATION:
When provided with previousExperiences, incorporate lessons learned from past recruitment efforts:
- Successful recruitment strategies and their outcomes
- Member retention patterns and what worked/didn't work  
- Application screening insights and red flags identified
- Onboarding improvements based on new member feedback

Use this historical knowledge to refine your recommendations and avoid repeating past mistakes.

Your expertise includes:
- Recruitment strategy development for Highsec operations
- Application screening and candidate evaluation
- Onboarding process optimization
- Member retention strategies
- Activity tracking and engagement planning
- Newbro training program development

Highsec Recruiting Focus:
- Target players interested in mining, mission running, trading, and industry
- Emphasize safety, learning opportunities, and steady ISK generation
- Build a supportive community for new and returning players
- Focus on long-term member retention over rapid expansion

When providing recruiting advice:
1. Consider corporation culture and long-term sustainability
2. Balance growth with quality of membership
3. Account for training and integration costs
4. Prioritize member engagement and retention
5. Assess security risks and corp theft potential
6. Plan for member progression and advancement opportunities

Your responses should be practical, security-conscious, and focused on building a cohesive Highsec corporation.`,

  model: {
    provider: 'openrouter',
    name: EVE_AI_MODELS.specialist,
    toolChoice: 'auto'
  },

  tools: {
    // RAG-enabled knowledge tools
    queryKnowledgeBase: createKnowledgeQueryTool('recruiting'),
    manageKnowledgeBase: createKnowledgeManagementTool(),
    
    // Live ESI data tools
    getCorporationAnalysis: getCorporationAnalysisTool,
    getCorporationMembers: getCorporationMembersTool,
    
    developRecruitmentStrategy: {
      description: 'Create comprehensive recruitment strategy for specific roles and goals',
      parameters: RecruitmentStrategySchema,
      execute: async ({ targetRole, currentMembers, _activityLevel, _experienceLevel, _recruitmentChannels, corporationPerks }) => {
        const strategies = {
          miner: 'Focus on mining efficiency, ore buyback programs, and fleet mining operations',
          mission_runner: 'Emphasize mission sharing, loyalty point programs, and PvE fleet activities',
          trader: 'Highlight market access, trade route sharing, and economic opportunities',
          industrialist: 'Focus on manufacturing chains, blueprint sharing, and industrial cooperation',
          general: 'Broad appeal emphasizing community, learning, and diverse opportunities'
        };

        return {
          targetRole,
          primaryStrategy: strategies[targetRole],
          recruitmentChannels: {
            recommended: [
              'Corp recruitment channel in-game',
              'EVE University partnerships',
              'Reddit /r/evejobs',
              'Local system recruitment'
            ],
            messaging: `Join Gryyk-47 for ${targetRole} focused activities in secure Highsec space`,
            sellingPoints: [
              'Newbro-friendly environment with mentorship',
              'Steady ISK generation opportunities',
              'Active community and regular fleet operations',
              corporationPerks || 'Corporation benefits and support programs'
            ]
          },
          targetMetrics: {
            newMembers: Math.max(5, Math.floor(currentMembers * 0.1)),
            timeframe: '30 days',
            retentionGoal: '80% after 90 days'
          },
          screeningCriteria: {
            minimumAge: experienceLevel === 'newbro' ? 0 : 30,
            redFlags: ['Multiple recent corp changes', 'Negative security status', 'Evasive application responses'],
            priorityIndicators: ['Clear activity goals', 'Positive attitude', 'Team player mentality']
          },
          onboardingPlan: [
            'Welcome message with corporation overview',
            'Assign mentor for first 30 days',
            'Provide access to corporation resources',
            'Schedule introduction to relevant activities',
            'Set 30-day check-in for feedback'
          ]
        };
      }
    },

    evaluateApplication: {
      description: 'Evaluate recruitment application and provide recommendation',
      parameters: ApplicationEvaluationSchema,
      execute: async ({ applicantInfo, _applicationText, recommendedRole }) => {
        const { characterAge, skillPoints, previousCorps, securityStatus, primaryActivities } = applicantInfo;
        
        // Risk assessment calculations
        const experienceScore = Math.min(10, characterAge / 365 + skillPoints / 10000000);
        const stabilityScore = Math.max(0, 10 - previousCorps * 2);
        const securityScore = Math.max(0, Math.min(10, (securityStatus + 5) * 2));
        const overallScore = (experienceScore + stabilityScore + securityScore) / 3;

        const recommendation = overallScore >= 7 ? 'ACCEPT' : 
                             overallScore >= 5 ? 'INTERVIEW' : 
                             overallScore >= 3 ? 'CONDITIONAL' : 'REJECT';

        return {
          applicantSummary: {
            characterAge: `${characterAge} days`,
            experience: experienceScore >= 7 ? 'Experienced' : experienceScore >= 4 ? 'Intermediate' : 'Newbro',
            stability: stabilityScore >= 7 ? 'Stable' : stabilityScore >= 4 ? 'Moderate' : 'Concerning',
            security: securityStatus >= 0 ? 'Positive' : 'Negative'
          },
          riskAssessment: {
            overall: recommendation,
            score: Math.round(overallScore * 10) / 10,
            concerns: [
              ...(previousCorps > 3 ? ['High corp turnover history'] : []),
              ...(securityStatus < -2 ? ['Negative security status'] : []),
              ...(characterAge < 30 && skillPoints < 1000000 ? ['Very new character'] : [])
            ],
            strengths: [
              ...(characterAge > 365 ? ['Established character'] : []),
              ...(skillPoints > 10000000 ? ['Well-skilled pilot'] : []),
              ...(securityStatus > 2 ? ['Positive security status'] : [])
            ]
          },
          recommendedActions: {
            immediate: recommendation === 'ACCEPT' ? 'Send acceptance message' :
                      recommendation === 'INTERVIEW' ? 'Schedule voice interview' :
                      recommendation === 'CONDITIONAL' ? 'Request additional information' :
                      'Send polite rejection',
            followUp: [
              'Background check with previous corporations',
              'Verify application information',
              'Assess culture fit during trial period'
            ]
          },
          suggestedRole: recommendedRole || primaryActivities[0] || 'General member',
          onboardingNotes: 'Tailor onboarding based on experience level and primary interests'
        };
      }
    },

    analyzeRetention: {
      description: 'Analyze member retention and recommend improvements',
      parameters: z.object({
        membershipData: z.object({
          totalMembers: z.number(),
          newMembers30d: z.number(),
          leavers30d: z.number(),
          inactiveMembers: z.number()
        }),
        commonReasons: z.array(z.string()).optional()
      }),
      execute: async ({ membershipData, _commonReasons = [] }) => {
        const { totalMembers, newMembers30d, leavers30d, inactiveMembers } = membershipData;
        const retentionRate = ((newMembers30d - leavers30d) / newMembers30d) * 100;
        const activityRate = ((totalMembers - inactiveMembers) / totalMembers) * 100;

        return {
          currentMetrics: {
            totalMembers,
            retentionRate: `${Math.round(retentionRate)}%`,
            activityRate: `${Math.round(activityRate)}%`,
            netGrowth: newMembers30d - leavers30d
          },
          assessment: {
            retentionHealth: retentionRate >= 80 ? 'Excellent' : 
                           retentionRate >= 60 ? 'Good' : 
                           retentionRate >= 40 ? 'Concerning' : 'Critical',
            activityHealth: activityRate >= 70 ? 'Excellent' :
                           activityRate >= 50 ? 'Good' :
                           activityRate >= 30 ? 'Concerning' : 'Critical'
          },
          recommendations: [
            'Implement regular member check-ins',
            'Create more engaging group activities',
            'Improve new member onboarding process',
            'Develop member progression pathways',
            'Address common departure reasons'
          ],
          actionPlan: {
            immediate: ['Survey recent leavers for feedback', 'Review onboarding process'],
            shortTerm: ['Launch member mentorship program', 'Increase fleet activity frequency'],
            longTerm: ['Develop leadership advancement tracks', 'Build stronger corporation culture']
          }
        };
      }
    }
  }
});

export default recruitingSpecialist;