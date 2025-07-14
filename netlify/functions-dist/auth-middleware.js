"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateEveUser = exports.extractUserInfo = exports.verifyEveToken = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
// EVE Online SSO configuration
const EVE_CLIENT_ID = process.env.EVE_CLIENT_ID;
const EVE_CLIENT_SECRET = process.env.EVE_CLIENT_SECRET;
const EVE_SSO_TOKEN_URL = 'https://login.eveonline.com/v2/oauth/token';
const EVE_SSO_VERIFY_URL = 'https://login.eveonline.com/v2/oauth/verify';
// Verify an EVE Online JWT token
const verifyEveToken = async (token) => {
    if (!EVE_CLIENT_ID || !EVE_CLIENT_SECRET) {
        throw new Error('EVE Online SSO credentials not configured');
    }
    try {
        // Verify the token with EVE Online SSO
        const response = await (0, node_fetch_1.default)(EVE_SSO_VERIFY_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`EVE SSO verification failed: ${response.statusText}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error('Token verification error:', error);
        throw new Error('Failed to verify EVE Online token');
    }
};
exports.verifyEveToken = verifyEveToken;
// Extract user information from the EVE Online verification response
const extractUserInfo = (verifyResponse) => {
    return {
        userId: verifyResponse.CharacterOwnerHash, // Use the character owner hash as the user ID
        characterId: verifyResponse.CharacterID,
        characterName: verifyResponse.CharacterName,
        expiresOn: verifyResponse.ExpiresOn,
        scopes: verifyResponse.Scopes.split(' ')
    };
};
exports.extractUserInfo = extractUserInfo;
// Authenticate a user using the EVE Online SSO
const authenticateEveUser = async (headers) => {
    // Get the authorization header
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid authorization header');
    }
    // Extract the token
    const token = authHeader.split(' ')[1];
    if (!token) {
        throw new Error('Missing token');
    }
    // Verify the token and extract user information
    const verifyResponse = await (0, exports.verifyEveToken)(token);
    return (0, exports.extractUserInfo)(verifyResponse);
};
exports.authenticateEveUser = authenticateEveUser;
