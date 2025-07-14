import { Agent } from '@mastra/core';
import { z } from 'zod';
import { EVE_AI_MODELS } from '../../config/models';
import { createKnowledgeQueryTool, createKnowledgeManagementTool, injectRAGContext } from '../../rag';
import { getSystemInfoTool } from '../../tools/esi-tools';

// Mission analysis input schemas
const MissionPlanningSchema = z.object({
  agentType: z.enum(['security', 'mining', 'courier', 'trade']).describe('Mission agent type'),
  pilotSkills: z.object({
    combatSkills: z.number().min(1).max(10).describe('Combat capability rating'),
    shipClass: z.enum(['frigate', 'destroyer', 'cruiser', 'battlecruiser', 'battleship']),
    tanking: z.enum(['shield', 'armor', 'hull']).describe('Primary tanking method'),
    weapons: z.array(z.enum(['hybrid', 'projectile', 'laser', 'missile', 'drone']))
  }),
  timeAvailable: z.number().describe('Available time for missions in hours'),
  riskTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
  currentStandings: z.number().min(0).max(10).optional().describe('Current agent standings')
});

const FittingOptimizationSchema = z.object({
  shipType: z.string().describe('Ship type for mission running'),
  missionLevel: z.number().min(1).max(5).describe('Mission difficulty level'),
  damageTypes: z.array(z.enum(['thermal', 'kinetic', 'explosive', 'em'])).describe('Expected damage types'),
  enemyTypes: z.array(z.string()).optional().describe('Common enemy factions'),
  budget: z.number().optional().describe('Fitting budget in ISK')
});

export const missionSpecialist = new Agent({
  name: 'mission-specialist',
  instructions: injectRAGContext(`You are the Mission Running & Ratting Specialist for Gryyk-47, focused on efficient PvE operations and ISK generation in Highsec space.

LIVE DATA ACCESS:
You have access to real-time EVE Online data through ESI tools:
- System information for mission agent location assessment and security analysis
- Regional market integration for loyalty point value optimization

Always consult live data when making mission recommendations to ensure accuracy and current market conditions.`, 'mission') + `

MEMORY INTEGRATION:
When provided with previousExperiences, incorporate historical mission running data and outcomes:
- Ship fitting effectiveness in actual mission scenarios
- Agent standing progression strategies and their success rates  
- Loyalty point store purchase outcomes and market performance
- Mission completion time improvements and ISK/hour optimization results

Use this mission experience to provide more accurate fitting recommendations and earnings projections.

Your expertise includes:
- Mission planning and optimization strategies
- Ship fitting recommendations for PvE content
- Agent standings management and progression
- Loyalty point optimization and market analysis
- Risk assessment for mission running
- Fleet coordination for group PvE activities

Highsec PvE Focus:
- Emphasize safety and reliable completion rates
- Optimize for ISK per hour while minimizing risk
- Consider agent standings and loyalty point value
- Focus on sustainable progression and skill development
- Account for ship replacement costs and efficiency

Mission Running Principles:
1. Safety first - avoid losses through proper fitting and tactics
2. Efficiency optimization for maximum ISK per hour
3. Standing management for access to better agents and missions
4. Loyalty point value assessment and optimal spending
5. Progressive skill and ship development
6. Group coordination for challenging content

Your responses should be practical, safety-focused, and aimed at maximizing both ISK generation and mission completion efficiency.`,

  model: {
    provider: 'openrouter',
    name: EVE_AI_MODELS.specialist,
    toolChoice: 'auto'
  },

  tools: {
    // RAG-enabled knowledge tools
    queryKnowledgeBase: createKnowledgeQueryTool('mission'),
    manageKnowledgeBase: createKnowledgeManagementTool(),
    
    // Live ESI data tools
    getSystemInfo: getSystemInfoTool,
    
    planMissionRunning: {
      description: 'Create comprehensive mission running plan based on pilot capabilities',
      parameters: MissionPlanningSchema,
      execute: async ({ agentType, pilotSkills, timeAvailable, riskTolerance, currentStandings = 0 }) => {
        const agentInfo = {
          security: {
            description: 'Combat missions against NPC pirates',
            iskPerHour: { low: 45000000, medium: 75000000, high: 120000000 },
            lpValue: 2000, // LP per hour
            requirements: 'Combat skills and appropriate ship fitting',
            risks: 'Ship loss potential, faction standings impact'
          },
          mining: {
            description: 'Mining and hauling missions',
            iskPerHour: { low: 25000000, medium: 40000000, high: 55000000 },
            lpValue: 1500,
            requirements: 'Mining or industrial ships',
            risks: 'Low risk, time-intensive'
          },
          courier: {
            description: 'Item transportation missions',
            iskPerHour: { low: 30000000, medium: 45000000, high: 60000000 },
            lpValue: 1200,
            requirements: 'Fast ship with adequate cargo space',
            risks: 'Cargo ganking in trade routes'
          },
          trade: {
            description: 'Trade and procurement missions',
            iskPerHour: { low: 35000000, medium: 55000000, high: 75000000 },
            lpValue: 1800,
            requirements: 'Market knowledge and trade skills',
            risks: 'Market price fluctuations'
          }
        };

        const selectedAgent = agentInfo[agentType];
        const riskLevel = riskTolerance;
        const estimatedIncome = selectedAgent.iskPerHour[riskLevel];
        const sessionIncome = estimatedIncome * timeAvailable;

        const standingsBonus = Math.min(currentStandings * 0.05, 0.25); // Max 25% bonus
        const adjustedIncome = sessionIncome * (1 + standingsBonus);

        const shipRecommendations = {
          frigate: ['Assault Frigates for L1-L2 missions', 'Fast and cheap, good for beginners'],
          destroyer: ['Tech II destroyers for L2 missions', 'Good damage application'],
          cruiser: ['Heavy Assault Cruisers for L3 missions', 'Balanced performance and cost'],
          battlecruiser: ['Attack Battlecruisers for L3-L4 missions', 'High DPS with good tank'],
          battleship: ['Navy/Pirate battleships for L4 missions', 'Maximum income potential']
        };

        return {
          missionPlan: {
            agentType: agentType,
            description: selectedAgent.description,
            timeCommitment: `${timeAvailable} hours`,
            riskLevel: riskTolerance,
            currentStandings: currentStandings
          },
          incomeProjections: {
            baseIskPerHour: estimatedIncome,
            standingsBonus: `${(standingsBonus * 100).toFixed(1)}%`,
            sessionIncome: `${Math.round(adjustedIncome / 1000000)}M ISK`,
            loyaltyPoints: selectedAgent.lpValue * timeAvailable,
            totalValue: `${Math.round((adjustedIncome + selectedAgent.lpValue * timeAvailable * 1000) / 1000000)}M ISK`
          },
          shipRecommendations: {
            currentClass: pilotSkills.shipClass,
            recommendations: shipRecommendations[pilotSkills.shipClass],
            upgradePath: pilotSkills.shipClass === 'frigate' ? 'Progress to cruisers for L3 missions' :
                        pilotSkills.shipClass === 'cruiser' ? 'Consider battlecruisers for better L3/L4 performance' :
                        pilotSkills.shipClass === 'battleship' ? 'Optimize current fits for maximum efficiency' :
                        'Consider mission-specific ship specialization'
          },
          standingsStrategy: {
            current: currentStandings,
            targetLevel: 'Aim for 5.0+ standings for quality agent access',
            progression: [
              'Complete storyline missions for faction standing gains',
              'Focus on single faction agents for concentrated progress',
              'Use Social skills to improve effective standings',
              'Consider faction warfare for rapid standing improvement'
            ],
            benefits: [
              '3.0 standings: Access to L2 agents',
              '5.0 standings: Access to L4 agents and quality missions',
              '7.0+ standings: Premium agent access and LP bonuses'
            ]
          },
          optimizationTips: {
            efficiency: [
              'Accept only missions with good ISK/LP ratios',
              'Decline missions that require extensive travel',
              'Batch missions in same system for efficiency',
              'Use faction-specific damage types for faster completion'
            ],
            safety: [
              'Always fit appropriate tank for mission level',
              'Keep escape options available (MJD, MWD)',
              'Monitor local chat for potential threats',
              'Use mission-specific fittings and tactics'
            ],
            income: [
              'Salvage valuable wrecks for additional income',
              'Optimize LP store purchases for market value',
              'Consider running mission chains for bonus rewards',
              'Track hourly income to optimize activity mix'
            ]
          }
        };
      }
    },

    optimizeFitting: {
      description: 'Recommend optimal ship fitting for specific mission types',
      parameters: FittingOptimizationSchema,
      execute: async ({ shipType, missionLevel, damageTypes, enemyTypes = [], budget }) => {
        const fittingGuidelines = {
          1: {
            tank: 'Basic shield or armor tank, 5k+ EHP',
            weapons: 'Meta 4 weapons appropriate to ship size',
            support: 'Basic damage/tank support modules',
            cost: '5-20M ISK'
          },
          2: {
            tank: 'Solid tank, 10k+ EHP recommended',
            weapons: 'Tech II weapons or faction variants',
            support: 'Tech II support modules where applicable',
            cost: '25-50M ISK'
          },
          3: {
            tank: 'Strong tank, 25k+ EHP for cruiser hulls',
            weapons: 'Tech II weapons with good damage application',
            support: 'Full Tech II fitting with damage/tank optimization',
            cost: '75-150M ISK'
          },
          4: {
            tank: 'Heavy tank, 50k+ EHP for battleship hulls',
            weapons: 'Tech II/faction weapons optimized for mission damage',
            support: 'Full optimization with deadspace/faction modules',
            cost: '200-500M ISK'
          },
          5: {
            tank: 'Maximum tank, 80k+ EHP with active/passive hybrid',
            weapons: 'Officer/deadspace weapons for maximum application',
            support: 'Full officer/deadspace fitting for maximum performance',
            cost: '1B+ ISK'
          }
        };

        const resistanceProfile = {
          thermal: 'Common damage type - prioritize thermal resistance',
          kinetic: 'Frequent damage type - ensure good kinetic resistance',
          explosive: 'Moderate damage type - balance with other resistances',
          em: 'Less common but dangerous - don\'t neglect EM resistance'
        };

        const guidelines = fittingGuidelines[missionLevel];
        const primaryDamage = damageTypes[0];
        const budgetAssessment = budget ? 
          budget >= 1000000000 ? 'High-end fitting possible' :
          budget >= 200000000 ? 'Quality fitting achievable' :
          budget >= 50000000 ? 'Solid fitting within budget' :
          'Budget constraints - focus on essentials' : 'Budget not specified';

        return {
          fittingOverview: {
            ship: shipType,
            missionLevel: `Level ${missionLevel}`,
            primaryThreat: damageTypes.join(', '),
            estimatedCost: guidelines.cost,
            budgetStatus: budgetAssessment
          },
          tankingRecommendations: {
            requirements: guidelines.tank,
            resistanceProfile: damageTypes.map(type => `${type}: ${resistanceProfile[type]}`),
            tankType: shipType.toLowerCase().includes('caldari') || shipType.toLowerCase().includes('shield') ? 
                     'Shield tank recommended' : 'Armor tank recommended',
            activeModules: missionLevel >= 3 ? 
                          'Active tank modules for sustained engagement' :
                          'Passive tank acceptable for lower levels'
          },
          weaponSystems: {
            recommendations: guidelines.weapons,
            damageOptimization: `Optimize for ${primaryDamage} damage application`,
            ranges: missionLevel >= 4 ? 
                   'Long-range weapons for Level 4+ missions' :
                   'Balanced range and DPS for lower levels',
            ammunition: 'Use faction-specific damage types when possible'
          },
          supportModules: {
            required: guidelines.support,
            propulsion: missionLevel >= 3 ? 'Micro Jump Drive recommended for repositioning' :
                       'Afterburner or MWD for basic mobility',
            utility: [
              'Cap stable fitting or sufficient cap booster charges',
              'Appropriate hardeners for expected damage types',
              'Damage application modules (tracking, range)',
              'Salvager if planning to salvage wrecks'
            ]
          },
          fittingStrategy: {
            priorities: [
              '1. Ensure sufficient tank for mission level',
              '2. Optimize damage application against common enemies',
              '3. Maintain capacitor stability or management',
              '4. Include escape mechanisms for emergencies'
            ],
            progression: missionLevel < 4 ? 
                        'Focus on Tech II basics, upgrade to faction/deadspace gradually' :
                        'Invest in deadspace/faction modules for efficiency gains',
            alternatives: [
              'Shield vs Armor tank based on ship bonuses',
              'Active vs Passive tank based on engagement style',
              'Long-range vs Short-range weapons based on mission type'
            ]
          },
          performanceMetrics: {
            expectedDPS: missionLevel <= 2 ? '200-400 DPS' :
                        missionLevel === 3 ? '400-600 DPS' :
                        missionLevel >= 4 ? '600-1000+ DPS' : 'Variable',
            survivalRating: guidelines.tank,
            missionTime: missionLevel <= 2 ? '10-20 minutes' :
                        missionLevel === 3 ? '20-40 minutes' :
                        missionLevel >= 4 ? '30-60 minutes' : 'Variable',
            iskEfficiency: `Optimized for L${missionLevel} mission completion speed`
          }
        };
      }
    },

    analyzeLoyaltyPoints: {
      description: 'Analyze loyalty point store and recommend optimal purchases',
      parameters: z.object({
        faction: z.enum(['caldari_navy', 'gallente_federation', 'amarr_navy', 'minmatar_republic', 'sisters_of_eve']),
        availableLP: z.number().describe('Current loyalty points available'),
        availableISK: z.number().describe('Available ISK for LP store purchases'),
        marketFocus: z.enum(['immediate_isk', 'long_term_investment', 'personal_use']).default('immediate_isk')
      }),
      execute: async ({ faction, availableLP, availableISK, marketFocus }) => {
        const lpStores = {
          caldari_navy: {
            topItems: [
              { item: 'Caldari Navy Raven', lpCost: 400000, iskCost: 320000000, marketValue: 450000000 },
              { item: 'Caldari Navy Scourge Heavy Missile', lpCost: 2500, iskCost: 80000, marketValue: 150000 },
              { item: 'Caldari Navy Antimatter Charge L', lpCost: 100, iskCost: 5000, marketValue: 12000 }
            ],
            specialty: 'Shield tanking modules and Caldari ship variants'
          },
          gallente_federation: {
            topItems: [
              { item: 'Federation Navy Megathron', lpCost: 400000, iskCost: 280000000, marketValue: 400000000 },
              { item: 'Federation Navy Antimatter Charge L', lpCost: 100, iskCost: 5000, marketValue: 11000 },
              { item: 'Federation Navy Drone Damage Amplifier', lpCost: 12000, iskCost: 8000000, marketValue: 15000000 }
            ],
            specialty: 'Armor tanking and drone-focused equipment'
          },
          amarr_navy: {
            topItems: [
              { item: 'Imperial Navy Apocalypse', lpCost: 400000, iskCost: 300000000, marketValue: 420000000 },
              { item: 'Imperial Navy Multifrequency L', lpCost: 100, iskCost: 5000, marketValue: 10000 },
              { item: 'Imperial Navy Heat Sink', lpCost: 8000, iskCost: 6000000, marketValue: 12000000 }
            ],
            specialty: 'Energy weapons and armor tanking modules'
          },
          minmatar_republic: {
            topItems: [
              { item: 'Republic Fleet Tempest', lpCost: 400000, iskCost: 290000000, marketValue: 410000000 },
              { item: 'Republic Fleet EMP L', lpCost: 100, iskCost: 5000, marketValue: 9000 },
              { item: 'Republic Fleet Gyrostabilizer', lpCost: 10000, iskCost: 7000000, marketValue: 14000000 }
            ],
            specialty: 'Projectile weapons and speed-focused modules'
          },
          sisters_of_eve: {
            topItems: [
              { item: 'Sisters Core Scanner Probe', lpCost: 3000, iskCost: 100000, marketValue: 350000 },
              { item: 'Sisters Core Combat Scanner Probe', lpCost: 4000, iskCost: 120000, marketValue: 400000 },
              { item: 'Sisters Expanded Probe Launcher', lpCost: 40000, iskCost: 25000000, marketValue: 45000000 }
            ],
            specialty: 'Exploration equipment and scanning modules'
          }
        };

        const store = lpStores[faction];
        const affordableItems = store.topItems.filter(item => 
          item.lpCost <= availableLP && item.iskCost <= availableISK
        );

        const profitAnalysis = affordableItems.map(item => {
          const totalCost = item.iskCost + (item.lpCost * 1000); // Assume 1000 ISK per LP value
          const profit = item.marketValue - totalCost;
          const profitMargin = (profit / totalCost) * 100;
          const iskPerLP = (item.marketValue - item.iskCost) / item.lpCost;

          return {
            ...item,
            profit,
            profitMargin,
            iskPerLP,
            recommendation: profitMargin > 20 ? 'Highly Profitable' :
                           profitMargin > 10 ? 'Profitable' :
                           profitMargin > 0 ? 'Marginal' : 'Loss'
          };
        }).sort((a, b) => b.iskPerLP - a.iskPerLP);

        return {
          storeAnalysis: {
            faction: faction,
            specialty: store.specialty,
            availableLP: availableLP,
            availableISK: `${Math.round(availableISK / 1000000)}M ISK`,
            affordableItems: affordableItems.length
          },
          topRecommendations: profitAnalysis.slice(0, 3).map(item => ({
            item: item.item,
            profit: `${Math.round(item.profit / 1000000)}M ISK`,
            margin: `${item.profitMargin.toFixed(1)}%`,
            iskPerLP: `${Math.round(item.iskPerLP)} ISK/LP`,
            status: item.recommendation
          })),
          marketStrategy: {
            immediate_isk: 'Focus on high-volume, quick-selling items with good margins',
            long_term_investment: 'Consider rare modules and ships that appreciate over time',
            personal_use: 'Prioritize items that improve your mission running efficiency'
          }[marketFocus],
          optimization: {
            maxProfit: profitAnalysis[0] ? 
              `${profitAnalysis[0].item} offers ${Math.round(profitAnalysis[0].iskPerLP)} ISK per LP` :
              'No profitable items available with current resources',
            volume: 'Consider market volume and liquidity for large purchases',
            timing: 'Monitor market prices for optimal selling opportunities',
            diversification: 'Spread purchases across multiple item types to reduce risk'
          },
          actionPlan: {
            immediate: profitAnalysis.filter(item => item.recommendation === 'Highly Profitable')
              .slice(0, 2).map(item => `Purchase ${item.item} for immediate profit`),
            monitoring: [
              'Track market prices for purchased items',
              'Watch for LP store updates and new offerings',
              'Monitor faction standings for store access improvements'
            ],
            futureGoals: [
              `Aim for ${Math.max(100000, availableLP * 2)} LP for better purchasing power`,
              'Improve faction standings for access to better items',
              'Build market knowledge for optimal timing'
            ]
          }
        };
      }
    }
  }
});

export default missionSpecialist;