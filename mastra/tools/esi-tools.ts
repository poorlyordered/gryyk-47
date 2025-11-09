import { z } from 'zod';
import { esiService } from '../../src/services/esi-enhanced';

/**
 * ESI Tools for specialist agents to access live EVE Online data
 */

export const getCorporationAnalysisTool = {
  name: 'getCorporationAnalysis',
  description: 'Get comprehensive corporation analysis including member activity, financial status, and strategic recommendations',
  parameters: z.object({
    corporationId: z.string().describe('The corporation ID to analyze')
  }),
  execute: async ({ corporationId }: { corporationId: string }) => {
    try {
      const intelligence = await esiService.getStrategicIntelligence(corporationId);
      
      return {
        status: 'success',
        corporationId,
        analysis: {
          memberMetrics: {
            totalMembers: intelligence.memberActivity.total,
            weeklyActiveRate: `${Math.round((intelligence.memberActivity.activeLastWeek / intelligence.memberActivity.total) * 100)}%`,
            monthlyActiveRate: `${Math.round((intelligence.memberActivity.activeLastMonth / intelligence.memberActivity.total) * 100)}%`,
            newMemberCount: intelligence.memberActivity.newMembers,
            retentionHealth: intelligence.memberActivity.activeLastWeek > intelligence.memberActivity.total * 0.5 ? 'Good' : 'Needs Attention'
          },
          financialMetrics: {
            totalWalletBalance: `${Math.round(intelligence.economicStatus.totalBalance / 1000000)}M ISK`,
            taxRate: `${(intelligence.economicStatus.taxRate * 100).toFixed(1)}%`,
            avgBalancePerMember: `${Math.round(intelligence.economicStatus.avgBalancePerMember / 1000000)}M ISK`,
            financialHealth: intelligence.economicStatus.totalBalance > 1000000000 ? 'Healthy' : 'Low Reserves'
          },
          strategicRecommendations: intelligence.recommendations,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to analyze corporation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        corporationId
      };
    }
  }
};

export const getMarketDataTool = {
  name: 'getMarketData',
  description: 'Get current market data for specific items in The Forge region (Jita)',
  parameters: z.object({
    typeIds: z.array(z.number()).describe('Array of EVE item type IDs to get market data for'),
    includeHistory: z.boolean().default(false).describe('Whether to include price history')
  }),
  execute: async ({ typeIds, includeHistory }: { typeIds: number[], includeHistory?: boolean }) => {
    const theForgeRegionId = 10000002; // The Forge (Jita)
    
    try {
      const marketData = await Promise.all(
        typeIds.map(async (typeId) => {
          const orders = await esiService.getMarketOrders(theForgeRegionId, typeId);
          
          // Calculate market metrics
          const buyOrders = orders.filter(o => o.is_buy_order).sort((a, b) => b.price - a.price);
          const sellOrders = orders.filter(o => !o.is_buy_order).sort((a, b) => a.price - b.price);
          
          const highestBuy = buyOrders[0]?.price || 0;
          const lowestSell = sellOrders[0]?.price || 0;
          const spread = lowestSell > 0 && highestBuy > 0 ? ((lowestSell - highestBuy) / lowestSell * 100) : 0;
          
          let history = null;
          if (includeHistory) {
            history = await esiService.getMarketHistory(theForgeRegionId, typeId);
          }
          
          return {
            typeId,
            currentPrice: {
              highestBuy,
              lowestSell,
              spread: `${spread.toFixed(2)}%`,
              volume24h: orders.reduce((sum, o) => sum + (o.volume_total - o.volume_remain), 0)
            },
            orderBook: {
              buyOrderCount: buyOrders.length,
              sellOrderCount: sellOrders.length,
              totalVolume: orders.reduce((sum, o) => sum + o.volume_remain, 0)
            },
            history: history?.slice(-7), // Last 7 days if requested
            timestamp: new Date().toISOString()
          };
        })
      );
      
      return {
        status: 'success',
        region: 'The Forge',
        marketData,
        summary: {
          itemsAnalyzed: typeIds.length,
          avgSpread: `${(marketData.reduce((sum, item) => sum + parseFloat(item.currentPrice.spread), 0) / marketData.length).toFixed(2)}%`,
          totalVolume: marketData.reduce((sum, item) => sum + item.orderBook.totalVolume, 0)
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to get market data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        typeIds
      };
    }
  }
};

export const getCorporationMembersTool = {
  name: 'getCorporationMembers',
  description: 'Get detailed information about corporation members including activity levels',
  parameters: z.object({
    corporationId: z.string().describe('The corporation ID'),
    activityAnalysis: z.boolean().default(true).describe('Whether to include activity analysis')
  }),
  execute: async ({ corporationId, activityAnalysis }: { corporationId: string, activityAnalysis?: boolean }) => {
    try {
      const [corpInfo, members] = await Promise.all([
        esiService.getCorporationInfo(corporationId),
        esiService.getCorporationMembers(corporationId)
      ]);
      
      let analysis = null;
      if (activityAnalysis) {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        analysis = {
          totalMembers: members.length,
          activeLastWeek: members.filter(m => m.logon_date && new Date(m.logon_date) > weekAgo).length,
          activeLastMonth: members.filter(m => m.logon_date && new Date(m.logon_date) > monthAgo).length,
          newRecruits: members.filter(m => new Date(m.start_date) > monthAgo).length,
          avgTenure: Math.round(members.reduce((sum, m) => {
            const tenure = (now.getTime() - new Date(m.start_date).getTime()) / (1000 * 60 * 60 * 24);
            return sum + tenure;
          }, 0) / members.length),
          retentionRate: `${Math.round((members.filter(m => new Date(m.start_date) < monthAgo).length / members.length) * 100)}%`
        };
      }
      
      return {
        status: 'success',
        corporation: {
          name: corpInfo.name,
          ticker: corpInfo.ticker,
          memberCount: corpInfo.member_count
        },
        memberAnalysis: analysis,
        recommendations: analysis ? [
          analysis.activeLastWeek < analysis.totalMembers * 0.4 ? 'Low weekly activity - consider member engagement initiatives' : null,
          analysis.newRecruits === 0 ? 'No new recruits this month - review recruitment strategy' : null,
          analysis.avgTenure < 30 ? 'High member turnover - focus on retention programs' : null
        ].filter(Boolean) : [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to analyze members: ${error instanceof Error ? error.message : 'Unknown error'}`,
        corporationId
      };
    }
  }
};

export const getSystemInfoTool = {
  name: 'getSystemInfo',
  description: 'Get information about a specific star system including security status and stations',
  parameters: z.object({
    systemId: z.number().describe('The system ID to get information for')
  }),
  execute: async ({ systemId }: { systemId: number }) => {
    try {
      const systemInfo = await esiService.getSystemInfo(systemId);
      
      const securityClass = systemInfo.security_status >= 0.5 ? 'Highsec' :
                           systemInfo.security_status > 0.0 ? 'Lowsec' : 'Nullsec';
      
      return {
        status: 'success',
        system: {
          name: systemInfo.name,
          systemId: systemInfo.system_id,
          securityStatus: systemInfo.security_status.toFixed(1),
          securityClass,
          constellationId: systemInfo.constellation_id,
          stationCount: systemInfo.stations?.length || 0,
          stargateCount: systemInfo.stargates?.length || 0,
          planetCount: systemInfo.planets?.length || 0
        },
        strategicValue: {
          miningPotential: securityClass === 'Highsec' ? 'Safe but limited' : 'Higher risk, better yields',
          tradingHub: systemInfo.stations && systemInfo.stations.length > 5 ? 'Major hub' : 'Regional market',
          accessibility: systemInfo.stargates && systemInfo.stargates.length > 3 ? 'Well connected' : 'Remote location'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to get system info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        systemId
      };
    }
  }
};

export const getCorporationWealthTool = {
  name: 'getCorporationWealth',
  description: 'Analyze corporation financial status and wealth distribution',
  parameters: z.object({
    corporationId: z.string().describe('The corporation ID to analyze')
  }),
  execute: async ({ corporationId }: { corporationId: string }) => {
    try {
      const [corpInfo, wallets] = await Promise.all([
        esiService.getCorporationInfo(corporationId),
        esiService.getCorporationWallets(corporationId)
      ]);
      
      const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
      const balancePerMember = totalBalance / corpInfo.member_count;
      
      // Financial health assessment
      const healthMetrics = {
        totalWealth: `${Math.round(totalBalance / 1000000)}M ISK`,
        wealthPerMember: `${Math.round(balancePerMember / 1000000)}M ISK`,
        taxRate: `${(corpInfo.tax_rate * 100).toFixed(1)}%`,
        walletDivisions: wallets.length,
        financialHealth: totalBalance > 10000000000 ? 'Excellent' :
                        totalBalance > 1000000000 ? 'Good' :
                        totalBalance > 100000000 ? 'Moderate' : 'Poor'
      };
      
      const recommendations = [];
      if (totalBalance < 1000000000) {
        recommendations.push('Corporation reserves are low - consider income diversification');
      }
      if (corpInfo.tax_rate > 0.15) {
        recommendations.push('High tax rate may discourage recruitment');
      }
      if (corpInfo.tax_rate < 0.05) {
        recommendations.push('Low tax rate - consider if current income supports operations');
      }
      
      return {
        status: 'success',
        corporation: {
          name: corpInfo.name,
          memberCount: corpInfo.member_count
        },
        financialMetrics: healthMetrics,
        recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to analyze wealth: ${error instanceof Error ? error.message : 'Unknown error'}`,
        corporationId
      };
    }
  }
};

// Additional specialized ESI tools
export const getMiningInfoTool = {
  name: 'getMiningInfo',
  description: 'Get mining-specific information for systems and market data for ores',
  parameters: z.object({
    systemId: z.number().describe('The system ID to analyze for mining'),
    includeOreMarket: z.boolean().default(true).describe('Include current ore market prices')
  }),
  execute: async ({ systemId, includeOreMarket }: { systemId: number, includeOreMarket?: boolean }) => {
    try {
      const systemInfo = await esiService.getSystemInfo(systemId);
      
      let oreMarket = null;
      if (includeOreMarket) {
        // Common ore type IDs for mining analysis
        const commonOres = [1230, 1228, 1224, 18, 1226]; // Veldspar, Scordite, Pyroxeres, Plagioclase, Omber
        oreMarket = await esiService.getMarketOrders(10000002, commonOres[0]); // Sample with Veldspar in The Forge
      }
      
      const miningPotential = {
        asteroidBelts: systemInfo.planets?.length || 0, // Simplified - would need belt scanning
        securityRating: systemInfo.security_status,
        miningClass: systemInfo.security_status >= 0.7 ? 'High-yield Highsec' :
                    systemInfo.security_status >= 0.5 ? 'Standard Highsec' : 'Lowsec',
        stationAccess: systemInfo.stations?.length > 0,
        tradeHubDistance: 'Unknown' // Would calculate jumps to Jita
      };
      
      return {
        status: 'success',
        system: {
          name: systemInfo.name,
          security: systemInfo.security_status.toFixed(1),
          miningPotential
        },
        oreMarket: oreMarket ? {
          sampleOrePrices: 'Market data available',
          timestamp: new Date().toISOString()
        } : null,
        recommendations: [
          systemInfo.security_status >= 0.7 ? 'Excellent for fleet mining operations' : 'Suitable for small group mining',
          systemInfo.stations?.length > 0 ? 'Local station available for ore processing' : 'Consider hauling setup',
          'Monitor local activity for mining competition'
        ]
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to get mining info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        systemId
      };
    }
  }
};

// Export all tools for easy import
export const ESI_TOOLS = {
  getCorporationAnalysisTool,
  getMarketDataTool,
  getCorporationMembersTool,
  getSystemInfoTool,
  getCorporationWealthTool,
  getMiningInfoTool
};