"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
// Define CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};
const handler = async (event) => {
    console.log('🔍 Auth verify function called with method:', event.httpMethod);
    // Handle OPTIONS request (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        console.log('🔍 Handling CORS preflight request');
        return {
            statusCode: 204,
            headers: corsHeaders,
            body: ''
        };
    }
    if (event.httpMethod !== 'POST') {
        console.log('🔍 Method not allowed:', event.httpMethod);
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }
    try {
        console.log('🔍 Auth verify function called');
        const { accessToken } = JSON.parse(event.body || '{}');
        console.log('🔍 Access token received:', accessToken ? 'Yes' : 'No');
        if (!accessToken) {
            console.log('🔍 Missing access token');
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Missing access token' }),
            };
        }
        console.log('🔍 Calling EVE SSO verify endpoint');
        // Fixed URL to use v2 endpoint
        const response = await fetch('https://login.eveonline.com/v2/oauth/verify', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        console.log('🔍 EVE SSO verify response status:', response.status);
        if (!response.ok) {
            console.error('🔍 EVE SSO verify failed:', response.status, response.statusText);
            return {
                statusCode: response.status,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: 'Failed to verify token',
                    status: response.status,
                    statusText: response.statusText
                }),
            };
        }
        const data = await response.json();
        console.log('🔍 EVE SSO verify data received:', JSON.stringify(data));
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(data),
        };
    }
    catch (error) {
        console.error('🔍 Auth verify error:', error);
        // More detailed error response
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            }),
        };
    }
};
exports.handler = handler;
