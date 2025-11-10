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
