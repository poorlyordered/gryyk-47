"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangeRefreshToken = exports.verifyToken = void 0;
exports.generateAuthUrl = generateAuthUrl;
exports.exchangeAuthCode = exchangeAuthCode;
exports.getCharacterInfo = getCharacterInfo;
const jwt_decode_1 = require("jwt-decode");
const verifyToken = async (token) => {
    try {
        const decoded = (0, jwt_decode_1.jwtDecode)(token);
        return {
            characterId: decoded.characterID.toString()
        };
    }
    catch (err) {
        console.error('Token verification failed:', err);
        return null;
    }
};
exports.verifyToken = verifyToken;
const exchangeRefreshToken = async (refreshToken) => {
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
exports.exchangeRefreshToken = exchangeRefreshToken;
/**
 * Generate the EVE SSO OAuth2 authorization URL
 */
function generateAuthUrl(state = '') {
    const baseUrl = 'https://login.eveonline.com/v2/oauth/authorize';
    const params = new URLSearchParams({
        response_type: 'code',
        redirect_uri: 'https://gryyk-47.netlify.app/callback',
        client_id: '171210e5cb0541db8069ec6c4db7f0d5',
        scope: [
            "publicData",
            "esi-characters.read_contacts.v1",
            "esi-characters.write_contacts.v1",
            "esi-characters.read_loyalty.v1",
            "esi-characters.read_chat_channels.v1",
            "esi-characters.read_medals.v1",
            "esi-characters.read_standings.v1",
            "esi-characters.read_agents_research.v1",
            "esi-characters.read_blueprints.v1",
            "esi-characters.read_corporation_roles.v1",
            "esi-characters.read_fatigue.v1",
            "esi-characters.read_notifications.v1",
            "esi-characters.read_titles.v1",
            "esi-characters.read_fw_stats.v1"
        ].join(' '),
        state
    });
    return `${baseUrl}?${params.toString()}`;
}
/**
 * Exchange authorization code for access and refresh tokens
 */
async function exchangeAuthCode(code) {
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
    console.debug('exchangeAuthCode: token response', data);
    const decoded = (0, jwt_decode_1.jwtDecode)(data.access_token);
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
        scopes: typeof data.scope === 'string' ? data.scope.split(' ') : [],
        characterId: decoded.characterID
            ? decoded.characterID.toString()
            : (decoded.sub?.split(':').pop() ?? '')
    };
}
/**
 * Get character info from EVE SSO using access token
 */
async function getCharacterInfo(accessToken) {
    try {
        console.log('🔍 Calling Netlify function for character info');
        const response = await fetch('/.netlify/functions/auth-verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accessToken })
        });
        if (!response.ok) {
            console.error('🔍 Netlify function failed:', response.status, response.statusText);
            throw new Error('Netlify function failed');
        }
        const data = await response.json();
        console.log('🔍 Character info from Netlify function:', data);
        return data;
    }
    catch (error) {
        console.error('🔍 Netlify function error:', error);
        // Fallback to direct JWT decoding if Netlify function fails
        try {
            console.log('🔍 Falling back to JWT decoding');
            const decoded = (0, jwt_decode_1.jwtDecode)(accessToken);
            const characterId = decoded.characterID ||
                (decoded.sub ? parseInt(decoded.sub.split(':').pop() || '0') : 0);
            const fallbackResponse = {
                CharacterID: characterId,
                CharacterName: decoded.name || 'Unknown Character',
                ExpiresOn: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour from now
                Scopes: decoded.scp ? decoded.scp.join(' ') : '',
                TokenType: 'Character',
                CharacterOwnerHash: decoded.owner || '',
                IntellectualProperty: 'EVE'
            };
            console.log('🔍 Fallback character info:', fallbackResponse);
            return fallbackResponse;
        }
        catch (jwtError) {
            console.error('🔍 JWT decoding error:', jwtError);
            throw new Error('Failed to fetch character info');
        }
    }
}
