/**
 * ESI (EVE Swagger Interface) Service
 * Fetches live corporation data from EVE Online's public API
 */

export interface CorporationPublicInfo {
  alliance_id?: number;
  ceo_id: number;
  creator_id: number;
  date_founded: string;
  description?: string;
  faction_id?: number;
  home_station_id?: number;
  member_count: number;
  name: string;
  shares?: number;
  tax_rate: number;
  ticker: string;
  url?: string;
  war_eligible?: boolean;
}

export interface CorporationContext {
  corporationInfo: CorporationPublicInfo;
  fetchedAt: Date;
  corporationId: number;
}

/**
 * Fetch corporation public information from ESI
 */
export async function fetchCorporationInfo(corporationId: number | string): Promise<CorporationPublicInfo> {
  const corpId = typeof corporationId === 'string' ? parseInt(corporationId) : corporationId;

  if (isNaN(corpId) || corpId <= 0) {
    throw new Error(`Invalid corporation ID: ${corporationId}`);
  }

  try {
    const response = await fetch(
      `https://esi.evetech.net/latest/corporations/${corpId}/`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Gryyk-47 EVE AI Assistant'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Corporation ${corpId} not found`);
      }
      throw new Error(`ESI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as CorporationPublicInfo;
  } catch (error) {
    console.error(`Failed to fetch corporation ${corpId} from ESI:`, error);
    throw error;
  }
}

/**
 * Build comprehensive corporation context for AI agents
 */
export async function buildCorporationContext(corporationId: number | string): Promise<CorporationContext> {
  const corporationInfo = await fetchCorporationInfo(corporationId);

  return {
    corporationInfo,
    fetchedAt: new Date(),
    corporationId: typeof corporationId === 'string' ? parseInt(corporationId) : corporationId
  };
}

/**
 * Format corporation context as text for AI consumption
 */
export function formatCorporationContextForAI(context: CorporationContext): string {
  const info = context.corporationInfo;

  return `
CORPORATION LIVE DATA (from EVE Online ESI API)
Fetched: ${context.fetchedAt.toISOString()}

Corporation: ${info.name} [${info.ticker}]
Corporation ID: ${context.corporationId}
CEO ID: ${info.ceo_id}
Founded: ${info.date_founded}
Member Count: ${info.member_count}
Tax Rate: ${(info.tax_rate * 100).toFixed(1)}%
${info.alliance_id ? `Alliance ID: ${info.alliance_id}` : 'Alliance: Independent'}
${info.description ? `Description: ${info.description}` : ''}
${info.war_eligible !== undefined ? `War Eligible: ${info.war_eligible ? 'Yes' : 'No'}` : ''}

This is real-time data from the EVE Online servers. Base your recommendations on these actual statistics.
`.trim();
}

/**
 * Get corporation context or use default for invalid IDs
 */
export async function getCorporationContextSafe(corporationId: string): Promise<{
  context: CorporationContext | null;
  contextText: string;
  isValid: boolean;
}> {
  // Handle default/invalid corporation IDs
  if (!corporationId || corporationId === 'default-corp') {
    return {
      context: null,
      contextText: 'No corporation context available. Providing general EVE Online strategic advice.',
      isValid: false
    };
  }

  try {
    const context = await buildCorporationContext(corporationId);
    return {
      context,
      contextText: formatCorporationContextForAI(context),
      isValid: true
    };
  } catch (error) {
    console.error(`Failed to load corporation context for ${corporationId}:`, error);
    return {
      context: null,
      contextText: `Corporation ID ${corporationId} could not be loaded from ESI. Providing general advice without live data.`,
      isValid: false
    };
  }
}

/**
 * CEO Dashboard Data Interfaces
 */

export interface CorporationWalletBalance {
  division: number;
  balance: number;
}

export interface CorporationMemberTracking {
  character_id: number;
  location_id?: number;
  logoff_date?: string;
  logon_date?: string;
  ship_type_id?: number;
  start_date?: string;
}

export interface CorporationStructure {
  structure_id: number;
  type_id: number;
  system_id: number;
  profile_id: number;
  fuel_expires?: string;
  next_reinforce_hour?: number;
  next_reinforce_apply?: string;
  state: string;
  state_timer_end?: string;
  state_timer_start?: string;
  unanchors_at?: string;
  services?: Array<{
    name: string;
    state: string;
  }>;
}

export interface CEODashboardData {
  corporationInfo: CorporationPublicInfo;
  wallets?: CorporationWalletBalance[];
  memberTracking?: CorporationMemberTracking[];
  structures?: CorporationStructure[];
  fetchedAt: Date;
}

/**
 * Fetch corporation wallet balances (requires auth token with wallet scope)
 */
export async function fetchCorporationWallets(
  corporationId: number,
  accessToken: string
): Promise<CorporationWalletBalance[]> {
  try {
    const response = await fetch(
      `https://esi.evetech.net/latest/corporations/${corporationId}/wallets/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'Gryyk-47 EVE AI Assistant'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch corporation wallets: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch corporation wallets:', error);
    return [];
  }
}

/**
 * Fetch corporation member tracking (requires auth token with member tracking scope)
 */
export async function fetchCorporationMemberTracking(
  corporationId: number,
  accessToken: string
): Promise<CorporationMemberTracking[]> {
  try {
    const response = await fetch(
      `https://esi.evetech.net/latest/corporations/${corporationId}/membertracking/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'Gryyk-47 EVE AI Assistant'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch member tracking: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch member tracking:', error);
    return [];
  }
}

/**
 * Fetch corporation structures (requires auth token with structures scope)
 */
export async function fetchCorporationStructures(
  corporationId: number,
  accessToken: string
): Promise<CorporationStructure[]> {
  try {
    const response = await fetch(
      `https://esi.evetech.net/latest/corporations/${corporationId}/structures/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'Gryyk-47 EVE AI Assistant'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch corporation structures: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch corporation structures:', error);
    return [];
  }
}

/**
 * Build complete CEO dashboard data
 */
export async function buildCEODashboardData(
  corporationId: number,
  accessToken?: string
): Promise<CEODashboardData> {
  // Always fetch public info
  const corporationInfo = await fetchCorporationInfo(corporationId);

  // Fetch authenticated data if token provided
  const dashboardData: CEODashboardData = {
    corporationInfo,
    fetchedAt: new Date()
  };

  if (accessToken) {
    const [wallets, memberTracking, structures] = await Promise.allSettled([
      fetchCorporationWallets(corporationId, accessToken),
      fetchCorporationMemberTracking(corporationId, accessToken),
      fetchCorporationStructures(corporationId, accessToken)
    ]);

    if (wallets.status === 'fulfilled') {
      dashboardData.wallets = wallets.value;
    }

    if (memberTracking.status === 'fulfilled') {
      dashboardData.memberTracking = memberTracking.value;
    }

    if (structures.status === 'fulfilled') {
      dashboardData.structures = structures.value;
    }
  }

  return dashboardData;
}
