---
phase: 19-production-pipeline
plan: 01
subsystem: infra
tags: [qstash, cron, upstash, polling, pipeline]

requires:
  - phase: 18-production-deployment
    provides: Production Vercel + Neon environment with seeded data
provides:
  - QStash cron schedules for poll-matches (3-min) and refresh-odds (6-hour)
  - Automated data pipeline firing against production URL
affects: [19-production-pipeline]

tech-stack:
  added: []
  patterns: [qstash-cron-scheduling]

key-files:
  created: []
  modified:
    - scripts/setup-qstash-schedules.ts

key-decisions:
  - "3-minute polling interval (Pro tier budget: 32% utilization at peak, 484/1000 QStash free tier daily messages)"
  - "Fixture-window detection prevents API-Football calls when no matches active — QStash invocations are cheap no-ops outside match windows"

patterns-established:
  - "QStash schedule setup via npm run setup-qstash with DEPLOY_URL override"

duration: 5min
completed: 2026-02-11
---

# Plan 19-01: QStash Cron Schedules Summary

**QStash cron schedules configured in production: poll-matches every 3 minutes, refresh-odds every 6 hours, targeting kick-league-gray.vercel.app**

## Performance

- **Duration:** ~5 min (including human verification)
- **Tasks:** 2 (1 automated, 1 human checkpoint)
- **Files modified:** 2

## Accomplishments
- Updated poll-matches interval from 30-min to 3-min for near real-time live match scores
- Created QStash schedules targeting production URL (poll-matches: `scd_6dq1Juqp5j16gPVBRge3CC4Hk1QY`, refresh-odds: `scd_6gCrX2QCUg7GJ2FXZA26ZYqiJUTK`)
- Human verified both schedules visible and active in Upstash dashboard

## Task Commits

1. **Task 1: Update QStash schedule to 3-minute polling** - `90c6dcf` (feat)
2. **Task 2: Verify QStash schedules in Upstash dashboard** - human checkpoint (approved)

## Files Created/Modified
- `scripts/setup-qstash-schedules.ts` - Updated cron from `*/30` to `*/3`, JSDoc updated for Pro tier
- `src/app/api/cron/poll-matches/route.ts` - Comment updated from "budget tier" to "Pro tier"

## Decisions Made
- Kept 3-minute polling interval — 484 QStash messages/day is within 1,000 free tier limit; fixture-window detection prevents wasted API-Football calls

## Deviations from Plan
None - plan executed as written.

## Issues Encountered
- QSTASH_TOKEN was not in `.env.local` initially — user added it from Upstash Console before running setup script

## Next Phase Readiness
- QStash schedules firing in production, ready for 19-02 data freshness verification
- No blockers

---
*Phase: 19-production-pipeline*
*Completed: 2026-02-11*
