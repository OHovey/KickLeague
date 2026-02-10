---
phase: 17-monitoring-integration
verified: 2026-02-10T20:30:00Z
status: human_needed
score: 4/4 must-haves verified
human_verification:
  - test: "Trigger an unhandled error in the browser"
    expected: "Error appears in Sentry dashboard with environment tag and source maps"
    why_human: "Requires Sentry DSN configuration and external service verification"
  - test: "Deploy to Vercel and check Analytics dashboard"
    expected: "Page views and performance metrics appear in Vercel dashboard"
    why_human: "Vercel Analytics only activates on production deployments"
  - test: "Manually poll cron routes until budget exceeds 6,000 requests"
    expected: "Warning message appears in Sentry at 6,000, fatal at 7,000"
    why_human: "Requires production API-Football usage and Sentry configuration"
  - test: "Force a cron route to fail"
    expected: "Exception appears in Sentry with cron tag and route context"
    why_human: "Requires Sentry configuration and ability to trigger failures"
---

# Phase 17: Monitoring Integration Verification Report

**Phase Goal:** Errors are automatically captured, performance is tracked, and operators are alerted when the data pipeline or API budget is at risk

**Verified:** 2026-02-10T20:30:00Z
**Status:** human_needed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Unhandled errors and rejected promises are captured in Sentry with source maps and environment tags | VERIFIED | sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts all initialize Sentry with dsn and environment; instrumentation.ts loads correct runtime config; onRequestError exports captureRequestError |
| 2 | Vercel Analytics is active and page load performance is visible in the Vercel dashboard | VERIFIED | Analytics and SpeedInsights components imported and rendered in src/app/[locale]/layout.tsx (lines 8-9, 83-84); dependencies in package.json |
| 3 | When daily API-Football request count approaches the 7,500 limit, a warning is logged or alerted | VERIFIED | checkBudgetThresholds() in api-budget.ts sends Sentry.captureMessage at WARNING_THRESHOLD (6,000) and CRITICAL_THRESHOLD (7,000); called in all 3 cron routes as best-effort |
| 4 | When a QStash or Vercel cron route returns an error status, the failure is captured in Sentry with cron context | VERIFIED | All 3 cron routes (poll-matches, daily-resync, refresh-odds) call Sentry.captureException with tags: { cron: 'route-name' } and extra route context in catch blocks |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `sentry.client.config.ts` | Client-side Sentry initialization with environment tagging | VERIFIED | 10 lines, imports @sentry/nextjs, calls Sentry.init with NEXT_PUBLIC_SENTRY_DSN, environment, tracesSampleRate: 0.1 |
| `sentry.server.config.ts` | Server-side Sentry initialization with environment tagging | VERIFIED | 8 lines, imports @sentry/nextjs, calls Sentry.init with SENTRY_DSN, environment, tracesSampleRate: 0.1 |
| `sentry.edge.config.ts` | Edge runtime Sentry initialization | VERIFIED | 8 lines, identical to server config with SENTRY_DSN |
| `src/instrumentation.ts` | Next.js instrumentation hook that loads Sentry configs | VERIFIED | 13 lines, exports register() with runtime-conditional imports, exports onRequestError = Sentry.captureRequestError |
| `src/app/global-error.tsx` | Global error boundary that reports to Sentry | VERIFIED | 70 lines, 'use client', useEffect calls Sentry.captureException, renders fallback UI with reset button |
| `src/app/[locale]/layout.tsx` | Analytics and SpeedInsights components rendered | VERIFIED | Analytics (line 8, 83), SpeedInsights (line 9, 84) imported and rendered |
| `next.config.ts` | withSentryConfig wrapping | VERIFIED | Imports withSentryConfig (line 3), wraps withNextIntl(nextConfig) (line 68) |
| `src/lib/pipeline/api-budget.ts` | Budget threshold alerting via Sentry | VERIFIED | checkBudgetThresholds() function with WARNING_THRESHOLD (6,000), CRITICAL_THRESHOLD (7,000), calls Sentry.captureMessage with fatal/warning levels |
| `src/app/api/cron/poll-matches/route.ts` | Sentry error capture for poll-matches failures | VERIFIED | Imports Sentry and checkBudgetThresholds; try/catch around pollActiveMatches() with Sentry.captureException (lines 75-78); budget check on lines 70, 93 |
| `src/app/api/cron/daily-resync/route.ts` | Sentry error capture for daily-resync failures | VERIFIED | Imports Sentry and checkBudgetThresholds; Sentry.captureException in catch (lines 33-36); budget check on line 27 |
| `src/app/api/cron/refresh-odds/route.ts` | Sentry error capture for refresh-odds failures | VERIFIED | Imports Sentry and checkBudgetThresholds; try/catch with Sentry.captureException (lines 54-57, 76-79); budget checks on lines 49, 71 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/instrumentation.ts` | `sentry.server.config.ts` | dynamic import in register() | WIRED | Line 5: `await import('../sentry.server.config')` when NEXT_RUNTIME === 'nodejs' |
| `src/instrumentation.ts` | `sentry.edge.config.ts` | dynamic import in register() | WIRED | Line 9: `await import('../sentry.edge.config')` when NEXT_RUNTIME === 'edge' |
| `src/app/[locale]/layout.tsx` | `@vercel/analytics` | Analytics component | WIRED | Line 8 import, line 83 render: `<Analytics />` |
| `src/app/[locale]/layout.tsx` | `@vercel/speed-insights` | SpeedInsights component | WIRED | Line 9 import, line 84 render: `<SpeedInsights />` |
| `src/app/global-error.tsx` | `@sentry/nextjs` | captureException call | WIRED | Line 3 import, line 13: `Sentry.captureException(error)` in useEffect |
| `src/lib/pipeline/api-budget.ts` | `@sentry/nextjs` | captureMessage on threshold breach | WIRED | Lines 95, 106: `Sentry.captureMessage(message, { level: 'fatal'/'warning', extra: {...} })` |
| `src/app/api/cron/poll-matches/route.ts` | `@sentry/nextjs` | captureException in catch | WIRED | Lines 75-78: `Sentry.captureException(error, { tags: { cron: 'poll-matches' }, extra: {...} })` |
| `src/app/api/cron/poll-matches/route.ts` | `api-budget.checkBudgetThresholds` | best-effort budget check | WIRED | Lines 70, 93: `try { await checkBudgetThresholds(); } catch {}` |
| `src/app/api/cron/daily-resync/route.ts` | `@sentry/nextjs` | captureException in catch | WIRED | Lines 33-36: `Sentry.captureException(error, { tags: { cron: 'daily-resync' }, extra: {...} })` |
| `src/app/api/cron/daily-resync/route.ts` | `api-budget.checkBudgetThresholds` | best-effort budget check | WIRED | Line 27: `try { await checkBudgetThresholds(); } catch {}` |
| `src/app/api/cron/refresh-odds/route.ts` | `@sentry/nextjs` | captureException in catch | WIRED | Lines 54-57, 76-79: `Sentry.captureException(error, { tags: { cron: 'refresh-odds' }, extra: {...} })` |
| `src/app/api/cron/refresh-odds/route.ts` | `api-budget.checkBudgetThresholds` | best-effort budget check | WIRED | Lines 49, 71: `try { await checkBudgetThresholds(); } catch {}` |

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| MON-01: Sentry error tracking integrated with source maps and environment tagging | SATISFIED | All 3 Sentry config files (client/server/edge) initialize with environment tag; next.config.ts wrapped with withSentryConfig for source map uploads; instrumentation.ts loads correct runtime config |
| MON-02: Vercel Analytics enabled for performance monitoring | SATISFIED | Analytics and SpeedInsights components rendered in locale layout; dependencies in package.json |
| MON-03: API budget monitoring with alerts when daily API-Football usage approaches limits | SATISFIED | checkBudgetThresholds() alerts at 80% (6,000 requests) with warning level and 93% (7,000 requests) with fatal level; called in all 3 cron routes |
| MON-04: Cron job failure alerting when QStash or Vercel cron routes fail | SATISFIED | All 3 cron routes (poll-matches, daily-resync, refresh-odds) call Sentry.captureException with cron-specific tags in catch blocks |

### Anti-Patterns Found

No anti-patterns detected. All files are production-ready with no TODOs, placeholders, or stub implementations.

### Human Verification Required

#### 1. Sentry Error Capture with Source Maps

**Test:** Trigger an unhandled error in the browser (e.g., throw new Error('test') in a component) and verify it appears in Sentry dashboard with source maps and environment tag

**Expected:** Error event appears in Sentry with:
- Stack trace showing original TypeScript source files (not minified)
- Environment tag matching NODE_ENV (development or production)
- Browser context (user agent, URL)

**Why human:** Requires Sentry DSN configuration (NEXT_PUBLIC_SENTRY_DSN, SENTRY_DSN) and external service verification. Can't verify external service integration programmatically.

#### 2. Vercel Analytics Page View Tracking

**Test:** Deploy to Vercel production and visit multiple pages. Check Vercel dashboard Analytics tab.

**Expected:** 
- Page views appear in Vercel Analytics dashboard
- Performance metrics (Web Vitals: CLS, FID, LCP) are collected
- Analytics data updates within a few minutes

**Why human:** Vercel Analytics and Speed Insights only activate on Vercel production deployments (silently skip in dev/preview). Can't verify without actual deployment.

#### 3. API Budget Threshold Alerting

**Test:** Run cron jobs until daily API-Football request count exceeds 6,000, then 7,000. Check Sentry Issues.

**Expected:**
- At 6,000 requests: Sentry message with "API-Football budget WARNING: 6000/7500 daily requests used", level: warning
- At 7,000 requests: Sentry message with "API-Football budget CRITICAL: 7000/7500 daily requests used", level: fatal
- Both include extra context: dailyCount, threshold, dailyLimit

**Why human:** Requires production API-Football usage and Sentry configuration. Can't trigger real API usage in verification. Budget tracking depends on actual API calls logged by api-budget.ts.

#### 4. Cron Job Failure Alerting

**Test:** Force a cron route to fail (e.g., temporarily break database connection or API-Football client). Check Sentry Issues.

**Expected:**
- Exception appears in Sentry with:
  - Tag: `cron: 'poll-matches'` (or 'daily-resync', 'refresh-odds')
  - Extra context: `route: '/api/cron/poll-matches'`
  - Full stack trace with error message
- Budget check still runs after success (when unfailing the route)

**Why human:** Requires Sentry configuration and ability to trigger controlled failures in production/staging environment. Can't safely trigger failures in verification without affecting real data pipeline.

---

## Summary

**All automated checks passed.** Phase 17 goal is architecturally achieved:

1. Sentry SDK is properly configured for all runtimes (client/server/edge) with environment tagging and source map upload support
2. Global error boundary catches unhandled errors and reports to Sentry
3. Vercel Analytics and Speed Insights are wired into the layout
4. API budget threshold alerting is implemented at 80% (warning) and 93% (critical)
5. All three cron routes capture failures with Sentry and include cron-specific tags
6. All key links are properly wired with no orphaned code

**Human verification required** to confirm:
- Sentry actually receives errors (requires DSN configuration)
- Vercel Analytics collects data in production (requires Vercel deployment)
- Budget alerts fire at correct thresholds (requires production usage)
- Cron failures are properly captured (requires controlled failure testing)

**User Setup Required (from 17-01-SUMMARY.md):**
- `NEXT_PUBLIC_SENTRY_DSN` - Client-side error tracking
- `SENTRY_DSN` - Server/edge error tracking
- `SENTRY_AUTH_TOKEN` - Source map uploads during build
- `SENTRY_ORG` - Build configuration
- `SENTRY_PROJECT` - Build configuration

Without these environment variables, Sentry will silently skip initialization. The application will build and run normally, but error tracking will not function.

---

_Verified: 2026-02-10T20:30:00Z_
_Verifier: Claude (gsd-verifier)_
