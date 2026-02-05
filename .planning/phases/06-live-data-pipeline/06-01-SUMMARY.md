---
phase: 06-live-data-pipeline
plan: 01
subsystem: pipeline
tags: [qstash, cron, api-football, drizzle, polling, match-status, rate-limiting]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: "ApiFootballClient, fixtures/teams/leagues schema, seed patterns (mapStatus, buildConflictUpdateColumns)"
provides:
  - "api_call_log table for API usage tracking"
  - "Shared status-map module (mapStatus, isLiveStatus, isFinishedStatus, isTerminalStatus, extractMatchweek)"
  - "Retry utility with exponential backoff"
  - "API budget tracking (logApiCall, getDailyCallCount, canMakePipelineCall)"
  - "Fixture-window detection (getActiveLeagues, isMatchWindowActive)"
  - "pollActiveMatches orchestrator for live match updates"
  - "QStash-verified POST cron route at /api/cron/poll-matches"
  - "QStash schedule setup script"
affects:
  - 06-02 (match-completion chain uses pollActiveMatches completedFixtureIds)
  - 06-03 (browser polling uses isMatchWindowActive for adaptive intervals)

# Tech tracking
tech-stack:
  added: ["@upstash/qstash"]
  patterns:
    - "Runtime QStash signature verification (lazy import to avoid build-time env check)"
    - "Pipeline API client with cache disabled for fresh data"
    - "Budget-aware polling with daily call limits"
    - "Fixture-window detection using 3-hour kickoff window"

key-files:
  created:
    - src/db/schema/api-call-log.ts
    - src/lib/api-football/status-map.ts
    - src/lib/pipeline/retry.ts
    - src/lib/pipeline/api-budget.ts
    - src/lib/pipeline/fixture-window.ts
    - src/lib/pipeline/poll-active-matches.ts
    - src/app/api/cron/poll-matches/route.ts
    - vercel.json
    - scripts/setup-qstash-schedules.ts
    - drizzle/0001_loose_namorita.sql
  modified:
    - src/db/schema/index.ts
    - src/lib/api-football/client.ts
    - package.json

key-decisions:
  - "Runtime QStash verification via lazy Receiver import instead of verifySignatureAppRouter wrapper (avoids build-time env var requirement)"
  - "Fixed .js extension imports in client.ts for Next.js bundler compatibility (seed tsx still works with extensionless imports)"
  - "Pipeline budget default: 80 calls/day (reserves 20 for manual use from 100/day free tier)"
  - "Active fixture window: 3 hours before/after kickoff, excluding terminal statuses"
  - "Match completion detection: compare old DB status vs new API status, collect for downstream chain (06-02)"

patterns-established:
  - "Pipeline module structure: src/lib/pipeline/ for all server-side pipeline logic"
  - "API call logging: every API-Football request logged to api_call_log with timing and budget info"
  - "Budget guard: canMakePipelineCall() checked before each API call to prevent quota exhaustion"
  - "Status-map shared module: type-safe match status utilities extracted from seed for reuse"

# Metrics
duration: 6min
completed: 2026-02-05
---

# Phase 6 Plan 01: Server-Side Match Polling Pipeline Summary

**QStash-triggered match polling with fixture-window awareness, API budget tracking via api_call_log table, and shared status-map utilities extracted from seed code**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-05T22:03:41Z
- **Completed:** 2026-02-05T22:09:22Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- api_call_log Drizzle table with calledAt index tracks every pipeline API call for budget visibility
- Shared status-map module provides type-safe mapStatus, isLiveStatus, isFinishedStatus, isTerminalStatus, extractMatchweek for both seed and pipeline use
- Fixture-window detection queries DB for matches within 3-hour window, preventing API waste on quiet days
- pollActiveMatches orchestrator coordinates budget check -> fixture window -> per-league API fetch -> status change detection -> fixture upsert
- QStash cron route at /api/cron/poll-matches with runtime signature verification and dev GET handler
- Setup script for one-time QStash schedule creation (every 30 minutes, budget tier)

## Task Commits

Each task was committed atomically:

1. **Task 1: Pipeline infrastructure (schema, shared utils, budget tracking)** - `8102dfb` (feat)
2. **Task 2: Fixture-window detection, match polling logic, and cron routes** - `b716df5` (feat)

## Files Created/Modified
- `src/db/schema/api-call-log.ts` - api_call_log table with calledAt index
- `src/db/schema/index.ts` - Added api-call-log barrel export
- `src/lib/api-football/status-map.ts` - Shared mapStatus, isLiveStatus, isFinishedStatus, isTerminalStatus, extractMatchweek
- `src/lib/api-football/client.ts` - Fixed .js extension imports for Next.js compatibility
- `src/lib/pipeline/retry.ts` - withRetry utility with exponential backoff and jitter
- `src/lib/pipeline/api-budget.ts` - logApiCall, getDailyCallCount, canMakePipelineCall
- `src/lib/pipeline/fixture-window.ts` - getActiveLeagues, isMatchWindowActive
- `src/lib/pipeline/poll-active-matches.ts` - pollActiveMatches orchestrator
- `src/app/api/cron/poll-matches/route.ts` - QStash-verified POST + dev GET route
- `vercel.json` - Empty crons array (daily resync added in 06-02)
- `scripts/setup-qstash-schedules.ts` - One-time QStash schedule setup
- `drizzle/0001_loose_namorita.sql` - Migration for api_call_log table
- `package.json` - Added @upstash/qstash dependency and setup-qstash script

## Decisions Made
- **Runtime QStash verification:** Used lazy `import('@upstash/qstash')` inside the POST handler rather than `verifySignatureAppRouter` wrapper. The wrapper eagerly validates env vars at import time, breaking `npm run build` when signing keys aren't set. Runtime approach is functionally identical but build-safe.
- **Fixed client.ts imports:** Removed `.js` extensions from imports in `src/lib/api-football/client.ts`. The `.js` suffixes worked for the `tsx` seed CLI but failed when Next.js Turbopack bundled the file for the route handler. Extensionless imports work in both contexts.
- **Pipeline budget default 80/100:** Reserves 20 daily calls for manual/debug use. The `canMakePipelineCall()` function is checked before every API call, including re-checking between league polls.
- **Fixture window 3 hours:** Active window spans from 3 hours before kickoff to 3 hours after, filtering out terminal statuses (finished, cancelled, postponed). This covers pre-match, in-play, and potential overtime/delays.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed .js extension imports in client.ts**
- **Found during:** Task 2 (npm run build verification)
- **Issue:** `client.ts` used `.js` extensions (`./cache-proxy.js`, `./rate-limiter.js`, `./endpoints.js`) which work for tsx CLI but fail in Next.js Turbopack bundler
- **Fix:** Removed `.js` extensions from all three imports. Both tsx and Next.js resolve extensionless `.ts` imports correctly.
- **Files modified:** `src/lib/api-football/client.ts`
- **Verification:** `npm run build` passes, seed CLI unaffected
- **Committed in:** b716df5 (Task 2 commit)

**2. [Rule 3 - Blocking] Runtime QStash verification instead of verifySignatureAppRouter**
- **Found during:** Task 2 (npm run build verification)
- **Issue:** `verifySignatureAppRouter` from `@upstash/qstash/nextjs` validates `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` at import time. Build fails without these env vars set.
- **Fix:** Replaced static import + wrapper with runtime lazy import of `Receiver` class inside the POST handler. Performs identical HMAC signature verification at request time.
- **Files modified:** `src/app/api/cron/poll-matches/route.ts`
- **Verification:** `npm run build` passes without QStash env vars. Route registered as dynamic (`f`).
- **Committed in:** b716df5 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were necessary for the Next.js build to succeed. No scope creep -- same functionality via different import/verification strategy.

## Issues Encountered
- Drizzle `npx drizzle-kit push` failed as expected (no DATABASE_URL configured locally). Migration file generated successfully, validating schema correctness. Push deferred to deployment.

## User Setup Required

**External services require manual configuration before the polling pipeline can run:**

1. **QStash (Upstash):** Create free account at console.upstash.com
   - Set `QSTASH_TOKEN` from QStash Settings > Request Token
   - Set `QSTASH_CURRENT_SIGNING_KEY` from QStash Settings > Signing Keys
   - Set `QSTASH_NEXT_SIGNING_KEY` from QStash Settings > Signing Keys
   - Run `npm run setup-qstash` after deployment to create the schedule

2. **Database:** Run `npx drizzle-kit push` to create the api_call_log table

## Next Phase Readiness
- Pipeline infrastructure is complete for 06-02 (match-completion chain, daily resync)
- `pollActiveMatches` returns `completedFixtureIds` array ready for `handleMatchCompletion` (06-02)
- `isMatchWindowActive` function ready for browser polling adaptive intervals (06-03)
- All pipeline modules follow established Drizzle/ApiFootballClient patterns

---
*Phase: 06-live-data-pipeline*
*Completed: 2026-02-05*
