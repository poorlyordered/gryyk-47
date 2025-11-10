import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { MongoClient } from 'mongodb';

/**
 * Weekly ESI Data Synchronization
 *
 * This scheduled function runs once per week to sync corporation data
 * for all active corporations in the system.
 *
 * Schedule: Every Sunday at 00:00 UTC
 *
 * To enable this function, add to netlify.toml:
 *
 * [[functions."weekly-esi-sync"]]
 *   schedule = "@weekly"
 */

interface CorporationSnapshot {
  corporationId: number;
  corporationName: string;
  memberCount: number;
  taxRate: number;
  allianceId?: number;
  timestamp: Date;
  metrics: {
    totalWalletBalance?: number;
    activeMembers?: number;
    totalStructures?: number;
  };
}

const handler: Handler = async (_event: HandlerEvent, _context: HandlerContext) => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database configuration missing' })
    };
  }

  let client: MongoClient | null = null;

  try {
    console.log('🔄 Starting weekly ESI data synchronization');
    console.log(`📅 Triggered at: ${new Date().toISOString()}`);

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('gryyk47');

    // Get all active corporations (those with recent activity)
    const authCollection = db.collection('auth_sessions');
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const activeCorporations = await authCollection
      .aggregate([
        {
          $match: {
            lastActivity: { $gte: oneWeekAgo }
          }
        },
        {
          $group: {
            _id: '$corporationId',
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();

    console.log(`📊 Found ${activeCorporations.length} active corporations to sync`);

    if (activeCorporations.length === 0) {
      console.log('ℹ️  No active corporations found, skipping sync');
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No active corporations to sync',
          corporationsSynced: 0
        })
      };
    }

    const snapshotsCollection = db.collection('corporation_snapshots');
    const snapshots: CorporationSnapshot[] = [];

    // Fetch and store snapshot for each active corporation
    for (const corp of activeCorporations) {
      try {
        const corporationId = corp._id;

        // Fetch public corporation data from ESI
        const response = await fetch(
          `https://esi.evetech.net/latest/corporations/${corporationId}/`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Gryyk-47 EVE AI Assistant'
            }
          }
        );

        if (!response.ok) {
          console.warn(`⚠️  Failed to fetch data for corporation ${corporationId}: ${response.status}`);
          continue;
        }

        const corpData = await response.json();

        const snapshot: CorporationSnapshot = {
          corporationId,
          corporationName: corpData.name,
          memberCount: corpData.member_count,
          taxRate: corpData.tax_rate,
          allianceId: corpData.alliance_id,
          timestamp: new Date(),
          metrics: {
            // Public API only provides basic metrics
            // Authenticated metrics would require stored access tokens
          }
        };

        snapshots.push(snapshot);
        console.log(`✅ Synced ${corpData.name} [${corpData.ticker}] - ${corpData.member_count} members`);

      } catch (error) {
        console.error(`❌ Error syncing corporation ${corp._id}:`, error);
      }
    }

    // Store snapshots in MongoDB
    if (snapshots.length > 0) {
      await snapshotsCollection.insertMany(snapshots);
      console.log(`💾 Stored ${snapshots.length} corporation snapshots`);
    }

    // Clean up old snapshots (keep last 52 weeks = 1 year)
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const deleteResult = await snapshotsCollection.deleteMany({
      timestamp: { $lt: oneYearAgo }
    });

    console.log(`🗑️  Cleaned up ${deleteResult.deletedCount} old snapshots`);

    console.log('✨ Weekly ESI sync completed successfully');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Weekly ESI sync completed',
        corporationsSynced: snapshots.length,
        snapshotsStored: snapshots.length,
        oldSnapshotsDeleted: deleteResult.deletedCount,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Weekly ESI sync failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Weekly ESI sync failed',
        details: error instanceof Error ? error.message : String(error)
      })
    };

  } finally {
    // Close MongoDB connection
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
};

export { handler };
