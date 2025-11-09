import { Workflow } from '@mastra/core';
import { z } from 'zod';

// Strategic planning workflow input schema
const StrategicPlanningInputSchema = z.object({
  corporationName: z.string(),
  currentSituation: z.string(),
  objectives: z.string(),
  timeframe: z.enum(['immediate', 'short-term', 'long-term']),
  availableAssets: z.string().optional(),
  knownThreats: z.string().optional(),
  budgetConstraints: z.string().optional()
});

export const strategicPlanningWorkflow = new Workflow({
  name: 'strategic-planning',
  triggerSchema: StrategicPlanningInputSchema,
  
  steps: [
    // Step 1: Initial situation assessment
    {
      id: 'assess-situation',
      agent: 'strategic-advisor',
      action: 'analyzeStrategicSituation',
      input: (trigger) => ({
        situation: trigger.currentSituation,
        assets: trigger.availableAssets || 'Assessment needed',
        threats: trigger.knownThreats || 'Unknown threats',
        objectives: trigger.objectives,
        timeframe: trigger.timeframe
      })
    },
    
    // Step 2: Market analysis for economic opportunities
    {
      id: 'market-analysis',
      agent: 'market-analyst',
      action: 'evaluateInvestment',
      input: (trigger, context) => ({
        investmentType: 'manufacturing', // Could be dynamic based on objectives
        budget: 1000000000, // 1B ISK default, could be from trigger.budgetConstraints
        riskTolerance: 'medium',
        timeHorizon: trigger.timeframe === 'immediate' ? 'short' : 
                     trigger.timeframe === 'short-term' ? 'medium' : 'long'
      })
    },
    
    // Step 3: Military capability assessment
    {
      id: 'military-assessment',
      agent: 'fleet-commander',
      action: 'assessCombatReadiness',
      input: (trigger, context) => ({
        fleetComposition: 'Current corporation fleet composition',
        pilotExperience: 'mixed', // Could be dynamic
        equipmentStatus: 'standard', // Could be from assets assessment
        missionComplexity: trigger.timeframe === 'immediate' ? 'simple' : 'moderate'
      })
    },
    
    // Step 4: Synthesize comprehensive strategic plan
    {
      id: 'synthesize-plan',
      agent: 'strategic-advisor',
      action: 'analyzeStrategicSituation',
      input: (trigger, context) => {
        const situationAssessment = context['assess-situation']?.analysis || '';
        const marketOpportunities = context['market-analysis']?.recommendations?.join(', ') || '';
        const militaryCapabilities = context['military-assessment']?.strengths || '';
        
        return {
          situation: `Comprehensive strategic synthesis for ${trigger.corporationName}:\n\nSituation: ${situationAssessment}\nMarket Opportunities: ${marketOpportunities}\nMilitary Capabilities: ${militaryCapabilities}`,
          assets: trigger.availableAssets || '',
          threats: trigger.knownThreats || '',
          objectives: trigger.objectives,
          timeframe: trigger.timeframe
        };
      }
    }
  ]
});

export default strategicPlanningWorkflow;