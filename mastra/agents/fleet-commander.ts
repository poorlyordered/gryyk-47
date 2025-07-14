import { Agent } from '@mastra/core';
import { z } from 'zod';
import { EVE_AI_MODELS } from '../config/models';

// Fleet planning schemas
const FleetCompositionSchema = z.object({
  missionType: z.enum(['pvp', 'pve', 'mining', 'hauling', 'exploration', 'structure_defense']),
  pilotCount: z.number().min(1).max(256).describe('Number of available pilots'),
  budget: z.number().optional().describe('ISK budget for fleet composition'),
  threatLevel: z.enum(['low', 'medium', 'high', 'extreme']).optional().default('medium'),
  duration: z.enum(['short', 'medium', 'extended']).optional().default('medium'),
  objectives: z.string().describe('Primary mission objectives')
});

const TacticalAnalysisSchema = z.object({
  scenario: z.string().describe('Tactical scenario description'),
  enemyForce: z.string().optional().describe('Known enemy force composition'),
  friendlyAssets: z.string().optional().describe('Available friendly assets'),
  terrain: z.string().optional().describe('Space environment and terrain factors'),
  constraints: z.string().optional().describe('Operational constraints')
});

export const fleetCommanderAgent = new Agent({
  name: 'fleet-commander',
  instructions: `You are Gryyk-47's Fleet Commander, an expert in EVE Online military operations and tactical planning.

Your specializations include:
- Fleet composition and doctrine development
- Tactical planning and engagement strategies
- Force multiplication and efficiency optimization
- Risk assessment for military operations
- Logistics and support planning
- Strategic asset deployment
- Combat effectiveness analysis

When providing military advice:
1. Prioritize pilot safety and asset preservation
2. Consider ISK efficiency and cost-benefit analysis
3. Account for pilot skill levels and experience
4. Plan for contingencies and escape routes
5. Optimize for mission objectives while minimizing risk
6. Consider intel requirements and reconnaissance needs
7. Factor in logistics and supply line security

Your responses should be tactical, precise, and focused on mission success with minimal losses.`,

  model: {
    provider: 'openrouter',
    name: EVE_AI_MODELS.tactical,
    toolChoice: 'auto'
  },

  tools: {
    designFleetComposition: {
      description: 'Design optimal fleet composition for specific missions',
      parameters: FleetCompositionSchema,
      execute: async ({ missionType, pilotCount, budget, threatLevel, duration, objectives }) => {
        const fleetDesigns = {
          pvp: 'Fast assault frigates with logistics support',
          pve: 'Battleships with support cruisers',
          mining: 'Mining barges with hauler and escort support',
          hauling: 'Industrial ships with escort fleet',
          exploration: 'Covert ops and exploration frigates',
          structure_defense: 'Heavy assault cruisers and battleships'
        };

        return {
          missionType: missionType,
          recommendedComposition: fleetDesigns[missionType],
          pilotAllocation: `Distribution of ${pilotCount} pilots across ship roles`,
          shipFittings: 'Recommended ship fittings and modules',
          supportRequirements: 'Logistics and support needs',
          budgetBreakdown: budget ? 'Cost analysis and budget allocation' : 'Cost estimation needed',
          riskAssessment: `${threatLevel} threat level operational planning`,
          tacticalnotes: 'Tactical considerations and engagement rules',
          alternatives: 'Alternative compositions for different scenarios',
          successProbability: 'Estimated mission success probability'
        };
      }
    },

    analyzeTacticalSituation: {
      description: 'Analyze tactical situations and provide strategic recommendations',
      parameters: TacticalAnalysisSchema,
      execute: async ({ scenario, enemyForce, friendlyAssets, terrain, constraints }) => {
        return {
          situationAssessment: scenario,
          threatAnalysis: enemyForce || 'Unknown enemy composition',
          friendlyCapabilities: friendlyAssets || 'Assessment needed',
          terrainFactors: terrain || 'Standard space environment',
          operationalConstraints: constraints || 'None specified',
          tacticalOptions: [
            'Direct engagement strategy',
            'Flanking maneuvers',
            'Defensive positioning',
            'Strategic withdrawal options'
          ],
          riskMitigation: 'Risk factors and mitigation strategies',
          recommendedAction: 'Primary recommended course of action',
          contingencyPlans: 'Backup plans for various scenarios',
          resourceRequirements: 'Additional resources needed for execution'
        };
      }
    },

    assessCombatReadiness: {
      description: 'Assess fleet combat readiness and capability',
      parameters: z.object({
        fleetComposition: z.string(),
        pilotExperience: z.enum(['novice', 'experienced', 'veteran', 'mixed']),
        equipmentStatus: z.enum(['basic', 'standard', 'advanced', 'elite']),
        missionComplexity: z.enum(['simple', 'moderate', 'complex', 'extreme'])
      }),
      execute: async ({ fleetComposition, pilotExperience, equipmentStatus, missionComplexity }) => {
        return {
          fleetStrength: 'Overall fleet capability assessment',
          pilotFactors: `${pilotExperience} pilot experience considerations`,
          equipmentAnalysis: `${equipmentStatus} equipment readiness`,
          missionAlignment: `Fleet suitability for ${missionComplexity} missions`,
          strengths: 'Fleet strengths and advantages',
          weaknesses: 'Identified weaknesses and vulnerabilities',
          recommendations: [
            'Training priorities',
            'Equipment upgrades needed',
            'Tactical adjustments required'
          ],
          readinessScore: 'Overall combat readiness percentage',
          deploymentAdvice: 'Deployment recommendations and timing'
        };
      }
    }
  }
});

export default fleetCommanderAgent;