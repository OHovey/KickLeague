/**
 * API budget tracking for the live data pipeline.
 *
 * Logs every API-Football call to the api_call_log table and provides
 * budget-checking utilities to prevent exceeding the daily limit.
 *
 * The free tier allows 100 calls/day. The pipeline reserves 20 calls
 * for manual/debug use, so the default pipeline budget is 80 calls/day.
 */

import { getDb } from '@/db/connection';
import { apiCallLog } from '@/db/schema';
import { gte, sql, count } from 'drizzle-orm';

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
 * @param dailyLimit - Maximum pipeline calls per day (default: 80, reserving 20 for manual use)
 * @returns true if the daily count is below the limit
 */
export async function canMakePipelineCall(
  dailyLimit: number = 80,
): Promise<boolean> {
  const dailyCount = await getDailyCallCount();
  return dailyCount < dailyLimit;
}
