/**
 * The Odds API v4 client with quota tracking and Zod validation.
 *
 * Follows the same design principles as src/lib/api-football/client.ts:
 * - Zod validation with partial-accept pattern (safeParse, log warnings, return data)
 * - Quota tracking from response headers
 * - Single gateway for all Odds API requests
 *
 * The Odds API is simpler than API-Football: no wrapper object, responses are
 * direct arrays. Quota info is in response headers (x-requests-remaining, etc.).
 */

import { oddsApiResponseSchema, sportsApiResponseSchema } from './types';
import type { OddsEvent, Sport } from './types';

const BASE_URL = 'https://api.the-odds-api.com';

export interface OddsQuota {
  remaining: number;
  used: number;
  lastCost: number;
}

export interface FetchOddsResult {
  data: OddsEvent[];
  quota: OddsQuota;
}

export interface FetchOddsOptions {
  regions?: string;
  markets?: string;
  eventIds?: string[];
}

/**
 * Extract quota information from Odds API response headers.
 */
function extractQuota(headers: Headers): OddsQuota {
  return {
    remaining: Number(headers.get('x-requests-remaining') ?? 0),
    used: Number(headers.get('x-requests-used') ?? 0),
    lastCost: Number(headers.get('x-requests-last') ?? 0),
  };
}

/**
 * Get the API key from the environment.
 * Throws a clear error if not set.
 */
function getApiKey(): string {
  const key = process.env.ODDS_API_KEY;
  if (!key) {
    throw new Error(
      '[odds-api] ODDS_API_KEY environment variable is not set. ' +
        'Get your key from https://the-odds-api.com/'
    );
  }
  return key;
}

/**
 * Fetch odds for a given sport from The Odds API.
 *
 * Default configuration:
 * - regions: 'eu,uk' (European and UK bookmakers)
 * - markets: 'h2h' (match winner / 1X2)
 * - oddsFormat: 'decimal'
 * - includeLinks: true (affiliate betslip deep links)
 * - includeSids: true (source IDs for custom link construction)
 *
 * @param sportKey - The Odds API sport key (e.g. 'soccer_epl')
 * @param options - Optional overrides for regions, markets, and event filtering
 * @returns Validated odds data and quota information
 */
export async function fetchOddsForSport(
  sportKey: string,
  options: FetchOddsOptions = {}
): Promise<FetchOddsResult> {
  const apiKey = getApiKey();

  const url = new URL(`/v4/sports/${sportKey}/odds`, BASE_URL);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('regions', options.regions ?? 'eu,uk');
  url.searchParams.set('markets', options.markets ?? 'h2h');
  url.searchParams.set('oddsFormat', 'decimal');
  url.searchParams.set('dateFormat', 'iso');
  url.searchParams.set('includeLinks', 'true');
  url.searchParams.set('includeSids', 'true');

  if (options.eventIds?.length) {
    url.searchParams.set('eventIds', options.eventIds.join(','));
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text().catch(() => '(unable to read body)');
    throw new Error(
      `[odds-api] HTTP ${response.status} from /v4/sports/${sportKey}/odds: ${body}`
    );
  }

  const quota = extractQuota(response.headers);

  console.log(
    `[odds-api] Fetched ${sportKey} odds. Quota: ${quota.remaining} remaining, ${quota.used} used, last cost ${quota.lastCost}`
  );

  const json = await response.json();

  // Validate with Zod (partial-accept pattern)
  const result = oddsApiResponseSchema.safeParse(json);

  if (result.success) {
    return { data: result.data, quota };
  }

  // Partial accept: log warnings but return raw data
  const issuesSummary = result.error.issues
    .slice(0, 5)
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('; ');
  const moreCount = result.error.issues.length - 5;

  console.warn(
    `[odds-api] Validation warning for ${sportKey}: ${issuesSummary}` +
      (moreCount > 0 ? ` (+${moreCount} more issues)` : '')
  );

  return { data: json as OddsEvent[], quota };
}

/**
 * Fetch all available sports from The Odds API.
 *
 * This endpoint costs 0 credits and is useful for discovering
 * available sport keys and validating our SPORT_KEY_MAP.
 *
 * @returns Array of available sports
 */
export async function fetchSportsKeys(): Promise<Sport[]> {
  const apiKey = getApiKey();

  const url = new URL('/v4/sports', BASE_URL);
  url.searchParams.set('apiKey', apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text().catch(() => '(unable to read body)');
    throw new Error(`[odds-api] HTTP ${response.status} from /v4/sports: ${body}`);
  }

  const json = await response.json();

  const result = sportsApiResponseSchema.safeParse(json);

  if (result.success) {
    return result.data;
  }

  console.warn(
    `[odds-api] Sports validation warning: ${result.error.issues.length} issue(s)`
  );

  return json as Sport[];
}
