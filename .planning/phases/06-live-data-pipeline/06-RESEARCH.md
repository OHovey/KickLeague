# Phase 6: Live Data Pipeline - Research

**Researched:** 2026-02-05
**Domain:** Automated polling, match completion detection, cache invalidation, ISR revalidation, browser-side smart polling
**Confidence:** HIGH

## Summary

This phase transforms the KickLeague platform from a manually-seeded system into a self-updating pipeline. The work divides into four domains: (1) scheduled server-side polling of API-Football to detect match updates, (2) a match completion chain that recalculates standings, invalidates caches, and triggers ISR revalidation, (3) browser-side smart polling to silently refresh data without page reloads, and (4) API usage tracking for budget monitoring.

The critical constraint is that the Vercel Hobby plan limits cron jobs to once per day. For match-window polling at 30-minute intervals, the project needs Upstash QStash (free tier: 1,000 messages/day, 10 active schedules). QStash pushes HTTP requests to Next.js Route Handlers on a cron schedule, solving the Hobby plan limitation. The daily 04:00 UTC resync can use either Vercel's native cron (1/day fits Hobby) or QStash. The existing `ApiFootballClient`, `mapStatus()`, and `computeHistoricalStandings()` code from Phase 1 provides reusable infrastructure for the polling pipeline.

Browser-side updates use a custom `usePolling` hook that calls a Next.js Route Handler (`/api/updates/check`) at adaptive intervals (30s during match windows, 5min off-peak). The Route Handler queries the `standings.updatedAt` timestamp and returns a version hash. When the hash changes, the client refetches standings data via existing server actions. No external libraries are needed for this -- native `setInterval` with a `useRef` pattern handles it cleanly.

**Primary recommendation:** Use Upstash QStash free tier for scheduled polling (match-window and daily resync), Next.js Route Handlers for both cron endpoints and browser polling API, `revalidatePath` for on-demand ISR after match completion, and a new `api_call_log` database table for API usage tracking. Build the match completion chain as a standalone function that the cron handler calls after detecting status changes.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @upstash/qstash | latest | Scheduled HTTP messaging / cron | Solves Vercel Hobby 1/day cron limit; free tier gives 1,000 msg/day and 10 schedules; signature verification built in |
| next (existing) | 16.1.6 | Route Handlers for cron + polling endpoints, `revalidatePath` for ISR | Already in project; Route Handlers are the standard serverless API in App Router |
| drizzle-orm (existing) | 0.45.1 | Database queries for fixture checks, standings upserts, API call logging | Already in project; all DB operations use Drizzle |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod (existing) | 4.3.6 | Validate API-Football responses in polling handler | Already in project; reuse existing Zod schemas from Phase 1 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| QStash cron | Vercel native cron | Vercel Hobby allows only 1 cron/day and 2 total cron jobs. Pro plan ($20/mo/user) allows 1/min. QStash free tier is more capable for this use case. |
| QStash cron | Inngest | Inngest is more powerful (event-driven workflows) but heavier. QStash is simpler for HTTP cron. |
| Custom `usePolling` hook | TanStack Query / SWR | TanStack Query adds bundle size and complexity. The polling pattern here is simple enough that a ~30 line custom hook is cleaner. Could add TanStack Query later if data fetching needs grow. |
| `revalidatePath` | `revalidateTag` | Tags are more granular but require tagging all fetch calls. `revalidatePath` is simpler for page-level invalidation and sufficient for league table pages. |

**Installation:**
```bash
npm install @upstash/qstash
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    api/
      cron/
        poll-matches/
          route.ts          # QStash-triggered: polls API-Football for active matches
        daily-resync/
          route.ts          # QStash/Vercel cron: 04:00 UTC full resync
      updates/
        check/
          route.ts          # Browser polling: returns data version/timestamp
  lib/
    pipeline/
      poll-active-matches.ts   # Core logic: check fixtures, poll API, detect completions
      match-completion.ts      # Chain: recalc standings -> invalidate cache -> revalidate ISR
      daily-resync.ts          # Full standings resync with drift detection
      fixture-window.ts        # Determine which leagues have active match windows
      api-budget.ts            # API call logging and budget checking
```

### Pattern 1: QStash Cron -> Route Handler -> Pipeline Logic

**What:** QStash sends scheduled HTTP requests to Next.js Route Handlers. The handler verifies the QStash signature, then calls pipeline logic functions. This separates scheduling (QStash) from business logic (pipeline functions).

**When to use:** All scheduled operations (match polling, daily resync).

**Example:**
```typescript
// src/app/api/cron/poll-matches/route.ts
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { pollActiveMatches } from "@/lib/pipeline/poll-active-matches";

export const maxDuration = 60; // Allow up to 60s on Hobby plan

async function handler(req: Request) {
  const result = await pollActiveMatches();
  return Response.json(result);
}

// Wrap with QStash signature verification
export const POST = verifySignatureAppRouter(handler);
```

```typescript
// For local development, add a GET handler that skips verification
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not allowed", { status: 403 });
  }
  const result = await pollActiveMatches();
  return Response.json(result);
}
```

### Pattern 2: Fixture-Window-Aware Polling

**What:** Before polling API-Football, check the database for fixtures kicking off within a 3-hour window. Only poll leagues with active or recently-active matches. This avoids wasting API calls on quiet days.

**When to use:** Every poll-matches invocation.

**Example:**
```typescript
// src/lib/pipeline/fixture-window.ts
import { getDb } from "@/db/connection";
import { fixtures, leagues } from "@/db/schema";
import { and, eq, gte, lte, inArray } from "drizzle-orm";

interface ActiveLeague {
  leagueDbId: number;
  leagueApiId: number;
  activeFixtureApiIds: number[];
}

export async function getActiveLeagues(): Promise<ActiveLeague[]> {
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  // Find fixtures in the active window:
  // - Kickoff within last 3 hours (may still be playing)
  // - OR kickoff within next 3 hours (upcoming)
  // - AND not already finished/cancelled/postponed
  const activeFixtures = await getDb()
    .select({
      fixtureApiId: fixtures.apiId,
      leagueId: fixtures.leagueId,
      status: fixtures.status,
    })
    .from(fixtures)
    .where(
      and(
        gte(fixtures.kickoff, threeHoursAgo),
        lte(fixtures.kickoff, threeHoursFromNow),
        inArray(fixtures.status, [
          "scheduled", "live", "first_half", "halftime",
          "second_half", "extra_time", "penalties",
        ])
      )
    );

  if (activeFixtures.length === 0) return [];

  // Group by league
  const leagueMap = new Map<number, number[]>();
  for (const f of activeFixtures) {
    const existing = leagueMap.get(f.leagueId) ?? [];
    existing.push(f.fixtureApiId);
    leagueMap.set(f.leagueId, existing);
  }

  // Look up API IDs for each league
  const leagueRows = await getDb()
    .select({ id: leagues.id, apiId: leagues.apiId })
    .from(leagues)
    .where(inArray(leagues.id, [...leagueMap.keys()]));

  return leagueRows.map((l) => ({
    leagueDbId: l.id,
    leagueApiId: l.apiId,
    activeFixtureApiIds: leagueMap.get(l.id) ?? [],
  }));
}
```

### Pattern 3: Match Completion Chain

**What:** When a fixture transitions to "finished" status, trigger a chain: (1) update fixture in DB, (2) recompute standings for the affected matchweek, (3) call `revalidatePath` for the league page, (4) log the completion. This is a synchronous chain within a single function invocation.

**When to use:** Every time the polling handler detects a newly-completed match.

**Example:**
```typescript
// src/lib/pipeline/match-completion.ts
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/connection";
import { fixtures, standings, leagues, teams, leagueConfig } from "@/db/schema";
import { eq, and } from "drizzle-orm";
// Reuse the existing computeHistoricalStandings logic (or a simplified version)

interface CompletionResult {
  fixtureApiId: number;
  leagueSlug: string;
  matchweek: number;
  standingsUpdated: boolean;
  pagesRevalidated: string[];
}

export async function handleMatchCompletion(
  fixtureDbId: number,
  leagueDbId: number,
  season: string,
  matchweek: number,
): Promise<CompletionResult> {
  // 1. Standings are already updated by the fixture upsert
  //    Recompute standings for this matchweek from all fixtures
  //    (reuses pattern from compute-historical-standings.ts)

  // 2. Revalidate ISR pages
  const league = await getDb()
    .select({ slug: leagues.slug })
    .from(leagues)
    .where(eq(leagues.id, leagueDbId))
    .then((r) => r[0]);

  const pagesToRevalidate = [
    "/",                           // Home page (shows current league table)
    `/matches`,                    // Match list
  ];

  for (const path of pagesToRevalidate) {
    revalidatePath(path);
  }

  return {
    fixtureApiId: fixtureDbId,
    leagueSlug: league?.slug ?? "unknown",
    matchweek,
    standingsUpdated: true,
    pagesRevalidated: pagesToRevalidate,
  };
}
```

### Pattern 4: Browser Smart Polling with Adaptive Intervals

**What:** A Route Handler (`/api/updates/check`) returns the latest `updatedAt` timestamp from standings. The browser polls this endpoint at adaptive intervals. When the timestamp changes, the client re-fetches data using existing server actions.

**When to use:** All pages that display live-updateable data (league tables, match pages).

**Example:**
```typescript
// src/app/api/updates/check/route.ts
import { getDb } from "@/db/connection";
import { standings } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic"; // Never cache this route

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  const season = searchParams.get("season");

  if (!leagueId || !season) {
    return Response.json({ error: "Missing leagueId or season" }, { status: 400 });
  }

  // Get the most recent updatedAt for this league-season
  const latest = await getDb()
    .select({ updatedAt: standings.updatedAt })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, parseInt(leagueId)),
        eq(standings.season, season)
      )
    )
    .orderBy(desc(standings.updatedAt))
    .limit(1);

  const updatedAt = latest[0]?.updatedAt?.toISOString() ?? null;

  return Response.json({
    updatedAt,
    // Include whether matches are currently active (for interval adaptation)
    matchWindowActive: false, // TODO: check fixture window
  });
}
```

```typescript
// src/lib/hooks/use-polling.ts
import { useEffect, useRef, useCallback, useState } from "react";

interface UsePollingOptions {
  leagueId: number;
  season: string;
  onUpdate: () => void;
  matchWindowInterval?: number;  // ms, default 30_000
  offPeakInterval?: number;      // ms, default 300_000
  enabled?: boolean;
}

export function usePolling({
  leagueId,
  season,
  onUpdate,
  matchWindowInterval = 30_000,
  offPeakInterval = 300_000,
  enabled = true,
}: UsePollingOptions) {
  const lastUpdatedRef = useRef<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isMatchWindow, setIsMatchWindow] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const poll = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/updates/check?leagueId=${leagueId}&season=${season}`
      );
      if (!res.ok) return;
      const data = await res.json();

      setIsMatchWindow(data.matchWindowActive);

      if (data.updatedAt && data.updatedAt !== lastUpdatedRef.current) {
        if (lastUpdatedRef.current !== null) {
          // Data changed -- trigger refresh
          onUpdateRef.current();
        }
        lastUpdatedRef.current = data.updatedAt;
        setLastUpdated(data.updatedAt);
      }
    } catch {
      // Silently ignore polling errors
    }
  }, [leagueId, season]);

  useEffect(() => {
    if (!enabled) return;

    // Initial poll
    poll();

    const interval = isMatchWindow ? matchWindowInterval : offPeakInterval;
    intervalRef.current = setInterval(poll, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, isMatchWindow, matchWindowInterval, offPeakInterval, poll]);

  return { lastUpdated, isMatchWindow };
}
```

### Pattern 5: API Call Logging for Budget Tracking

**What:** A new `api_call_log` table tracks every API-Football call. The cron handler logs each call with endpoint, league, success/failure, and response time. A budget check function prevents exceeding daily limits.

**When to use:** Every API-Football call made by the pipeline (not cached calls).

**Example:**
```typescript
// New schema table: src/db/schema/api-call-log.ts
import { pgTable, integer, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

export const apiCallLog = pgTable("api_call_log", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  calledAt: timestamp("called_at", { withTimezone: true }).notNull().defaultNow(),
  endpoint: varchar("endpoint", { length: 100 }).notNull(),
  leagueApiId: integer("league_api_id"),
  season: varchar("season", { length: 10 }),
  params: varchar("params", { length: 500 }),      // JSON stringified query params
  success: boolean("success").notNull(),
  httpStatus: integer("http_status"),
  responseTimeMs: integer("response_time_ms"),
  dailyRemaining: integer("daily_remaining"),        // From API response header
  errorMessage: varchar("error_message", { length: 500 }),
});
```

### Anti-Patterns to Avoid

- **Polling API-Football from the browser:** Never expose the API key to the client. All API-Football calls go through server-side cron handlers.
- **Using `setInterval` without cleanup in React:** Always return a cleanup function from `useEffect` that calls `clearInterval`. Use `useRef` for the callback to avoid stale closures.
- **Calling `revalidatePath` in a loop for every fixture:** Call it once per affected page path. Multiple calls to the same path are redundant.
- **Running standings recalculation on every poll:** Only recalculate when a fixture status actually changes. Compare old status vs new status before triggering the chain.
- **Storing API key in client-side environment variables:** Use `APIFOOTBALL_KEY` (no `NEXT_PUBLIC_` prefix) to keep it server-only.
- **Making QStash endpoints publicly accessible without verification:** Always use `verifySignatureAppRouter` wrapper to ensure only QStash can trigger cron endpoints.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron scheduling on serverless | Custom timer/scheduler | Upstash QStash | Serverless functions are stateless -- no persistent timers. QStash handles cron scheduling via HTTP push. |
| Cron request verification | Custom HMAC verification | `verifySignatureAppRouter` from `@upstash/qstash/nextjs` | Handles key rotation, signature verification, and timing attacks out of the box. |
| ISR cache invalidation | Manual cache headers / CDN purge | `revalidatePath` from `next/cache` | Built into Next.js, works automatically with Vercel's CDN. |
| Status code to match_status mapping | New mapping function | Existing `mapStatus()` in `seed-fixtures.ts` | Already handles all API-Football status codes. Extract to shared module. |
| Standings recalculation | New calculation engine | Existing `computeHistoricalStandings` pattern | Already proven; adapt for single-matchweek incremental update. |
| Exponential backoff for retries | Custom retry loop | Simple utility function (~15 lines) OR `exponential-backoff` npm package | The pattern is straightforward but must include jitter. A utility function is fine for 3 retries. |

**Key insight:** The existing Phase 1 code (`ApiFootballClient`, `mapStatus`, `seedFixtures` upsert logic, `computeHistoricalStandings`) provides ~70% of the server-side pipeline logic. The main new work is (a) scheduling with QStash, (b) the fixture-window detection query, (c) the match completion chain orchestration, and (d) the browser polling hook.

## Common Pitfalls

### Pitfall 1: Vercel Hobby Cron Limit Blocks Match-Day Polling
**What goes wrong:** Using Vercel's built-in cron jobs for 30-minute match polling, then discovering it only runs once per day on Hobby plan.
**Why it happens:** Vercel Hobby plan documentation is buried; the 1/day limit is not immediately obvious.
**How to avoid:** Use Upstash QStash from the start. QStash free tier allows 1,000 messages/day and up to 10 active schedules, which covers match-day polling and daily resync comfortably.
**Warning signs:** Deployment fails with "Hobby accounts are limited to daily cron jobs" error.

### Pitfall 2: API Budget Exhaustion on Match Days
**What goes wrong:** Polling 5 leagues every 30 minutes on a match day burns through the 100 API calls/day free tier in under 2 hours.
**Why it happens:** Naive polling of all leagues regardless of whether they have active matches.
**How to avoid:** Implement fixture-window detection. Only poll leagues with matches kicking off within 3 hours. On quiet days, the only API call is the 04:00 UTC resync. Budget estimate: 5-15 calls on quiet days, 20-30 on busy match days.
**Warning signs:** `daily_remaining` in API response headers dropping below 20 early in the day.

### Pitfall 3: Race Condition Between Concurrent Cron Invocations
**What goes wrong:** QStash fires a new poll while the previous one is still running. Two invocations detect the same match completion and both try to recalculate standings.
**Why it happens:** At 30-minute polling intervals this is unlikely, but possible if a handler takes longer than expected (e.g., slow API-Football response).
**How to avoid:** Design all operations to be idempotent. The existing upsert pattern (`onConflictDoUpdate`) already handles this for fixture and standings writes. Add a simple timestamp-based guard: skip processing if the fixture was already updated within the last 2 minutes.
**Warning signs:** Duplicate log entries for the same match completion.

### Pitfall 4: Stale Closures in Browser Polling Hook
**What goes wrong:** The `usePolling` hook's callback captures stale state, causing it to miss updates or use outdated league/season values.
**Why it happens:** `setInterval` callback closures capture values at creation time. If dependencies change, the callback still uses old values.
**How to avoid:** Use `useRef` for the callback function so the interval always calls the latest version. Store the interval ID in a ref and properly clean up on dependency changes.
**Warning signs:** Polling continues for a previously-viewed league after navigation, or updates stop appearing.

### Pitfall 5: revalidatePath Doesn't Immediately Update
**What goes wrong:** Calling `revalidatePath` from a Route Handler and expecting the page to be immediately fresh for the next browser poll.
**Why it happens:** In Route Handlers (as opposed to Server Actions), `revalidatePath` marks the path for revalidation on the *next* visit, not immediately. This is lazy regeneration.
**How to avoid:** This is actually fine for the pipeline's use case. The browser poll detects the data change via `updatedAt` timestamp, then refetches via server actions, which will trigger the lazy regeneration. The slight delay is acceptable for a 30-second polling interval.
**Warning signs:** None -- this is expected behavior. Do not try to work around it.

### Pitfall 6: QStash Environment Variables Missing in Production
**What goes wrong:** QStash endpoints return 500 errors because `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` are not set in Vercel.
**Why it happens:** These are separate from the `QSTASH_TOKEN` used for publishing. All three must be configured.
**How to avoid:** Add all three QStash env vars (`QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`) to Vercel project settings before deploying. Verify with a test message from the QStash console.
**Warning signs:** 500 errors on cron endpoints with "Missing signing key" in logs.

## Code Examples

### Vercel Cron for Daily Resync (Hobby-Compatible)

```typescript
// src/app/api/cron/daily-resync/route.ts
// This can use Vercel's native cron since it runs once/day (Hobby-compatible)
import type { NextRequest } from "next/server";
import { dailyResync } from "@/lib/pipeline/daily-resync";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await dailyResync();
  return Response.json(result);
}
```

```json
// vercel.json - daily resync at 04:00 UTC
{
  "crons": [
    {
      "path": "/api/cron/daily-resync",
      "schedule": "0 4 * * *"
    }
  ]
}
```

### QStash Schedule Setup (One-Time via Dashboard or Script)

```typescript
// scripts/setup-qstash-schedules.ts
// Run once to create QStash schedules
import { Client } from "@upstash/qstash";

const client = new Client({ token: process.env.QSTASH_TOKEN! });

// Match-day polling every 30 minutes
await client.schedules.create({
  destination: `${process.env.VERCEL_URL}/api/cron/poll-matches`,
  cron: "*/30 * * * *",
});

console.log("QStash schedule created: poll-matches every 30 min");
```

### Retry with Backoff Utility

```typescript
// src/lib/pipeline/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) break;

      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt);
      const jitter = delay * 0.5 * Math.random();
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError;
}
```

### Data Freshness Display Component

```typescript
// src/components/DataFreshness.tsx
"use client";

import { useEffect, useState } from "react";

export function DataFreshness({ updatedAt }: { updatedAt: string | null }) {
  const [relative, setRelative] = useState<string>("");

  useEffect(() => {
    if (!updatedAt) return;

    function update() {
      const diff = Date.now() - new Date(updatedAt!).getTime();
      const minutes = Math.floor(diff / 60_000);

      if (minutes < 1) setRelative("just now");
      else if (minutes < 60) setRelative(`${minutes} min ago`);
      else {
        const hours = Math.floor(minutes / 60);
        setRelative(`${hours}h ago`);
      }
    }

    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [updatedAt]);

  if (!updatedAt) return null;

  return (
    <span className="text-xs text-white/40">
      Last updated: {relative}
    </span>
  );
}
```

### Shared mapStatus Extraction

```typescript
// src/lib/api-football/status-map.ts
// Extract from seed-fixtures.ts for shared use

export type MatchStatus =
  | "scheduled" | "live" | "finished" | "postponed" | "cancelled"
  | "first_half" | "halftime" | "second_half" | "extra_time" | "penalties";

const STATUS_MAP: Record<string, MatchStatus> = {
  TBD: "scheduled",
  NS: "scheduled",
  "1H": "first_half",
  HT: "halftime",
  "2H": "second_half",
  ET: "extra_time",
  P: "penalties",
  FT: "finished",
  AET: "finished",
  PEN: "finished",
  BT: "finished",
  SUSP: "postponed",
  INT: "postponed",
  PST: "postponed",
  CANC: "cancelled",
  ABD: "cancelled",
  AWD: "finished",
  WO: "finished",
  LIVE: "live",
};

export function mapStatus(short: string | null | undefined): MatchStatus {
  if (!short) return "scheduled";
  return STATUS_MAP[short] ?? "scheduled";
}

/** Check if a status represents an in-progress match */
export function isLiveStatus(status: MatchStatus): boolean {
  return ["live", "first_half", "halftime", "second_half", "extra_time", "penalties"].includes(status);
}

/** Check if a status represents a completed match */
export function isFinishedStatus(status: MatchStatus): boolean {
  return status === "finished";
}

/** Check if a status represents a terminal state (no more updates expected) */
export function isTerminalStatus(status: MatchStatus): boolean {
  return ["finished", "cancelled", "postponed"].includes(status);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SSE (Server-Sent Events) for real-time updates on serverless | Smart polling via Route Handlers | 2024-2025 | SSE requires persistent connections, incompatible with serverless function timeouts. Smart polling is simpler, cheaper, and fully serverless-compatible. |
| Vercel cron as only scheduling option | QStash for sub-daily scheduling on Hobby | 2023+ | Vercel Hobby limited to 1 cron/day; QStash free tier fills the gap with 1,000 msg/day. |
| `revalidate` time-based ISR only | On-demand `revalidatePath`/`revalidateTag` | Next.js 13+ (App Router) | On-demand revalidation gives precise cache control instead of TTL-based staleness. |
| Fluid Compute off by default | Fluid Compute on by default | Late 2025 | Hobby plan functions now default to 300s (5 min) max duration, up from 10s. This is generous enough for polling operations. |
| Non-fluid-compute: Hobby 10s default, 60s max | Fluid Compute: Hobby 300s default/max | Late 2025 | Polling handlers have plenty of execution time without upgrading to Pro. |

**Deprecated/outdated:**
- **SSE on Vercel serverless:** Not practical due to function timeout limits. Smart polling is the accepted pattern.
- **`getStaticProps` with `revalidate` (Pages Router):** Replaced by `revalidatePath`/`revalidateTag` in App Router.
- **Redis for simple timestamp checks:** The database `updatedAt` column is sufficient. Redis adds complexity and cost for this use case.

## Open Questions

1. **Vercel Hobby plan with Fluid Compute exact cron behavior**
   - What we know: Hobby cron runs once/day max. Fluid Compute changes function duration defaults to 300s. The Hobby comparison table still shows 60s max for functions.
   - What's unclear: Whether Fluid Compute's 300s applies to cron-triggered functions on Hobby plan specifically, or if the 60s limit from the comparison table takes precedence.
   - Recommendation: Set `maxDuration = 60` on cron Route Handlers to be safe. The polling logic should complete well within 60s anyway. Test during implementation.

2. **QStash schedule management in CI/CD**
   - What we know: QStash schedules are created via API or console, not via `vercel.json`.
   - What's unclear: Best practice for managing QStash schedules across environments (dev, staging, prod). No declarative config file equivalent.
   - Recommendation: Create a one-time setup script (`scripts/setup-qstash-schedules.ts`) that uses the QStash SDK. Run manually after initial deployment. Document the schedule IDs. Consider environment-specific destination URLs.

3. **Browser polling impact on Vercel function invocations**
   - What we know: Hobby plan includes 1,000,000 function invocations. Each browser poll hits `/api/updates/check`.
   - What's unclear: How many concurrent users the free tier comfortably supports before invocation limits become a concern.
   - Recommendation: At 30s intervals, one user generates ~2,880 invocations/day during a full match window. 100 concurrent users = 288,000/day = well within 1M/month. Not a concern for early stages. Monitor via Vercel dashboard.

4. **Incremental vs full standings recalculation on match completion**
   - What we know: `computeHistoricalStandings` recomputes all matchweeks from scratch. This is fine for seeding but potentially wasteful for a single match completion.
   - What's unclear: Whether an incremental update (just update the current matchweek standings) is worth the additional code complexity.
   - Recommendation: Start with the existing full-matchweek recomputation for simplicity. If it takes too long within the cron handler (>10s), optimize to incremental. The standings table has ~20 rows per matchweek per league, so even a full rewrite is fast.

## Sources

### Primary (HIGH confidence)
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs) - Configuration format, cron expressions, how it works
- [Vercel Cron Jobs Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) - Hobby: 100 cron jobs but daily only; Pro: per-minute
- [Vercel Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs) - CRON_SECRET security, duration limits, concurrency, idempotency, local testing
- [Vercel Function Duration Configuration](https://vercel.com/docs/functions/configuring-functions/duration) - Hobby: 300s with Fluid Compute (default), 60s without; `maxDuration` export pattern
- [Vercel Hobby Plan](https://vercel.com/docs/plans/hobby) - Plan comparison, function limits
- [Next.js ISR Guide](https://nextjs.org/docs/app/guides/incremental-static-regeneration) - `revalidatePath`, `revalidateTag`, time-based revalidation, `unstable_cache`
- [Next.js `revalidatePath` API Reference](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) - Parameters, Route Handler vs Server Action behavior, lazy regeneration
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) - File conventions, HTTP methods, caching behavior, `dynamic` export
- [Upstash QStash Pricing](https://upstash.com/docs/qstash/overall/pricing) - Free: 1,000 msg/day, 10 schedules; Pay-as-you-go: $1/100K messages
- [Upstash QStash Next.js Quickstart](https://upstash.com/docs/qstash/quickstarts/vercel-nextjs) - `verifySignatureAppRouter`, env vars, publishing, receiving

### Secondary (MEDIUM confidence)
- [Upstash Blog: Periodic Data Updates with QStash](https://upstash.com/blog/qstash-periodic-data-updates) - End-to-end tutorial for scheduled data fetching with Next.js
- [Upstash Blog: QStash GA Announcement](https://upstash.com/blog/qstash-qa) - Free tier limit increase to 1,000 msg/day
- [Medium: QStash solving Vercel 10-second limit](https://medium.com/@kolbysisk/case-study-solving-vercels-10-second-limit-with-qstash-2bceeb35d29b) - Practical case study for longer serverless processing

### Tertiary (LOW confidence)
- Browser polling invocation budget estimate: Calculated from interval assumptions (30s match window, 5min off-peak) but not validated against real usage patterns. Actual invocations depend on user concurrency.
- Incremental standings update performance: Assumption that full-matchweek recompute is fast enough (<10s for 20 rows). Not benchmarked against production Neon database.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - QStash is well-documented with official Next.js quickstart; `revalidatePath` and Route Handlers are core Next.js APIs
- Architecture: HIGH - Patterns follow official Vercel/Upstash documentation and the project's existing Phase 1 patterns
- Pitfalls: HIGH - Vercel Hobby cron limit verified in official docs; QStash env var requirements from official quickstart; polling race conditions are well-documented serverless concerns
- Browser polling: MEDIUM - Custom hook pattern is standard React, but optimal interval values (30s/5min) are decisions rather than researched facts

**Research date:** 2026-02-05
**Valid until:** 2026-03-07 (30 days - stack is stable, Vercel/QStash APIs are mature)
