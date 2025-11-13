import type { Handler, HandlerEvent } from '@netlify/functions';
import { getCorpsDueForCycle, getCycleStatus, updateCycleStatus, calculateCyclePeriod } from '../lib/cycle-scheduler';
import { collectESISnapshot, storeESISnapshot } from '../lib/esi-cycle-collector';

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

/**
 * Daily Cycle Check - Scheduled Function
 *
 * Runs daily at 00:00 UTC to check if any corporations are due for their cycle
 * If so, initiates ESI data collection for those corporations
 *
 * Configure in netlify.toml:
 * [[scheduled_functions]]
 * path = "/.netlify/functions/daily-cycle-check"
 * schedule = "0 0 * * *"  # Daily at midnight UTC
 */
export const handler: Handler = async (_event: HandlerEvent) => {
  console.log('🕐 Daily cycle check initiated');

  if (!MONGODB_URI) {
    console.error('❌ MongoDB URI not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'MongoDB URI not configured' })
    };
  }

  try {
    // Check which corporations are due for cycle today
    const dueCorps = await getCorpsDueForCycle(MONGODB_URI);

    if (dueCorps.length === 0) {
      console.log('✓ No corporations due for cycle today');
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No corporations due for cycle',
          date: new Date().toISOString()
        })
      };
    }

    console.log(`📅 ${dueCorps.length} corporation(s) due for cycle today`);

    const results = [];

    // Process each corporation
    for (const config of dueCorps) {
      try {
        console.log(`\n🏢 Processing ${config.corporationId}...`);

        // Calculate current cycle period
        const { currentCycle } = calculateCyclePeriod(config.cycleStartDay);

        // Get or create cycle status
        const status = await getCycleStatus(config.corporationId, MONGODB_URI);

        if (!status) {
          console.error(`  ❌ Failed to get cycle status`);
          results.push({
            corporationId: config.corporationId,
            success: false,
            error: 'Failed to get cycle status'
          });
          continue;
        }

        // Check if ESI data already collected for this cycle
        if (status.progress.esiCollected) {
          console.log(`  ⚠ ESI data already collected for cycle ${currentCycle}`);
          results.push({
            corporationId: config.corporationId,
            success: true,
            message: 'ESI data already collected'
          });
          continue;
        }

        // Update status to collecting
        await updateCycleStatus(
          config.corporationId,
          currentCycle,
          { status: 'collecting' },
          MONGODB_URI
        );

        // Collect ESI snapshot
        // Note: We don't have access token here in scheduled function
        // For now, collect public data only
        // TODO: Implement refresh token storage and retrieval for authenticated data
        const snapshot = await collectESISnapshot(
          config.corporationId,
          currentCycle,
          undefined // No access token in scheduled function
        );

        // Store snapshot
        await storeESISnapshot(snapshot, MONGODB_URI);

        // Update status
        await updateCycleStatus(
          config.corporationId,
          currentCycle,
          {
            status: 'analyzing',
            progress: {
              esiCollected: true,
              specialistAnalysisComplete: false,
              synthesisComplete: false,
              reportGenerated: false
            }
          },
          MONGODB_URI
        );

        console.log(`  ✅ ESI data collected successfully`);

        results.push({
          corporationId: config.corporationId,
          success: true,
          cycle: currentCycle,
          dataCategories: Object.keys(snapshot.data).length,
          errors: snapshot.errors.length
        });

        // Trigger specialist analysis (next step in the pipeline)
        // This would be handled by a separate scheduled function or triggered here
        console.log(`  → Triggering specialist analysis...`);
        // TODO: Call specialist analysis function

      } catch (error) {
        console.error(`  ❌ Error processing corporation: ${error}`);

        results.push({
          corporationId: config.corporationId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('\n✅ Daily cycle check complete');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Daily cycle check complete',
        corporationsProcessed: dueCorps.length,
        results,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Daily cycle check failed:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Daily cycle check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
