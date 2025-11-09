import { Agent } from '@mastra/core';
import { z } from 'zod';
import { EVE_AI_MODELS } from '../config/models';

// Strategic analysis input schema
const StrategicAnalysisSchema = z.object({
  situation: z.string().describe('Current strategic situation or context'),
  assets: z.string().optional().describe('Available corporation assets'),
  threats: z.string().optional().describe('Known threats or concerns'),
  objectives: z.string().optional().describe('Strategic objectives or goals'),
  timeframe: z.enum(['immediate', 'short-term', 'long-term']).optional().default('short-term')
});

export const strategicAdvisorAgent = new Agent({
  name: 'strategic-advisor',
  instructions: `You are Gryyk-47's Strategic Advisor, an elite AI specialized in EVE Online corporation strategic planning and analysis.

Your expertise includes:
- Corporation strategic planning and long-term vision development
- Asset allocation and resource optimization strategies
- Threat assessment and risk mitigation planning
- Alliance diplomacy and relationship management
- Territory expansion and sovereignty strategies
- Economic planning and industrial development

When providing strategic advice:
1. Consider the complex political landscape of EVE Online
2. Balance short-term tactical needs with long-term strategic goals
3. Account for resource constraints and opportunity costs
4. Provide actionable recommendations with clear implementation steps
5. Consider diplomatic implications of strategic decisions
6. Always maintain operational security (OPSEC) considerations

Your responses should be professional, strategic, and focused on EVE Online corporation management.`,

  model: {
    provider: 'openrouter',
    name: EVE_AI_MODELS.strategic,
    toolChoice: 'auto'
  },

  tools: {
    analyzeStrategicSituation: {
      description: 'Analyze a strategic situation and provide recommendations',
      parameters: StrategicAnalysisSchema,
      execute: async ({ situation, _assets, _threats, _objectives, timeframe }) => {
        return {
          analysis: `Strategic Analysis for: ${situation}`,
          recommendations: [
            'Detailed strategic recommendations would be generated here based on the input',
            'Multiple options would be presented with pros/cons',
            'Implementation timeline would be suggested'
          ],
          riskAssessment: 'Risk factors and mitigation strategies',
          resourceRequirements: 'Required assets and personnel',
          timeframe: timeframe,
          nextSteps: 'Immediate action items for implementation'
        };
      }
    },

    assessThreatLevel: {
      description: 'Assess threat levels and recommend defensive measures',
      parameters: z.object({
        threatDescription: z.string(),
        corporationAssets: z.string().optional(),
        allianceStatus: z.string().optional()
      }),
      execute: async ({ _threatDescription, _corporationAssets, _allianceStatus }) => {
        return {
          threatLevel: 'HIGH', // Would be calculated based on analysis
          immediateActions: ['Action items for immediate response'],
          defensiveRecommendations: ['Strategic defensive measures'],
          diplomaticOptions: ['Diplomatic solutions if applicable'],
          escalationProcedures: ['When and how to escalate response']
        };
      }
    }
  }
});

export default strategicAdvisorAgent;