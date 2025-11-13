/**
 * Flexible Monthly Cycle Scheduler
 *
 * Allows corporations to set their own cycle start day (1-28 of each month)
 * Handles ESI data collection, specialist analysis, and reporting
 */

import { MongoClient } from 'mongodb';

export interface CycleConfiguration {
  corporationId: string;
  cycleStartDay: number; // 1-28 (day of month to start cycle)
  timezone: string; // e.g., "UTC", "America/New_York"
  enabled: boolean;
  autoReportGeneration: boolean;
  notificationEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CycleStatus {
  corporationId: string;
  currentCycle: string; // "2025-11" (YYYY-MM format)
  cycleStartDate: Date;
  cycleEndDate: Date;
  status: 'pending' | 'collecting' | 'analyzing' | 'complete' | 'error';
  progress: {
    esiCollected: boolean;
    specialistAnalysisComplete: boolean;
    synthesisComplete: boolean;
    reportGenerated: boolean;
  };
  lastUpdated: Date;
}

/**
 * Get cycle configuration for a corporation
 */
export async function getCycleConfiguration(
  corporationId: string,
  mongoUri: string
): Promise<CycleConfiguration | null> {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('gryyk47');

    const config = await db.collection<CycleConfiguration>('cycle_configurations')
      .findOne({ corporationId });

    return config;

  } finally {
    await client.close();
  }
}

/**
 * Set or update cycle configuration
 */
export async function setCycleConfiguration(
  config: Omit<CycleConfiguration, 'createdAt' | 'updatedAt'>,
  mongoUri: string
): Promise<void> {
  // Validate cycle start day
  if (config.cycleStartDay < 1 || config.cycleStartDay > 28) {
    throw new Error('Cycle start day must be between 1 and 28');
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('gryyk47');

    await db.collection<CycleConfiguration>('cycle_configurations').updateOne(
      { corporationId: config.corporationId },
      {
        $set: {
          ...config,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log(`✅ Cycle configuration updated for corporation ${config.corporationId}`);

  } finally {
    await client.close();
  }
}

/**
 * Calculate the current cycle period for a corporation
 */
export function calculateCyclePeriod(
  cycleStartDay: number,
  referenceDate: Date = new Date()
): { currentCycle: string; cycleStartDate: Date; cycleEndDate: Date } {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0-11
  const day = referenceDate.getDate();

  let cycleMonth = month;
  let cycleYear = year;

  // If we're before the cycle start day this month, we're still in last month's cycle
  if (day < cycleStartDay) {
    cycleMonth = month - 1;
    if (cycleMonth < 0) {
      cycleMonth = 11;
      cycleYear = year - 1;
    }
  }

  // Calculate cycle start date
  const cycleStartDate = new Date(cycleYear, cycleMonth, cycleStartDay, 0, 0, 0, 0);

  // Calculate cycle end date (day before next cycle starts)
  let nextCycleMonth = cycleMonth + 1;
  let nextCycleYear = cycleYear;
  if (nextCycleMonth > 11) {
    nextCycleMonth = 0;
    nextCycleYear = cycleYear + 1;
  }

  const nextCycleStart = new Date(nextCycleYear, nextCycleMonth, cycleStartDay, 0, 0, 0, 0);
  const cycleEndDate = new Date(nextCycleStart.getTime() - 1); // 1ms before next cycle

  // Format current cycle as YYYY-MM
  const currentCycle = `${cycleYear}-${String(cycleMonth + 1).padStart(2, '0')}`;

  return {
    currentCycle,
    cycleStartDate,
    cycleEndDate
  };
}

/**
 * Check if today is a cycle start day for any corporation
 */
export async function getCorpsDueForCycle(
  mongoUri: string,
  checkDate: Date = new Date()
): Promise<CycleConfiguration[]> {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('gryyk47');

    // Get all enabled cycle configurations
    const configs = await db.collection<CycleConfiguration>('cycle_configurations')
      .find({ enabled: true })
      .toArray();

    // Filter to corporations whose cycle starts today
    const today = checkDate.getDate();

    const dueCorps = configs.filter(config => config.cycleStartDay === today);

    if (dueCorps.length > 0) {
      console.log(`📅 ${dueCorps.length} corporation(s) due for cycle on day ${today}`);
    }

    return dueCorps;

  } finally {
    await client.close();
  }
}

/**
 * Get or create cycle status for a corporation
 */
export async function getCycleStatus(
  corporationId: string,
  mongoUri: string
): Promise<CycleStatus | null> {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('gryyk47');

    // Get configuration
    const config = await db.collection<CycleConfiguration>('cycle_configurations')
      .findOne({ corporationId });

    if (!config) {
      return null;
    }

    // Calculate current cycle period
    const { currentCycle, cycleStartDate, cycleEndDate } = calculateCyclePeriod(config.cycleStartDay);

    // Get or create status for current cycle
    const existingStatus = await db.collection<CycleStatus>('cycle_statuses')
      .findOne({ corporationId, currentCycle });

    if (existingStatus) {
      return existingStatus;
    }

    // Create new status for current cycle
    const newStatus: CycleStatus = {
      corporationId,
      currentCycle,
      cycleStartDate,
      cycleEndDate,
      status: 'pending',
      progress: {
        esiCollected: false,
        specialistAnalysisComplete: false,
        synthesisComplete: false,
        reportGenerated: false
      },
      lastUpdated: new Date()
    };

    await db.collection<CycleStatus>('cycle_statuses').insertOne(newStatus);

    return newStatus;

  } finally {
    await client.close();
  }
}

/**
 * Update cycle status
 */
export async function updateCycleStatus(
  corporationId: string,
  currentCycle: string,
  updates: Partial<CycleStatus>,
  mongoUri: string
): Promise<void> {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('gryyk47');

    await db.collection<CycleStatus>('cycle_statuses').updateOne(
      { corporationId, currentCycle },
      {
        $set: {
          ...updates,
          lastUpdated: new Date()
        }
      }
    );

    console.log(`✅ Cycle status updated for ${corporationId} - ${currentCycle}`);

  } finally {
    await client.close();
  }
}

/**
 * Check if corporation should run cycle today
 */
export async function shouldRunCycleToday(
  corporationId: string,
  mongoUri: string,
  checkDate: Date = new Date()
): Promise<boolean> {
  const config = await getCycleConfiguration(corporationId, mongoUri);

  if (!config || !config.enabled) {
    return false;
  }

  const today = checkDate.getDate();
  return config.cycleStartDay === today;
}

/**
 * Get all cycle history for a corporation
 */
export async function getCycleHistory(
  corporationId: string,
  mongoUri: string,
  limit: number = 12
): Promise<CycleStatus[]> {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('gryyk47');

    const history = await db.collection<CycleStatus>('cycle_statuses')
      .find({ corporationId })
      .sort({ currentCycle: -1 })
      .limit(limit)
      .toArray();

    return history;

  } finally {
    await client.close();
  }
}
