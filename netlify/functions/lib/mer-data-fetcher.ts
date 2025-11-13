/**
 * MER Data Fetcher for Specialist Agents
 *
 * Fetches relevant Monthly Economic Report data from MongoDB
 * to provide specialists with real EVE Online market intelligence
 */

import { MongoClient } from 'mongodb';
import type { SpecialistType } from './orchestration-engine';

export interface MERDoctrineShip {
  report_month: string;
  region_name: string;
  ship_type_name: string;
  ship_group_name: string;
  loss_count: number;
  total_isk: number;
  avg_isk: number;
  avg_isk_millions: number;
  demand_score: number;
  manufacturing_opportunity_score: number;
  is_doctrine: boolean;
}

export interface MERRegionalEconomics {
  report_month: string;
  region_name: string;
  destroyed_value: number;
  mined_value: number;
  produced_value: number;
  trade_value: number;
  war_intensity: number;
  industrial_capacity: number;
  net_wealth_creation: number;
  economic_profile: string;
  trade_activity: string;
  pve_activity: string;
}

export interface MERMiningActivity {
  report_month: string;
  region_name: string;
  total_mined_m3: number;
  supply_capacity: string;
  efficiency_rate: number;
}

export interface MERWarZone {
  report_month: string;
  region_name: string;
  total_isk_destroyed: number;
  war_intensity: number;
  conflict_level: string;
}

export interface MERContext {
  reportMonth: string | null;
  doctrineShips?: MERDoctrineShip[];
  regionalEconomics?: MERRegionalEconomics[];
  miningActivity?: MERMiningActivity[];
  warZones?: MERWarZone[];
}

/**
 * Get the latest report month from MER data
 */
async function getLatestReportMonth(mongoUri: string): Promise<string | null> {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('eve_ai');

    const latestDoc = await db.collection('mer_doctrine_ships')
      .findOne({}, { sort: { report_month: -1 }, projection: { report_month: 1 } });

    return latestDoc?.report_month || null;

  } catch (error) {
    console.warn('Failed to get latest MER report month:', error);
    return null;
  } finally {
    await client.close();
  }
}

/**
 * Fetch MER context for Economic Specialist
 */
async function fetchEconomicMERContext(
  reportMonth: string,
  mongoUri: string
): Promise<Partial<MERContext>> {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('eve_ai');

    const [doctrineShips, regionalEconomics, warZones] = await Promise.all([
      // Top 10 doctrine ships by manufacturing opportunity
      db.collection<MERDoctrineShip>('mer_doctrine_ships')
        .find({ report_month: reportMonth })
        .sort({ manufacturing_opportunity_score: -1 })
        .limit(10)
        .toArray(),

      // Top regions by economic activity
      db.collection<MERRegionalEconomics>('mer_regional_economics')
        .find({ report_month: reportMonth })
        .sort({ net_wealth_creation: -1 })
        .limit(10)
        .toArray(),

      // Active war zones
      db.collection<MERWarZone>('mer_war_zones')
        .find({ report_month: reportMonth })
        .sort({ total_isk_destroyed: -1 })
        .limit(10)
        .toArray()
    ]);

    return {
      doctrineShips,
      regionalEconomics,
      warZones
    };

  } catch (error) {
    console.warn('Failed to fetch economic MER context:', error);
    return {};
  } finally {
    await client.close();
  }
}

/**
 * Fetch MER context for Market Specialist
 */
async function fetchMarketMERContext(
  reportMonth: string,
  mongoUri: string
): Promise<Partial<MERContext>> {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('eve_ai');

    const [doctrineShips, regionalEconomics] = await Promise.all([
      // High-value, high-volume doctrine ships (trading opportunities)
      db.collection<MERDoctrineShip>('mer_doctrine_ships')
        .find({
          report_month: reportMonth,
          avg_isk_millions: { $gt: 50 }, // Ships worth >50M ISK
          loss_count: { $gt: 200 } // High volume (>200 losses/month)
        })
        .sort({ loss_count: -1 })
        .limit(15)
        .toArray(),

      // Regions with high trade activity
      db.collection<MERRegionalEconomics>('mer_regional_economics')
        .find({
          report_month: reportMonth,
          trade_activity: { $in: ['high', 'very_high'] }
        })
        .sort({ trade_value: -1 })
        .limit(10)
        .toArray()
    ]);

    return {
      doctrineShips,
      regionalEconomics
    };

  } catch (error) {
    console.warn('Failed to fetch market MER context:', error);
    return {};
  } finally {
    await client.close();
  }
}

/**
 * Fetch MER context for Mining Specialist
 */
async function fetchMiningMERContext(
  reportMonth: string,
  mongoUri: string
): Promise<Partial<MERContext>> {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('eve_ai');

    const [miningActivity, regionalEconomics] = await Promise.all([
      // Top mining regions
      db.collection<MERMiningActivity>('mer_mining_activity')
        .find({ report_month: reportMonth })
        .sort({ total_mined_m3: -1 })
        .limit(15)
        .toArray(),

      // Regions with high industrial capacity (good for miners)
      db.collection<MERRegionalEconomics>('mer_regional_economics')
        .find({
          report_month: reportMonth,
          industrial_capacity: { $gt: 0.7 }
        })
        .sort({ industrial_capacity: -1 })
        .limit(10)
        .toArray()
    ]);

    return {
      miningActivity,
      regionalEconomics
    };

  } catch (error) {
    console.warn('Failed to fetch mining MER context:', error);
    return {};
  } finally {
    await client.close();
  }
}

/**
 * Fetch relevant MER context for a specialist
 */
export async function fetchMERContext(
  specialist: SpecialistType,
  mongoUri: string
): Promise<MERContext> {
  // Get latest report month
  const reportMonth = await getLatestReportMonth(mongoUri);

  if (!reportMonth) {
    console.warn('No MER data available');
    return { reportMonth: null };
  }

  console.log(`  📊 Fetching MER data for ${specialist} specialist (${reportMonth})`);

  let context: Partial<MERContext> = {};

  // Fetch specialist-specific data
  switch (specialist) {
    case 'economic':
      context = await fetchEconomicMERContext(reportMonth, mongoUri);
      break;

    case 'market':
      context = await fetchMarketMERContext(reportMonth, mongoUri);
      break;

    case 'mining':
      context = await fetchMiningMERContext(reportMonth, mongoUri);
      break;

    case 'recruiting':
    case 'mission':
      // These specialists don't need MER data currently
      break;
  }

  return {
    reportMonth,
    ...context
  };
}

/**
 * Format MER context as text for specialist prompts
 */
export function formatMERContext(merContext: MERContext): string {
  if (!merContext.reportMonth) {
    return '';
  }

  let formatted = `\n\n=== EVE ONLINE MARKET DATA (${merContext.reportMonth} MER) ===\n`;

  // Format doctrine ships
  if (merContext.doctrineShips && merContext.doctrineShips.length > 0) {
    formatted += `\nTOP DOCTRINE SHIPS (Manufacturing/Trading Opportunities):\n`;
    merContext.doctrineShips.slice(0, 10).forEach((ship, index) => {
      formatted += `${index + 1}. ${ship.ship_type_name} (${ship.ship_group_name})\n`;
      formatted += `   - Losses: ${ship.loss_count.toLocaleString()}/month\n`;
      formatted += `   - Avg Value: ${ship.avg_isk_millions.toFixed(1)}M ISK\n`;
      formatted += `   - Manufacturing Score: ${ship.manufacturing_opportunity_score.toFixed(1)}/10\n`;
      formatted += `   - Primary Region: ${ship.region_name}\n`;
    });
  }

  // Format regional economics
  if (merContext.regionalEconomics && merContext.regionalEconomics.length > 0) {
    formatted += `\nREGIONAL ECONOMIC ACTIVITY:\n`;
    merContext.regionalEconomics.slice(0, 8).forEach((region, index) => {
      formatted += `${index + 1}. ${region.region_name}\n`;
      formatted += `   - Profile: ${region.economic_profile}\n`;
      formatted += `   - War Intensity: ${region.war_intensity.toFixed(2)}x\n`;
      formatted += `   - Industrial Capacity: ${(region.industrial_capacity * 100).toFixed(0)}%\n`;
      formatted += `   - Trade Activity: ${region.trade_activity}\n`;
      if (region.net_wealth_creation) {
        const wealthB = (region.net_wealth_creation / 1_000_000_000).toFixed(1);
        formatted += `   - Net Wealth: ${wealthB}B ISK\n`;
      }
    });
  }

  // Format war zones
  if (merContext.warZones && merContext.warZones.length > 0) {
    formatted += `\nACTIVE WAR ZONES (High ISK Destruction):\n`;
    merContext.warZones.slice(0, 6).forEach((zone, index) => {
      const destroyedB = (zone.total_isk_destroyed / 1_000_000_000).toFixed(1);
      formatted += `${index + 1}. ${zone.region_name}: ${destroyedB}B ISK destroyed, Intensity: ${zone.war_intensity.toFixed(2)}x\n`;
    });
  }

  // Format mining activity
  if (merContext.miningActivity && merContext.miningActivity.length > 0) {
    formatted += `\nMINING ACTIVITY (Supply Sources):\n`;
    merContext.miningActivity.slice(0, 8).forEach((region, index) => {
      const minedB = (region.total_mined_m3 / 1_000_000_000).toFixed(1);
      formatted += `${index + 1}. ${region.region_name}\n`;
      formatted += `   - Mined: ${minedB}B m³\n`;
      formatted += `   - Supply Capacity: ${region.supply_capacity}\n`;
      formatted += `   - Efficiency: ${(region.efficiency_rate * 100).toFixed(0)}%\n`;
    });
  }

  formatted += `\n=== END MER DATA ===\n`;

  return formatted;
}
