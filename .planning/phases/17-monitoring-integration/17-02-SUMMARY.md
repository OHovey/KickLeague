---
phase: 17-monitoring-integration
plan: 02
subsystem: infra
tags: [sentry, api-budget, cron-monitoring, alerting, error-capture]

# Dependency graph
requires:
  - phase: 17-monitoring-integration
    plan: 01
    provides: Sentry SDK configured for client/server/edge runtimes
provides:
  - API budget threshold alerting via Sentry (warning at 80%, critical at 93%)
  - Cron job failure capture via Sentry with route-specific tags
  - Best-effort budget checks after each cron execution
affects: [deployment, cron-jobs, api-budget]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Best-effort budget check pattern: try { await checkBudgetThresholds(); } catch {}", "Sentry captureException with cron tags for route-specific filtering"]

key-files:
  created: []
  modified:
    - src/lib/pipeline/api-budget.ts
    - src/app/api/cron/poll-matches/route.ts
    - src/app/api/cron/daily-resync/route.ts
    - src/app/api/cron/refresh-odds/route.ts

key-decisions:
  - "Budget thresholds at 80% (6,000) warning and 93% (7,000) critical of 7,500 daily limit"
  - "Budget checks are best-effort (caught silently) to avoid breaking cron routes"
  - "Sentry captureMessage with fatal level for critical threshold (not error) for maximum visibility"

patterns-established:
  - "Best-effort budget check: wrap checkBudgetThresholds() in silent try/catch after cron business logic"
  - "Cron error capture: Sentry.captureException with tags: { cron: 'route-name' } for Sentry issue grouping"

# Metrics
duration: 2min
completed: 2026-02-10
---

# Phase 17 Plan 02: API Budget Alerting and Cron Failure Capture Summary

**Sentry alerting for API-Football budget thresholds (80%/93%) and cron job failure capture with route-specific tags across all three cron routes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-10T20:13:44Z
- **Completed:** 2026-02-10T20:15:53Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- API budget module alerts via Sentry at 80% (warning) and 93% (fatal) of the 7,500 daily API-Football limit
- All three cron routes (poll-matches, daily-resync, refresh-odds) capture exceptions in Sentry with cron-specific tags
- Budget threshold checks run as best-effort after each cron execution, isolated so failures do not affect cron responses
- Console logging preserved alongside Sentry for log drain visibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Add API budget threshold alerting via Sentry** - `16a78a9` (feat)
2. **Task 2: Wrap cron routes with Sentry error capture and budget checks** - `b1b6872` (feat)

## Files Created/Modified
- `src/lib/pipeline/api-budget.ts` - Added checkBudgetThresholds() with WARNING_THRESHOLD (6,000) and CRITICAL_THRESHOLD (7,000), Sentry captureMessage at warning/fatal levels
- `src/app/api/cron/poll-matches/route.ts` - Added Sentry captureException in POST/GET catch blocks with cron tag, best-effort budget check after success
- `src/app/api/cron/daily-resync/route.ts` - Added Sentry captureException to existing catch block with cron tag, best-effort budget check after success
- `src/app/api/cron/refresh-odds/route.ts` - Added Sentry captureException in POST/GET catch blocks with cron tag, best-effort budget check after success

## Decisions Made
- Used `fatal` Sentry level (not `error`) for critical budget threshold to maximize alert visibility in Sentry dashboards
- Budget checks wrapped in silent try/catch to prevent budget-check failures from breaking cron route responses
- Applied Sentry capture to both POST (production QStash) and GET (dev testing) handlers for consistent coverage

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

Sentry environment variables must be configured (documented in 17-01-SUMMARY.md). No additional configuration needed for this plan.

## Next Phase Readiness
- Phase 17 monitoring integration is complete (both plans executed)
- API budget monitoring and cron failure alerting are ready for production
- Sentry will surface budget warnings and cron failures once DSN is configured

---
## Self-Check: PASSED

All 4 modified files verified present. Both task commits (16a78a9, b1b6872) verified in git log.

---
*Phase: 17-monitoring-integration*
*Completed: 2026-02-10*
