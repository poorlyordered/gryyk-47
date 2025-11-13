/**
 * ESI Data Collection for Monthly Cycles
 *
 * Collects comprehensive corporation data from EVE Online ESI API
 * for monthly analysis and reporting
 */

import { MongoClient } from 'mongodb';

export interface ESICycleSnapshot {
  corporationId: string;
  cycle: string; // "2025-11"
  collectedAt: Date;
  data: {
    corporationInfo: {
      name: string;
      ticker: string;
      memberCount: number;
      ceoId: number;
      taxRate: number;
      allianceId?: number;
      founded: string;
    };
    wallet?: {
      balance: number;
      divisions: any[];
    };
    members?: {
      total: number;
      active: number; // Active in last 7 days
      memberList: Array<{
        characterId: number;
        joinDate: string;
        lastLogin?: string;
        lastLogoff?: string;
      }>;
    };
    structures?: {
      total: number;
      structureList: any[];
    };
    marketOrders?: {
      total: number;
      totalValue: number;
    };
    industryJobs?: {
      total: number;
      active: number;
    };
  };
  errors: string[];
}

/**
 * Fetch corporation basic info from ESI
 */
async function fetchCorporationInfo(corporationId: string): Promise<any> {
  const response = await fetch(
    `https://esi.evetech.net/latest/corporations/${corporationId}/`,
    {
      headers: {
        'User-Agent': 'Gryyk-47 EVE AI Assistant',
      }
    }
  );

  if (!response.ok) {
    throw new Error(`ESI error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch corporation members with tracking data (requires auth)
 */
async function fetchCorporationMembers(
  corporationId: string,
  accessToken?: string
): Promise<any[]> {
  if (!accessToken) {
    console.warn('No access token provided, skipping member tracking data');
    return [];
  }

  try {
    // Get member list
    const membersResponse = await fetch(
      `https://esi.evetech.net/latest/corporations/${corporationId}/members/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Gryyk-47 EVE AI Assistant'
        }
      }
    );

    if (!membersResponse.ok) {
      throw new Error(`ESI members error: ${membersResponse.status}`);
    }

    const _memberIds = await membersResponse.json();

    // Get member tracking
    const trackingResponse = await fetch(
      `https://esi.evetech.net/latest/corporations/${corporationId}/membertracking/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Gryyk-47 EVE AI Assistant'
        }
      }
    );

    if (!trackingResponse.ok) {
      throw new Error(`ESI tracking error: ${trackingResponse.status}`);
    }

    const tracking = await trackingResponse.json();

    return tracking;

  } catch (error) {
    console.error('Failed to fetch member data:', error);
    return [];
  }
}

/**
 * Calculate member activity (active in last 7 days)
 */
function calculateMemberActivity(members: any[]): { total: number; active: number } {
  if (!members || members.length === 0) {
    return { total: 0, active: 0 };
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const active = members.filter(member => {
    if (!member.logoff_date) return false;
    const logoffDate = new Date(member.logoff_date);
    return logoffDate > sevenDaysAgo;
  }).length;

  return {
    total: members.length,
    active
  };
}

/**
 * Collect comprehensive ESI snapshot for a corporation
 */
export async function collectESISnapshot(
  corporationId: string,
  cycle: string,
  accessToken?: string
): Promise<ESICycleSnapshot> {
  console.log(`📊 Collecting ESI snapshot for corporation ${corporationId}, cycle ${cycle}`);

  const errors: string[] = [];
  const snapshot: ESICycleSnapshot = {
    corporationId,
    cycle,
    collectedAt: new Date(),
    data: {
      corporationInfo: {
        name: '',
        ticker: '',
        memberCount: 0,
        ceoId: 0,
        taxRate: 0,
        founded: ''
      }
    },
    errors
  };

  try {
    // 1. Fetch corporation basic info (public, no auth needed)
    console.log('  → Fetching corporation info...');
    const corpInfo = await fetchCorporationInfo(corporationId);

    snapshot.data.corporationInfo = {
      name: corpInfo.name,
      ticker: corpInfo.ticker,
      memberCount: corpInfo.member_count,
      ceoId: corpInfo.ceo_id,
      taxRate: corpInfo.tax_rate,
      allianceId: corpInfo.alliance_id,
      founded: corpInfo.date_founded
    };

    console.log(`  ✓ Corporation: ${corpInfo.name} [${corpInfo.ticker}]`);

  } catch (error) {
    const errorMsg = `Failed to fetch corporation info: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errors.push(errorMsg);
    console.error(`  ✗ ${errorMsg}`);
  }

  // 2. Fetch member data (requires auth)
  if (accessToken) {
    try {
      console.log('  → Fetching member tracking data...');
      const members = await fetchCorporationMembers(corporationId, accessToken);

      const activity = calculateMemberActivity(members);

      snapshot.data.members = {
        total: activity.total,
        active: activity.active,
        memberList: members.map(m => ({
          characterId: m.character_id,
          joinDate: m.start_date,
          lastLogin: m.logon_date,
          lastLogoff: m.logoff_date
        }))
      };

      console.log(`  ✓ Members: ${activity.total} total, ${activity.active} active`);

    } catch (error) {
      const errorMsg = `Failed to fetch member data: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(`  ✗ ${errorMsg}`);
    }
  } else {
    console.log('  ⚠ Skipping member tracking (no access token)');
    errors.push('No access token provided for member tracking');
  }

  // 3. Additional data collection can be added here
  // (wallet, structures, market orders, etc. all require specific scopes)

  console.log(`📊 ESI snapshot complete for ${corporationId}`);
  console.log(`   Collected: ${Object.keys(snapshot.data).length} data categories`);
  console.log(`   Errors: ${errors.length}`);

  return snapshot;
}

/**
 * Store ESI snapshot in MongoDB
 */
export async function storeESISnapshot(
  snapshot: ESICycleSnapshot,
  mongoUri: string
): Promise<void> {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('gryyk47');

    await db.collection<ESICycleSnapshot>('esi_cycle_snapshots').insertOne(snapshot);

    console.log(`✅ ESI snapshot stored for ${snapshot.corporationId} - ${snapshot.cycle}`);

  } finally {
    await client.close();
  }
}

/**
 * Get ESI snapshot for a specific cycle
 */
export async function getESISnapshot(
  corporationId: string,
  cycle: string,
  mongoUri: string
): Promise<ESICycleSnapshot | null> {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('gryyk47');

    const snapshot = await db.collection<ESICycleSnapshot>('esi_cycle_snapshots')
      .findOne({ corporationId, cycle });

    return snapshot;

  } finally {
    await client.close();
  }
}

/**
 * Compare two snapshots to calculate changes
 */
export function compareSnapshots(
  current: ESICycleSnapshot,
  previous: ESICycleSnapshot | null
): {
  memberGrowth: number;
  memberGrowthPercent: number;
  activityChange: number;
} {
  if (!previous) {
    return {
      memberGrowth: 0,
      memberGrowthPercent: 0,
      activityChange: 0
    };
  }

  const currentMembers = current.data.members?.total || 0;
  const previousMembers = previous.data.members?.total || 0;
  const memberGrowth = currentMembers - previousMembers;
  const memberGrowthPercent = previousMembers > 0
    ? (memberGrowth / previousMembers) * 100
    : 0;

  const currentActive = current.data.members?.active || 0;
  const previousActive = previous.data.members?.active || 0;
  const activityChange = currentActive - previousActive;

  return {
    memberGrowth,
    memberGrowthPercent,
    activityChange
  };
}
