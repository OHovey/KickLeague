/**
 * API budget tracking for the live data pipeline.
 *
 * Logs every API-Football call to the api_call_log table and provides
 * budget-checking utilities to prevent exceeding the daily limit.
 *
 * The Pro tier allows 7,500 calls/day. The pipeline reserves 500 calls
 * for manual/debug use, so the default pipeline budget is 7,000 calls/day.
 */

import * as Sentry from '@sentry/nextjs';
import { getDb } from '@/db/connection';
import { apiCallLog } from '@/db/schema';
import { gte, sql, count } from 'drizzle-orm';

/** 80% of the 7,500 daily API-Football Pro tier limit */
const WARNING_THRESHOLD = 6000;

/** 93% of the 7,500 daily API-Football Pro tier limit */
const CRITICAL_THRESHOLD = 7000;

/** Absolute daily limit for API-Football Pro tier */
const DAILY_LIMIT = 7500;

interface LogApiCallParams {
  endpoint: string;
  leagueApiId?: number;
  season?: string;
  params?: string;
  success: boolean;
  httpStatus?: number;
  responseTimeMs?: number;
  dailyRemaining?: number;
  errorMessage?: string;
}

/**
 * Log an API-Football call to the api_call_log table.
 */
export async function logApiCall(params: LogApiCallParams): Promise<void> {
  await getDb().insert(apiCallLog).values({
    endpoint: params.endpoint,
    leagueApiId: params.leagueApiId ?? null,
    season: params.season ?? null,
    params: params.params ?? null,
    success: params.success,
    httpStatus: params.httpStatus ?? null,
    responseTimeMs: params.responseTimeMs ?? null,
    dailyRemaining: params.dailyRemaining ?? null,
    errorMessage: params.errorMessage ?? null,
  });
}

/**
 * Count the number of API calls made today (UTC).
 */
export async function getDailyCallCount(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const result = await getDb()
    .select({ value: count() })
    .from(apiCallLog)
    .where(gte(apiCallLog.calledAt, startOfDay));

  return result[0]?.value ?? 0;
}

/**
 * Check if the pipeline can make another API call within the daily budget.
 *
 * @param dailyLimit - Maximum pipeline calls per day (default: 7000, reserving 500 for manual use)
 * @returns true if the daily count is below the limit
 */
export async function canMakePipelineCall(
  dailyLimit: number = 7000,
): Promise<boolean> {
  const dailyCount = await getDailyCallCount();
  return dailyCount < dailyLimit;
}

// ---------------------------------------------------------------------------
// Cron invocation logging
// ---------------------------------------------------------------------------

interface LogCronInvocationParams {
  endpoint: string;
  success: boolean;
  httpStatus: number;
  result?: string | null;
  error?: string | null;
}

/**
 * Log every cron invocation to api_call_log for diagnostics.
 * Best-effort: swallows DB errors so cron routes never fail due to logging.
 */
export async function logCronInvocation(params: LogCronInvocationParams): Promise<void> {
  try {
    await getDb().insert(apiCallLog).values({
      endpoint: params.endpoint,
      success: params.success,
      httpStatus: params.httpStatus,
      errorMessage: params.error?.slice(0, 500) ?? null,
      params: params.result?.slice(0, 500) ?? null,
    });
  } catch {
    /* best-effort logging */
  }
}

/**
 * Check daily API-Football usage against budget thresholds and alert via Sentry.
 *
 * - >= 6,000 (80%): Sentry warning
 * - >= 7,000 (93%): Sentry fatal alert
 *
 * Intended to be called at the end of each cron route as a best-effort check.
 */
export async function checkBudgetThresholds(): Promise<void> {
  const dailyCount = await getDailyCallCount();

  if (dailyCount >= CRITICAL_THRESHOLD) {
    const message = `API-Football budget CRITICAL: ${dailyCount}/${DAILY_LIMIT} daily requests used`;
    Sentry.captureMessage(message, {
      level: 'fatal',
      extra: {
        dailyCount,
        threshold: CRITICAL_THRESHOLD,
        dailyLimit: DAILY_LIMIT,
      },
    });
    console.error(message);
  } else if (dailyCount >= WARNING_THRESHOLD) {
    const message = `API-Football budget WARNING: ${dailyCount}/${DAILY_LIMIT} daily requests used`;
    Sentry.captureMessage(message, {
      level: 'warning',
      extra: {
        dailyCount,
        threshold: WARNING_THRESHOLD,
        dailyLimit: DAILY_LIMIT,
      },
    });
    console.warn(message);
  }
}
