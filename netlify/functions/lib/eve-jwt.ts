import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const EVE_JWKS_URL = new URL('https://login.eveonline.com/oauth/jwks');
const EVE_ISSUERS = ['login.eveonline.com', 'https://login.eveonline.com'];
const EVE_AUDIENCE = process.env.EVE_CLIENT_ID || process.env.VITE_EVE_CLIENT_ID;

const jwks = createRemoteJWKSet(EVE_JWKS_URL);

export interface EveVerifyResponse {
  CharacterID: number;
  CharacterName: string;
  CorporationId?: number;
  CorporationName?: string;
  ExpiresOn: string;
  Scopes: string;
  TokenType: string;
  CharacterOwnerHash: string;
}

interface EveJwtPayload extends JWTPayload {
  azp?: string;
  characterID?: number;
  name?: string;
  owner?: string;
  scp?: string[];
  tenant?: string;
  tier?: string;
}

function getCharacterId(payload: EveJwtPayload): number {
  if (typeof payload.characterID === 'number') {
    return payload.characterID;
  }

  if (typeof payload.sub === 'string') {
    const id = Number.parseInt(payload.sub.split(':').pop() || '', 10);
    if (Number.isFinite(id)) {
      return id;
    }
  }

  throw new Error('EVE access token is missing a character id');
}

export async function verifyEveJwt(accessToken: string): Promise<EveVerifyResponse> {
  const verifyOptions = {
    issuer: EVE_ISSUERS,
    ...(EVE_AUDIENCE ? { audience: EVE_AUDIENCE } : {})
  };

  const { payload } = await jwtVerify(accessToken, jwks, verifyOptions);
  const evePayload = payload as EveJwtPayload;
  const characterId = getCharacterId(evePayload);

  return {
    CharacterID: characterId,
    CharacterName: evePayload.name || 'Unknown Character',
    ExpiresOn: new Date((evePayload.exp || 0) * 1000).toISOString(),
    Scopes: Array.isArray(evePayload.scp) ? evePayload.scp.join(' ') : '',
    TokenType: 'Character',
    CharacterOwnerHash: evePayload.owner || ''
  };
}
