import { Agent } from '@mastra/core';
import { z } from 'zod';
import { EVE_AI_MODELS } from '../../config/models';
import { createKnowledgeQueryTool, createKnowledgeManagementTool, injectRAGContext } from '../../rag';
import { getMarketDataTool, getSystemInfoTool, getMiningInfoTool } from '../../tools/esi-tools';

// Mining operation input schemas
const MiningOperationSchema = z.object({
  operationType: z.enum(['belt_mining', 'anomaly_mining', 'moon_mining', 'ice_mining']),
  fleetSize: z.number().min(1).max(50).describe('Number of miners in fleet'),
  supportShips: z.array(z.enum(['orca', 'porpoise', 'hauler', 'combat'])).describe('Available support ships'),
  targetOre: z.array(z.string()).optional().describe('Preferred ore types'),
  sessionDuration: z.number().describe('Planned mining session length in hours'),
  securityLevel: z.number().min(0.5).max(1.0).describe('System security status')
});

const YieldOptimizationSchema = z.object({
  minerTypes: z.array(z.enum(['venture', 'retriever', 'covetor', 'mackinaw', 'hulk', 'skiff'])),
  boostShips: z.array(z.enum(['orca', 'porpoise', 'rorqual'])).optional(),
  currentYield: z.number().optional().describe('Current ISK per hour per miner'),
  upgradeGoals: z.array(z.string()).optional().describe('Desired improvements')
});

export const miningSpecialist = new Agent({
  name: 'mining-specialist',
  instructions: injectRAGContext(`You are the Mining Operations Specialist for Gryyk-47, focused on efficient and profitable mining operations in Highsec space.

LIVE DATA ACCESS:
You have access to real-time EVE Online data through ESI tools:
- Real-time market data for ore prices and trading volumes from The Forge (Jita)
- System information for mining location security assessment and station availability
- Mining-specific system analysis for asteroid belt potential and strategic positioning

Always consult live data when making mining recommendations to ensure accuracy and current market conditions.

MEMORY INTEGRATION:
When provided with previousExperiences, leverage historical mining operation data:
- Fleet composition effectiveness and actual yield results
- Ore price timing and market cycle patterns
- Mining site security incidents and safety lessons learned
- Equipment upgrade outcomes and member progression tracking

Use this operational memory to optimize fleet recommendations and improve mining efficiency projections.

Your expertise includes:
- Mining fleet composition and coordination
- Ore market analysis and target selection
- Yield optimization and efficiency improvements
- Mining equipment recommendations and upgrades
- Safety protocols and risk management
- Logistics and hauling coordination

Highsec Mining Focus:
- Emphasize safety and security in all operations
- Optimize for steady, predictable income streams
- Focus on team coordination and fleet efficiency
- Consider market prices when selecting mining targets
- Build sustainable mining operations that scale with membership

Mining Operation Principles:
1. Safety first - avoid unnecessary risks in Highsec
2. Efficiency through proper fleet composition and boosts
3. Market awareness for ore selection and timing
4. Team coordination for maximum yield and enjoyment
5. Equipment progression paths for members
6. Sustainable operations that benefit all participants

Your responses should be practical, safety-focused, and aimed at maximizing both ISK generation and member participation in mining activities.`, 'mining'),

  model: {
    provider: 'openrouter',
    name: EVE_AI_MODELS.specialist,
    toolChoice: 'auto'
  },

  tools: {
    // RAG-enabled knowledge tools
    queryKnowledgeBase: createKnowledgeQueryTool('mining'),
    manageKnowledgeBase: createKnowledgeManagementTool(),
    
    // Live ESI data tools
    getMarketData: getMarketDataTool,
    getSystemInfo: getSystemInfoTool,
    getMiningInfo: getMiningInfoTool,
    
    planMiningOperation: {
      description: 'Plan comprehensive mining operation with fleet composition and logistics',
      parameters: MiningOperationSchema,
      execute: async ({ operationType, fleetSize, supportShips, targetOre = [], sessionDuration, securityLevel }) => {
        const operationTypes = {
          belt_mining: {
            description: 'Standard asteroid belt mining with predictable ore types',
            averageYield: 45000000, // ISK per hour per miner
            safety: 0.9,
            logistics: 'Simple - belts close to stations',
            bestOres: ['Veldspar', 'Scordite', 'Pyroxeres', 'Plagioclase']
          },
          anomaly_mining: {
            description: 'Mining anomalies with higher-value ores',
            averageYield: 65000000,
            safety: 0.8,
            logistics: 'Moderate - requires scanning',
            bestOres: ['Kernite', 'Omber', 'Hemorphite', 'Hedbergite']
          },
          moon_mining: {
            description: 'Corporation moon mining operations',
            averageYield: 80000000,
            safety: 0.95,
            logistics: 'Complex - requires Athanor',
            bestOres: ['Extraordinary moon ores', 'Exceptional variants']
          },
          ice_mining: {
            description: 'Ice harvesting for fuel and advanced materials',
            averageYield: 55000000,
            safety: 0.85,
            logistics: 'Moderate - ice belt locations',
            bestOres: ['Blue Ice', 'Clear Icicle', 'Glacial Mass', 'White Glaze']
          }
        };

        const operation = operationTypes[operationType];
        const totalYield = operation.averageYield * fleetSize * sessionDuration;
        const safetyRating = operation.safety * securityLevel;

        const recommendedComposition = {
          miners: Math.max(1, fleetSize - supportShips.length),
          orca: supportShips.includes('orca') ? 1 : 0,
          porpoise: supportShips.includes('porpoise') && !supportShips.includes('orca') ? 1 : 0,
          haulers: Math.ceil(fleetSize / 10), // 1 hauler per 10 miners
          scouts: operationType === 'anomaly_mining' ? 1 : 0
        };

        return {
          operationPlan: {
            type: operationType,
            description: operation.description,
            duration: `${sessionDuration} hours`,
            fleetSize: fleetSize,
            expectedParticipants: recommendedComposition
          },
          yieldProjections: {
            iskPerHourPerMiner: operation.averageYield,
            totalFleetIskPerHour: operation.averageYield * fleetSize,
            sessionTotal: `${Math.round(totalYield / 1000000)}M ISK`,
            iskPerMember: `${Math.round(totalYield / fleetSize / 1000000)}M ISK`
          },
          fleetComposition: {
            recommended: recommendedComposition,
            boostEfficiency: supportShips.includes('orca') ? '25% yield increase' :
                           supportShips.includes('porpoise') ? '15% yield increase' : 'No mining boosts',
            logistics: `${recommendedComposition.haulers} hauler(s) needed for optimal cycle time`
          },
          targetSelection: {
            primaryOres: operation.bestOres.slice(0, 2),
            secondaryOres: operation.bestOres.slice(2),
            marketConsiderations: 'Focus on highest value ores based on current market prices',
            oreProcessing: 'Consider refining skills and station bonuses'
          },
          safety: {
            rating: safetyRating > 0.8 ? 'Very Safe' : safetyRating > 0.7 ? 'Safe' : 'Moderate Risk',
            protocols: [
              'Maintain fleet communication at all times',
              'Assign scout for anomaly operations',
              'Monitor local chat for neutrals',
              'Dock up if any threats appear',
              'Keep defensive modules fitted'
            ]
          },
          logistics: {
            complexity: operation.logistics,
            haulingSchedule: `Every ${Math.ceil(60 / recommendedComposition.haulers)} minutes`,
            jetcanManagement: fleetSize > 5 ? 'Use Orca cargo hold' : 'Individual mining lasers to cargo',
            stationDistance: 'Optimize for < 10 jumps to trade hub'
          }
        };
      }
    },

    optimizeYield: {
      description: 'Analyze current mining setup and recommend yield improvements',
      parameters: YieldOptimizationSchema,
      execute: async ({ minerTypes, boostShips = [], currentYield, upgradeGoals = [] }) => {
        const shipYields = {
          venture: { yield: 15000000, cargo: 5000, specialization: 'Gas mining and newbro friendly' },
          retriever: { yield: 35000000, cargo: 22000, specialization: 'High cargo capacity' },
          covetor: { yield: 50000000, cargo: 7000, specialization: 'Maximum yield with support' },
          mackinaw: { yield: 40000000, cargo: 28000, specialization: 'Ice mining specialist' },
          hulk: { yield: 55000000, cargo: 8500, specialization: 'Maximum ore yield' },
          skiff: { yield: 45000000, cargo: 15000, specialization: 'Tanked mining in contested areas' }
        };

        const boostEffects = {
          orca: { yieldBoost: 0.25, cargoBoost: 0.5, description: 'Maximum mining boost capabilities' },
          porpoise: { yieldBoost: 0.15, cargoBoost: 0.3, description: 'Moderate boost with mobility' },
          rorqual: { yieldBoost: 0.35, cargoBoost: 0.7, description: 'Ultimate mining support (Nullsec only)' }
        };

        const currentFleetYield = minerTypes.reduce((total, ship) => total + shipYields[ship].yield, 0);
        const bestBoost = boostShips.length > 0 ? Math.max(...boostShips.map(ship => boostEffects[ship]?.yieldBoost || 0)) : 0;
        const boostedYield = currentFleetYield * (1 + bestBoost);

        const recommendations = [];
        
        // Ship upgrade recommendations
        if (minerTypes.includes('venture')) {
          recommendations.push('Upgrade Venture pilots to Retriever for 130% yield increase');
        }
        if (minerTypes.includes('retriever') && !minerTypes.includes('hulk')) {
          recommendations.push('Train experienced miners to Hulk for maximum yield');
        }
        if (!boostShips.includes('orca') && minerTypes.length > 3) {
          recommendations.push('Add Orca support for 25% fleet-wide yield boost');
        }

        return {
          currentAnalysis: {
            fleetComposition: minerTypes,
            baseYieldPerHour: `${Math.round(currentFleetYield / 1000000)}M ISK`,
            withBoosts: `${Math.round(boostedYield / 1000000)}M ISK`,
            boostEfficiency: bestBoost > 0 ? `${(bestBoost * 100).toFixed(0)}% increase` : 'No boosts active',
            activeBoosts: boostShips
          },
          optimizationOpportunities: {
            shipUpgrades: [
              ...recommendations,
              'Consider Skiff for operations in systems with higher risk',
              'Mackinaw specialization for dedicated ice mining operations'
            ],
            fleetOptimization: [
              `Optimal ratio: 1 Orca per ${Math.min(10, minerTypes.length)} miners`,
              'Cross-train pilots for flexibility in ship roles',
              'Coordinate mining laser cycles for maximum efficiency'
            ],
            skillImprovements: [
              'Mining V for all pilots (20% yield increase)',
              'Astrogeology V for advanced mining capabilities',
              'Mining Director V for Orca pilots',
              'Reprocessing skills for maximum ore value'
            ]
          },
          projectedImprovements: {
            shortTerm: `${Math.round((boostedYield * 1.1) / 1000000)}M ISK/hour with basic optimizations`,
            mediumTerm: `${Math.round((boostedYield * 1.3) / 1000000)}M ISK/hour with ship upgrades`,
            longTerm: `${Math.round((boostedYield * 1.5) / 1000000)}M ISK/hour with full optimization`,
            investmentRequired: 'Estimate 200-500M ISK for significant fleet upgrades'
          },
          implementationPlan: {
            immediate: [
              'Ensure all miners have Mining Upgrades fitted',
              'Coordinate mining cycles and boost timing',
              'Optimize ore hold management and hauling'
            ],
            shortTerm: [
              'Train pilots for next tier mining ships',
              'Acquire Orca for fleet boost capabilities',
              'Improve reprocessing setup and efficiency'
            ],
            longTerm: [
              'Establish dedicated mining characters',
              'Build corporation mining infrastructure',
              'Develop advanced mining fleet doctrines'
            ]
          }
        };
      }
    },

    analyzeOrePrices: {
      description: 'Analyze current ore market prices and recommend optimal mining targets',
      parameters: z.object({
        currentLocation: z.string().describe('Current mining system or region'),
        refiningSetup: z.enum(['station', 'citadel', 'perfect']).describe('Available refining capabilities'),
        haulingCapacity: z.number().describe('Available hauling capacity in m3'),
        skillLevels: z.object({
          mining: z.number().min(0).max(5).default(4),
          reprocessing: z.number().min(0).max(5).default(4)
        }).optional()
      }),
      execute: async ({ currentLocation, refiningSetup, haulingCapacity, skillLevels = { mining: 4, reprocessing: 4 } }) => {
        // Mock ore price data - would integrate with EVE market API
        const orePrices = {
          'Veldspar': { price: 12, volume: 0.1, minerals: ['Tritanium'], difficulty: 1 },
          'Scordite': { price: 18, volume: 0.15, minerals: ['Tritanium', 'Pyerite'], difficulty: 1 },
          'Pyroxeres': { price: 25, volume: 0.3, minerals: ['Tritanium', 'Pyerite', 'Mexallon'], difficulty: 2 },
          'Plagioclase': { price: 35, volume: 0.35, minerals: ['Tritanium', 'Pyerite', 'Mexallon'], difficulty: 2 },
          'Omber': { price: 85, volume: 0.6, minerals: ['Tritanium', 'Pyerite', 'Isogen'], difficulty: 3 },
          'Kernite': { price: 120, volume: 1.2, minerals: ['Mexallon', 'Isogen'], difficulty: 3 },
          'Jaspet': { price: 95, volume: 2.0, minerals: ['Mexallon', 'Nocxium', 'Zydrine'], difficulty: 4 },
          'Hemorphite': { price: 180, volume: 3.0, minerals: ['Isogen', 'Nocxium', 'Zydrine'], difficulty: 4 },
          'Hedbergite': { price: 220, volume: 3.0, minerals: ['Pyerite', 'Isogen', 'Nocxium', 'Zydrine'], difficulty: 4 }
        };

        const refiningEfficiency = {
          station: 0.69, // Base station refining
          citadel: 0.876, // Upgraded citadel with rigs
          perfect: 0.922 // Perfect skills and standings
        }[refiningSetup];

        const skillMultiplier = (skillLevels.mining / 5) * (skillLevels.reprocessing / 5);
        
        const oreAnalysis = Object.entries(orePrices).map(([ore, data]) => {
          const adjustedPrice = data.price * refiningEfficiency * skillMultiplier;
          const iskPerM3 = adjustedPrice / data.volume;
          const haulingEfficiency = Math.min(haulingCapacity / data.volume, 1000); // Max reasonable haul
          
          return {
            ore,
            iskPerUnit: Math.round(adjustedPrice),
            iskPerM3: Math.round(iskPerM3),
            volume: data.volume,
            difficulty: data.difficulty,
            minerals: data.minerals,
            haulingEfficiency: Math.round(haulingEfficiency),
            recommendation: iskPerM3 > 100 && data.difficulty <= 3 ? 'Highly Recommended' :
                           iskPerM3 > 50 && data.difficulty <= 2 ? 'Recommended' :
                           iskPerM3 > 20 ? 'Acceptable' : 'Not Recommended'
          };
        });

        const topRecommendations = oreAnalysis
          .filter(ore => ore.recommendation === 'Highly Recommended' || ore.recommendation === 'Recommended')
          .sort((a, b) => b.iskPerM3 - a.iskPerM3)
          .slice(0, 5);

        return {
          marketAnalysis: {
            location: currentLocation,
            refiningSetup: refiningSetup,
            efficiency: `${(refiningEfficiency * 100).toFixed(1)}%`,
            skillModifier: `${(skillMultiplier * 100).toFixed(0)}%`
          },
          topRecommendations: topRecommendations.map(ore => ({
            ore: ore.ore,
            value: `${ore.iskPerM3} ISK/m³`,
            difficulty: `Level ${ore.difficulty}`,
            status: ore.recommendation
          })),
          detailedAnalysis: oreAnalysis.sort((a, b) => b.iskPerM3 - a.iskPerM3),
          miningStrategy: {
            primary: topRecommendations[0]?.ore || 'Veldspar',
            secondary: topRecommendations[1]?.ore || 'Scordite',
            haulingOptimization: `Focus on ores with value > 50 ISK/m³ for hauling efficiency`,
            skillPriorities: [
              skillLevels.reprocessing < 5 ? 'Train Reprocessing skills to V' : null,
              skillLevels.mining < 5 ? 'Train Mining to V for yield improvement' : null,
              'Consider Reprocessing Efficiency and ore-specific skills'
            ].filter(Boolean)
          },
          marketTiming: {
            bestTimes: 'Monitor weekend market activity for peak prices',
            priceVolatility: 'High-end ores more volatile, basic ores more stable',
            seasonalTrends: 'Mineral prices typically rise during major updates',
            recommendations: [
              'Stockpile high-value ores during market dips',
              'Process basic ores immediately for steady income',
              'Monitor Jita market trends for pricing signals'
            ]
          }
        };
      }
    }
  }
});

export default miningSpecialist;