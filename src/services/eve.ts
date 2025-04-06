import { jwtDecode } from 'jwt-decode';

interface EveJWT {
  sub: string;
  name: string;
  owner: string;
  characterID: number;
  scp?: string[];
}

interface CharacterInfo {
  CharacterID: number;
  CharacterName: string;
  ExpiresOn: string;
  Scopes: string;
  TokenType: string;
  CharacterOwnerHash: string;
  IntellectualProperty: string;
}

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
  characterId: string;
}

export const verifyToken = async (token: string): Promise<{characterId: string} | null> => {
  try {
    const decoded = jwtDecode<EveJWT>(token);
    return {
      characterId: decoded.characterID.toString()
    };
  } catch (err) {
    console.error('Token verification failed:', err);
    return null;
  }
};

export const exchangeRefreshToken = async (refreshToken: string): Promise<TokenData> => {
  // TODO: Implement actual EVE SSO token exchange
  // For now return mock data with required fields
  return {
    accessToken: 'mock-access-token',
    refreshToken: refreshToken,
    expiresAt: Date.now() + 3600 * 1000,
    scopes: ['esi-characters.read_standings.v1'],
    characterId: '123456789' // Mock character ID
  };
};
/**
 * Generate the EVE SSO OAuth2 authorization URL
 */
export function generateAuthUrl(state: string = ''): string {
  const baseUrl = 'https://login.eveonline.com/v2/oauth/authorize';
  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: 'https://gryyk-47.netlify.app/callback',
    client_id: '171210e5cb0541db8069ec6c4db7f0d5',
    scope: [
      "publicData",
      "esi-calendar.respond_calendar_events.v1",
      "esi-calendar.read_calendar_events.v1",
      "esi-location.read_location.v1",
      "esi-location.read_ship_type.v1",
      "esi-mail.organize_mail.v1",
      "esi-mail.read_mail.v1",
      "esi-mail.send_mail.v1",
      "esi-skills.read_skills.v1",
      "esi-skills.read_skillqueue.v1",
      "esi-wallet.read_character_wallet.v1",
      "esi-wallet.read_corporation_wallet.v1",
      "esi-search.search_structures.v1",
      "esi-clones.read_clones.v1",
      "esi-characters.read_contacts.v1",
      "esi-universe.read_structures.v1",
      "esi-killmails.read_killmails.v1",
      "esi-corporations.read_corporation_membership.v1",
      "esi-assets.read_assets.v1",
      "esi-planets.manage_planets.v1",
      "esi-fleets.read_fleet.v1",
      "esi-fleets.write_fleet.v1",
      "esi-ui.open_window.v1",
      "esi-ui.write_waypoint.v1",
      "esi-characters.write_contacts.v1",
      "esi-fittings.read_fittings.v1",
      "esi-fittings.write_fittings.v1",
      "esi-markets.structure_markets.v1",
      "esi-corporations.read_structures.v1",
      "esi-characters.read_loyalty.v1",
      "esi-characters.read_chat_channels.v1",
      "esi-characters.read_medals.v1",
      "esi-characters.read_standings.v1",
      "esi-characters.read_agents_research.v1",
      "esi-industry.read_character_jobs.v1",
      "esi-markets.read_character_orders.v1",
      "esi-characters.read_blueprints.v1",
      "esi-characters.read_corporation_roles.v1",
      "esi-location.read_online.v1",
      "esi-contracts.read_character_contracts.v1",
      "esi-clones.read_implants.v1",
      "esi-characters.read_fatigue.v1",
      "esi-killmails.read_corporation_killmails.v1",
      "esi-corporations.track_members.v1",
      "esi-wallet.read_corporation_wallets.v1",
      "esi-characters.read_notifications.v1",
      "esi-corporations.read_divisions.v1",
      "esi-corporations.read_contacts.v1",
      "esi-assets.read_corporation_assets.v1",
      "esi-corporations.read_titles.v1",
      "esi-corporations.read_blueprints.v1",
      "esi-contracts.read_corporation_contracts.v1",
      "esi-corporations.read_standings.v1",
      "esi-corporations.read_starbases.v1",
      "esi-industry.read_corporation_jobs.v1",
      "esi-markets.read_corporation_orders.v1",
      "esi-corporations.read_container_logs.v1",
      "esi-industry.read_character_mining.v1",
      "esi-industry.read_corporation_mining.v1",
      "esi-planets.read_customs_offices.v1",
      "esi-corporations.read_facilities.v1",
      "esi-corporations.read_medals.v1",
      "esi-characters.read_titles.v1",
      "esi-alliances.read_contacts.v1",
      "esi-characters.read_fw_stats.v1",
      "esi-corporations.read_fw_stats.v1",
      "esi-characterstats.read.v1"
    ].join(' '),
    state
  });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeAuthCode(code: string): Promise<TokenData> {
  const tokenUrl = 'https://login.eveonline.com/v2/oauth/token';
  const credentials = btoa('171210e5cb0541db8069ec6c4db7f0d5:2U15oaS3SN1D2x0l3gHXGHXAV4oa3SoOZsXUDuBy');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://gryyk-47.netlify.app/callback'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to exchange auth code');
  }

  const data = await response.json();

  const decoded = jwtDecode<EveJWT>(data.access_token);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scopes: typeof data.scope === 'string' ? data.scope.split(' ') : [],
    characterId: decoded.characterID.toString()
  };
}

/**
 * Get character info from EVE SSO using access token
 */
export async function getCharacterInfo(accessToken: string): Promise<CharacterInfo> {
  const response = await fetch('https://login.eveonline.com/oauth/verify', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch character info');
  }

  return response.json();
}
