/**
 * MER (Monthly Economic Report) Data Tools
 *
 * These tools provide access to processed EVE Online economic data from MongoDB,
 * including war zones, doctrine ships, regional economics, and mining activity.
 *
 * Data source: eve-mer-analytics pipeline
 * Database: eve_ai
 * Collections: mer_war_zones, mer_doctrine_ships, mer_regional_economics,
 *              mer_mining_activity, mer_economic_activity
 */

import { MongoClient } from 'mongodb';
import { z } from 'zod';

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'eve_ai';

/**
 * Get doctrine ships - high-volume ship losses indicating manufacturing opportunities
 */
export const getDoctrineShipsTool = {
  description: `Get doctrine ships from Monthly Economic Report data. Doctrine ships are ships with >100 kills/month,
  indicating active fleet doctrines and manufacturing demand. Includes manufacturing opportunity scores.
  Use this to identify profitable ship manufacturing opportunities driven by warfare consumption.`,
  parameters: z.object({
    reportMonth: z.string().default('2025-10').describe('Report month in YYYY-MM format'),
    region: z.string().optional().describe('Filter by region name (e.g., "Delve", "The Forge")'),
    minKills: z.number().default(100).describe('Minimum kill count threshold'),
    limit: z.number().default(20).describe('Maximum number of results to return')
  }),
  execute: async ({ reportMonth, region, minKills, limit }) => {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not configured');
    }

    const client = new MongoClient(MONGODB_URI);

    try {
      await client.connect();
      const db = client.db(DATABASE_NAME);

      const query: Record<string, unknown> = {
        report_month: reportMonth,
        loss_count: { $gte: minKills }
      };

      if (region) {
        query.region_name = region;
      }

      const doctrineShips = await db.collection('mer_doctrine_ships')
        .find(query)
        .sort({ manufacturing_opportunity_score: -1 })
        .limit(limit)
        .toArray();

      return {
        reportMonth,
        region: region || 'All Regions',
        totalShips: doctrineShips.length,
        ships: doctrineShips.map((ship: any) => ({
          shipType: ship.ship_type_name,
          shipGroup: ship.ship_group_name,
          region: ship.region_name,
          killCount: ship.loss_count,
          totalIskDestroyed: `${Math.round(ship.total_isk / 1_000_000_000)}B ISK`,
          avgIskPerKill: `${Math.round(ship.avg_isk / 1_000_000)}M ISK`,
          opportunityScore: ship.manufacturing_opportunity_score,
          demandScore: ship.demand_score,
          interpretation: ship.loss_count > 1000 ? 'Extremely High Demand' :
                         ship.loss_count > 500 ? 'High Demand' :
                         ship.loss_count > 200 ? 'Moderate Demand' : 'Growing Demand'
        })),
        insights: {
          topShip: doctrineShips[0] ? {
            name: doctrineShips[0].ship_type_name,
            kills: doctrineShips[0].loss_count,
            totalValue: `${Math.round(doctrineShips[0].total_isk / 1_000_000_000)}B ISK`
          } : null,
          manufacturingRecommendation: doctrineShips.length > 0 ?
            `Focus on ${doctrineShips.slice(0, 3).map((s: any) => s.ship_type_name).join(', ')} for best ROI` :
            'No doctrine ships found for specified criteria'
        }
      };
    } finally {
      await client.close();
    }
  }
};

/**
 * Get war zones - regions with active warfare and high ISK destruction
 */
export const getWarZonesTool = {
  description: `Get war zones from Monthly Economic Report data. Shows regions with active warfare,
  total kills, and ISK destroyed. Use this to identify conflict zones with high ship demand and
  manufacturing opportunities. Also useful for threat assessment and opportunity analysis.`,
  parameters: z.object({
    reportMonth: z.string().default('2025-10').describe('Report month in YYYY-MM format'),
    minKills: z.number().default(100).describe('Minimum kill count threshold'),
    limit: z.number().default(15).describe('Maximum number of results to return')
  }),
  execute: async ({ reportMonth, minKills, limit }) => {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not configured');
    }

    const client = new MongoClient(MONGODB_URI);

    try {
      await client.connect();
      const db = client.db(DATABASE_NAME);

      const warZones = await db.collection('mer_war_zones')
        .find({
          report_month: reportMonth,
          total_kills: { $gte: minKills }
        })
        .sort({ total_isk_destroyed: -1 })
        .limit(limit)
        .toArray();

      return {
        reportMonth,
        totalRegions: warZones.length,
        warZones: warZones.map((zone: any) => ({
          regionName: zone.region_name,
          regionId: zone.region_id,
          totalKills: zone.total_kills,
          totalIskDestroyed: `${Math.round(zone.total_isk_destroyed / 1_000_000_000)}B ISK`,
          totalIskLost: `${Math.round(zone.total_isk_lost / 1_000_000_000)}B ISK`,
          avgIskPerKill: `${Math.round((zone.total_isk_destroyed / zone.total_kills) / 1_000_000)}M ISK`,
          intensity: zone.total_kills > 10000 ? 'Extreme' :
                    zone.total_kills > 5000 ? 'Very High' :
                    zone.total_kills > 2000 ? 'High' :
                    zone.total_kills > 1000 ? 'Moderate' : 'Low'
        })),
        insights: {
          hottestWarZone: warZones[0] ? {
            name: warZones[0].region_name,
            kills: warZones[0].total_kills,
            destruction: `${Math.round(warZones[0].total_isk_destroyed / 1_000_000_000)}B ISK`
          } : null,
          manufacturingOpportunity: warZones.length > 0 ?
            `High ship demand in ${warZones.slice(0, 3).map((z: any) => z.region_name).join(', ')}` :
            'No significant war zones found'
        }
      };
    } finally {
      await client.close();
    }
  }
};

/**
 * Get regional economics - comprehensive economic metrics per region
 */
export const getRegionalEconomicsTool = {
  description: `Get regional economics from Monthly Economic Report data. Includes war intensity (destroyed/produced ratio),
  industrial capacity, trade activity, and economic profiles. Use this to assess manufacturing locations,
  identify war zones, find trade hubs, and understand regional economic health.`,
  parameters: z.object({
    reportMonth: z.string().default('2025-10').describe('Report month in YYYY-MM format'),
    region: z.string().optional().describe('Specific region name to query'),
    minWarIntensity: z.number().optional().describe('Minimum war intensity threshold (e.g., 1.0 for active warfare)'),
    economicProfile: z.enum(['active_warfare', 'contested_space', 'trade_hub', 'pve_farming', 'industrial_heartland', 'mixed_economy']).optional().describe('Filter by economic profile'),
    limit: z.number().default(20).describe('Maximum number of results to return')
  }),
  execute: async ({ reportMonth, region, minWarIntensity, economicProfile, limit }) => {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not configured');
    }

    const client = new MongoClient(MONGODB_URI);

    try {
      await client.connect();
      const db = client.db(DATABASE_NAME);

      const query: Record<string, unknown> = { report_month: reportMonth };

      if (region) {
        query.region_name = region;
      }
      if (minWarIntensity !== undefined) {
        query.war_intensity = { $gte: minWarIntensity };
      }
      if (economicProfile) {
        query.economic_profile = economicProfile;
      }

      const regions = await db.collection('mer_regional_economics')
        .find(query)
        .sort({ war_intensity: -1 })
        .limit(limit)
        .toArray();

      return {
        reportMonth,
        totalRegions: regions.length,
        queryFilters: {
          specificRegion: region || 'All Regions',
          minWarIntensity: minWarIntensity || 'None',
          economicProfile: economicProfile || 'All Profiles'
        },
        regions: regions.map((r: any) => ({
          regionName: r.region_name,
          economicProfile: r.economic_profile,
          warIntensity: r.war_intensity,
          warIntensityInterpretation: r.war_intensity > 2.0 ? 'Extreme Warfare' :
                                      r.war_intensity > 1.0 ? 'Active Warfare' :
                                      r.war_intensity > 0.5 ? 'Contested' :
                                      r.war_intensity > 0.2 ? 'Peaceful with Activity' : 'Very Peaceful',
          destroyed: `${Math.round(r.destroyed_value / 1_000_000_000)}B ISK`,
          produced: `${Math.round(r.produced_value / 1_000_000_000)}B ISK`,
          mined: `${Math.round(r.mined_value / 1_000_000_000)}B ISK`,
          tradeVolume: `${Math.round(r.trade_value / 1_000_000_000)}B ISK`,
          industrialCapacity: r.industrial_capacity,
          netWealthCreation: `${Math.round(r.net_wealth_creation / 1_000_000_000)}B ISK`,
          tradeActivity: r.trade_activity,
          pveActivity: r.pve_activity,
          manufacturingOpportunity: r.war_intensity > 1.0 && r.industrial_capacity > 0.8 ? 'Excellent' :
                                   r.war_intensity > 0.5 ? 'Good' : 'Limited'
        })),
        insights: {
          topWarZone: regions[0] ? {
            name: regions[0].region_name,
            warIntensity: regions[0].war_intensity,
            profile: regions[0].economic_profile
          } : null,
          tradeHubs: regions.filter((r: any) => r.economic_profile === 'trade_hub').map((r: any) => r.region_name),
          activeWarfare: regions.filter((r: any) => r.war_intensity > 1.0).map((r: any) => ({
            region: r.region_name,
            intensity: r.war_intensity
          }))
        }
      };
    } finally {
      await client.close();
    }
  }
};

/**
 * Get mining activity - supply capacity and mining efficiency by region
 */
export const getMiningActivityTool = {
  description: `Get mining activity from Monthly Economic Report data. Shows mining volumes (asteroid, gas, ice, moon),
  efficiency rates, and supply capacity by region. Use this to identify material sourcing locations for manufacturing
  and understand regional supply chains.`,
  parameters: z.object({
    reportMonth: z.string().default('2025-10').describe('Report month in YYYY-MM format'),
    region: z.string().optional().describe('Specific region name to query'),
    minVolume: z.number().optional().describe('Minimum total volume mined (in cubic meters)'),
    supplyCapacity: z.enum(['very_high', 'high', 'moderate', 'low']).optional().describe('Filter by supply capacity level'),
    limit: z.number().default(20).describe('Maximum number of results to return')
  }),
  execute: async ({ reportMonth, region, minVolume, supplyCapacity, limit }) => {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not configured');
    }

    const client = new MongoClient(MONGODB_URI);

    try {
      await client.connect();
      const db = client.db(DATABASE_NAME);

      const query: Record<string, unknown> = { report_month: reportMonth };

      if (region) {
        query.region_name = region;
      }
      if (minVolume !== undefined) {
        query.total_volume_mined = { $gte: minVolume };
      }
      if (supplyCapacity) {
        query.supply_capacity = supplyCapacity;
      }

      const miningRegions = await db.collection('mer_mining_activity')
        .find(query)
        .sort({ total_volume_mined: -1 })
        .limit(limit)
        .toArray();

      return {
        reportMonth,
        totalRegions: miningRegions.length,
        queryFilters: {
          specificRegion: region || 'All Regions',
          minVolume: minVolume ? `${Math.round(minVolume / 1_000_000_000)}B m³` : 'None',
          supplyCapacity: supplyCapacity || 'All Levels'
        },
        miningRegions: miningRegions.map((r: any) => ({
          regionName: r.region_name,
          totalVolumeMined: `${Math.round(r.total_volume_mined / 1_000_000_000)}B m³`,
          totalVolumeWasted: `${Math.round(r.total_volume_wasted / 1_000_000_000)}B m³`,
          efficiencyRate: `${(r.efficiency_rate * 100).toFixed(1)}%`,
          supplyCapacity: r.supply_capacity,
          breakdown: {
            asteroid: `${Math.round(r.asteroid_volume_mined / 1_000_000_000)}B m³`,
            gas: `${Math.round(r.gas_volume_mined / 1_000_000_000)}B m³`,
            ice: `${Math.round(r.ice_volume_mined / 1_000_000_000)}B m³`,
            moon: `${Math.round(r.moon_volume_mined / 1_000_000_000)}B m³`
          },
          sourcingOpportunity: r.supply_capacity === 'very_high' ? 'Excellent for bulk sourcing' :
                              r.supply_capacity === 'high' ? 'Good supply available' :
                              r.supply_capacity === 'moderate' ? 'Limited supply' : 'Poor supply'
        })),
        insights: {
          topMiningRegion: miningRegions[0] ? {
            name: miningRegions[0].region_name,
            volume: `${Math.round(miningRegions[0].total_volume_mined / 1_000_000_000)}B m³`,
            capacity: miningRegions[0].supply_capacity
          } : null,
          highSupplyRegions: miningRegions.filter((r: any) => r.supply_capacity === 'very_high' || r.supply_capacity === 'high')
            .map((r: any) => r.region_name),
          recommendation: miningRegions.length > 0 ?
            `Source materials from ${miningRegions.slice(0, 3).map((r: any) => r.region_name).join(', ')} for best supply` :
            'Limited mining data available'
        }
      };
    } finally {
      await client.close();
    }
  }
};

/**
 * Get economic activity - production/destruction balance by security band
 */
export const getEconomicActivityTool = {
  description: `Get economic activity from Monthly Economic Report data. Shows production efficiency and destruction rates
  by security band (High Sec, Low Sec, Null Sec, etc.). Use this to understand economic health and war consumption
  patterns across different security levels.`,
  parameters: z.object({
    reportMonth: z.string().default('2025-10').describe('Report month in YYYY-MM format'),
    securityBand: z.string().optional().describe('Filter by security band (e.g., "High Sec", "Null Sec (Sov)")'),
  }),
  execute: async ({ reportMonth, securityBand }) => {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not configured');
    }

    const client = new MongoClient(MONGODB_URI);

    try {
      await client.connect();
      const db = client.db(DATABASE_NAME);

      const query: Record<string, unknown> = { report_month: reportMonth };

      if (securityBand) {
        query.security_band = securityBand;
      }

      const economicData = await db.collection('mer_economic_activity')
        .find(query)
        .toArray();

      return {
        reportMonth,
        totalSecurityBands: economicData.length,
        economicActivity: economicData.map((e: any) => ({
          securityBand: e.security_band || e.location_metagroup,
          mined: `${Math.round(e.mined_value / 1_000_000_000)}B ISK`,
          produced: `${Math.round(e.produced_value / 1_000_000_000)}B ISK`,
          destroyed: `${Math.round(e.destroyed_value / 1_000_000_000)}B ISK`,
          productionEfficiency: e.production_efficiency,
          destructionRate: `${(e.destruction_rate * 100).toFixed(1)}%`,
          netWealthCreation: `${Math.round(e.net_wealth_creation / 1_000_000_000)}B ISK`,
          economicHealth: e.economic_health,
          interpretation: e.destruction_rate > 1.0 ? 'Unsustainable - War consuming more than production' :
                         e.destruction_rate > 0.5 ? 'High war consumption' :
                         e.destruction_rate > 0.3 ? 'Moderate activity' : 'Peaceful economy'
        })),
        insights: {
          mostVolatile: economicData.reduce((max: any, current: any) =>
            current.destruction_rate > (max?.destruction_rate || 0) ? current : max, null),
          healthiest: economicData.filter((e: any) => e.economic_health === 'very_healthy')
            .map((e: any) => e.security_band || e.location_metagroup),
          crisis: economicData.filter((e: any) => e.economic_health === 'crisis')
            .map((e: any) => e.security_band || e.location_metagroup)
        }
      };
    } finally {
      await client.close();
    }
  }
};

// Export all tools in a single object for easy import
export const MERTools = {
  getDoctrineShips: getDoctrineShipsTool,
  getWarZones: getWarZonesTool,
  getRegionalEconomics: getRegionalEconomicsTool,
  getMiningActivity: getMiningActivityTool,
  getEconomicActivity: getEconomicActivityTool
};

export default MERTools;
