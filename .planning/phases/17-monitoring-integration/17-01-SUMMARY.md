---
phase: 17-monitoring-integration
plan: 01
subsystem: infra
tags: [sentry, vercel-analytics, speed-insights, error-tracking, performance-monitoring]

# Dependency graph
requires:
  - phase: 16-security-hardening
    provides: Security headers in next.config.ts that must be preserved
provides:
  - Sentry error tracking for client, server, and edge runtimes
  - Global error boundary with Sentry reporting
  - Source map uploads via withSentryConfig build wrapper
  - Vercel Analytics page view tracking
  - Vercel Speed Insights Web Vitals collection
affects: [17-monitoring-integration, deployment, csp-headers]

# Tech tracking
tech-stack:
  added: ["@sentry/nextjs", "@vercel/analytics", "@vercel/speed-insights"]
  patterns: ["Sentry config split by runtime (client/server/edge)", "instrumentation.ts for runtime-conditional loading", "withSentryConfig wrapping withNextIntl in next.config.ts"]

key-files:
  created:
    - sentry.client.config.ts
    - sentry.server.config.ts
    - sentry.edge.config.ts
    - src/instrumentation.ts
    - src/app/global-error.tsx
  modified:
    - next.config.ts
    - src/app/[locale]/layout.tsx
    - package.json

key-decisions:
  - "10% tracesSampleRate for low-cost monitoring on a content site"
  - "No Sentry Replay integration (unnecessary for content site)"
  - "sourcemaps.deleteSourcemapsAfterUpload replaces deprecated hideSourceMaps"
  - "CSP connect-src/script-src updated for Sentry and Vercel analytics domains"

patterns-established:
  - "Sentry config split: client/server/edge configs at project root, loaded via instrumentation.ts"
  - "withSentryConfig wraps withNextIntl(nextConfig) as outermost config wrapper"

# Metrics
duration: 3min
completed: 2026-02-10
---

# Phase 17 Plan 01: Sentry + Vercel Analytics Summary

**Sentry error tracking with source maps and environment tagging, plus Vercel Analytics and Speed Insights for performance monitoring**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-10T20:08:01Z
- **Completed:** 2026-02-10T20:11:16Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Sentry SDK configured for client, server, and edge runtimes with environment tagging and 10% trace sampling
- Global error boundary catches unhandled errors, reports to Sentry, and renders a fallback UI
- Source maps automatically uploaded to Sentry during builds (when SENTRY_AUTH_TOKEN is set)
- Vercel Analytics and Speed Insights components rendered in locale layout
- CSP connect-src and script-src updated to allow Sentry ingest and Vercel analytics domains

## Task Commits

Each task was committed atomically:

1. **Task 1: Install and configure Sentry for Next.js 16** - `dbdddc7` (feat)
2. **Task 2: Add Vercel Analytics and Speed Insights to layout** - `b0fc67c` (feat)

## Files Created/Modified
- `sentry.client.config.ts` - Client-side Sentry init with NEXT_PUBLIC_SENTRY_DSN and environment tagging
- `sentry.server.config.ts` - Server-side Sentry init with SENTRY_DSN and environment tagging
- `sentry.edge.config.ts` - Edge runtime Sentry init with SENTRY_DSN and environment tagging
- `src/instrumentation.ts` - Next.js instrumentation hook with runtime-conditional Sentry loading and onRequestError export
- `src/app/global-error.tsx` - Global error boundary with Sentry.captureException and inline-styled fallback UI
- `next.config.ts` - Wrapped with withSentryConfig; CSP updated for Sentry/Vercel analytics domains
- `src/app/[locale]/layout.tsx` - Added Analytics and SpeedInsights components
- `package.json` - Added @sentry/nextjs, @vercel/analytics, @vercel/speed-insights

## Decisions Made
- Used 10% tracesSampleRate (low cost for content site, sufficient for monitoring)
- Disabled Sentry Replay (session and error replays) -- unnecessary overhead for a content site
- Replaced deprecated `hideSourceMaps` with `sourcemaps.deleteSourcemapsAfterUpload: true`
- Removed deprecated `disableLogger` option (not supported with Turbopack)
- Proactively updated CSP connect-src/script-src for Sentry and Vercel analytics domains (Rule 2 - preparing for CSP enforcement mode)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced deprecated Sentry config options**
- **Found during:** Task 1 (Sentry configuration)
- **Issue:** `hideSourceMaps` and `disableLogger` no longer exist in @sentry/nextjs v10; build failed with type error
- **Fix:** Replaced `hideSourceMaps: true` with `sourcemaps: { deleteSourcemapsAfterUpload: true }` and removed `disableLogger`
- **Files modified:** next.config.ts
- **Verification:** Build passes cleanly
- **Committed in:** dbdddc7 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Updated CSP for Sentry and Vercel analytics domains**
- **Found during:** Task 1 (Sentry configuration)
- **Issue:** CSP connect-src and script-src did not include Sentry ingest or Vercel analytics domains; would block telemetry when CSP moves to enforcement mode
- **Fix:** Added `https://*.ingest.sentry.io`, `https://vitals.vercel-insights.com`, `https://va.vercel-scripts.com` to connect-src; added `https://va.vercel-scripts.com` to script-src
- **Files modified:** next.config.ts
- **Verification:** Build passes; CSP directives include new domains
- **Committed in:** dbdddc7 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes necessary for correctness. Deprecated API fix was required for build to pass. CSP update prevents telemetry blocking when CSP goes enforcement. No scope creep.

## Issues Encountered
None beyond the deviation fixes documented above.

## User Setup Required

The following environment variables must be configured for Sentry to function:

| Variable | Source | Required For |
|----------|--------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Dashboard > Settings > Client Keys (DSN) | Client-side error tracking |
| `SENTRY_DSN` | Sentry Dashboard > Settings > Client Keys (DSN) | Server/edge error tracking |
| `SENTRY_AUTH_TOKEN` | Sentry Dashboard > Settings > Auth Tokens | Source map uploads during build |
| `SENTRY_ORG` | Sentry Dashboard > Settings > General > Organization Slug | Build configuration |
| `SENTRY_PROJECT` | Sentry Dashboard > Settings > General > Project Slug | Build configuration |

Without these variables, Sentry will silently skip initialization and source map uploads. The application will still build and run normally.

Vercel Analytics and Speed Insights require no configuration -- they auto-activate on Vercel deployments.

## Next Phase Readiness
- Error tracking infrastructure ready for production deployment
- Performance monitoring will activate automatically on Vercel
- Ready for Plan 02 (health check endpoints and uptime monitoring)

---
## Self-Check: PASSED

All 7 created/modified files verified present. Both task commits (dbdddc7, b0fc67c) verified in git log.

---
*Phase: 17-monitoring-integration*
*Completed: 2026-02-10*
