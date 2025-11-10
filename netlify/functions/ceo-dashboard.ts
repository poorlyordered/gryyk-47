import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { buildCEODashboardData } from '../../mastra/services/esi-service';

/**
 * CEO Dashboard Data Endpoint
 * Fetches comprehensive corporation data for CEO dashboard
 */
const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { corporationId, accessToken } = JSON.parse(event.body || '{}');

    if (!corporationId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Corporation ID is required' })
      };
    }

    console.log(`📊 Fetching CEO dashboard data for corporation: ${corporationId}`);

    // Fetch comprehensive dashboard data
    const dashboardData = await buildCEODashboardData(
      parseInt(corporationId),
      accessToken
    );

    // Calculate additional metrics
    const metrics = {
      totalWalletBalance: dashboardData.wallets?.reduce((sum, w) => sum + w.balance, 0) || 0,
      activeMembers: dashboardData.memberTracking?.filter(m => {
        if (!m.logon_date) return false;
        const lastLogon = new Date(m.logon_date);
        const daysSinceLogon = (Date.now() - lastLogon.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLogon <= 7; // Active within last 7 days
      }).length || 0,
      totalStructures: dashboardData.structures?.length || 0,
      onlineStructures: dashboardData.structures?.filter(s => s.state === 'online').length || 0
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...dashboardData,
        metrics
      })
    };

  } catch (error) {
    console.error('CEO Dashboard Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch CEO dashboard data',
        details: error instanceof Error ? error.message : String(error)
      })
    };
  }
};

export { handler };
