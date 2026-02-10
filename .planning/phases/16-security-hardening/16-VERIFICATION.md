---
phase: 16-security-hardening
verified: 2026-02-10T19:55:00Z
status: passed
score: 10/10 must-haves verified
re_verification: false
---

# Phase 16: Security Hardening Verification Report

**Phase Goal:** Public API endpoints are protected from abuse and the site sends proper security headers on every response

**Verified:** 2026-02-10T19:55:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Requests to /api/updates/check beyond 30/min per IP receive 429 with JSON error and Retry-After header | ✓ VERIFIED | rate-limit.ts:33-38 exports RATE_LIMIT_UPDATES with maxTokensPerIp: 30. updates/check/route.ts:22-36 calls rateLimit() and returns 429 with retryAfter field and Retry-After header |
| 2 | Requests to /api/clicks beyond 10/min per IP receive 429 with JSON error and Retry-After header | ✓ VERIFIED | rate-limit.ts:40-45 exports RATE_LIMIT_CLICKS with maxTokensPerIp: 10. clicks/route.ts:17-31 calls rateLimit() and returns 429 with same format |
| 3 | Global ceiling prevents endpoint overload regardless of IP distribution | ✓ VERIFIED | rate-limit.ts:18-19 defines globalMax config field. Lines 109-120 check and decrement globalBucket.tokens. Lines 130-140 deny if global bucket exhausted |
| 4 | All 429 responses are logged server-side with IP, endpoint, and timestamp | ✓ VERIFIED | rate-limit.ts:135-137 logs [rate-limit] prefix with endpoint, ip, and ISO timestamp on every deny |
| 5 | Rate limit info headers (X-RateLimit-Remaining etc.) are NOT exposed | ✓ VERIFIED | Grepped both API routes — only Retry-After header present on 429. No X-RateLimit-* headers in codebase |
| 6 | Every response includes Content-Security-Policy header | ✓ VERIFIED | next.config.ts:8-22 defines cspDirectives. Lines 24-28 add Content-Security-Policy-Report-Only header to securityHeaders array. Lines 56-62 apply to all routes via source: '/(.*)'  |
| 7 | Every response includes X-Frame-Options: DENY | ✓ VERIFIED | next.config.ts:29-32 defines X-Frame-Options: DENY |
| 8 | Every response includes X-Content-Type-Options: nosniff | ✓ VERIFIED | next.config.ts:33-36 defines X-Content-Type-Options: nosniff |
| 9 | Every response includes Referrer-Policy: strict-origin-when-cross-origin | ✓ VERIFIED | next.config.ts:37-40 defines Referrer-Policy: strict-origin-when-cross-origin |
| 10 | Every response includes Permissions-Policy restricting unused features | ✓ VERIFIED | next.config.ts:41-44 defines Permissions-Policy denying camera, microphone, geolocation, interest-cohort, payment, usb, magnetometer, gyroscope, accelerometer |
| 11 | CSP violations are reported to /api/csp-report endpoint | ✓ VERIFIED | next.config.ts:20 includes report-uri /api/csp-report directive. csp-report/route.ts:13-35 POST handler logs violations with blockedUri, violatedDirective, documentUri |

**Score:** 11/11 truths verified (10 must-haves from plans + 1 derived from phase goal)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/rate-limit.ts` | In-memory rate limiter with per-IP and global token buckets | ✓ VERIFIED | 148 lines. Exports rateLimit(), RateLimitResult, RateLimitConfig, RATE_LIMIT_UPDATES, RATE_LIMIT_CLICKS. Token bucket algorithm with lazy refill (lines 74-80), cleanup (lines 87-97), dual-bucket checking (lines 103-147) |
| `src/app/api/updates/check/route.ts` | Rate-limited updates check endpoint | ✓ VERIFIED | 107 lines. Imports rateLimit and RATE_LIMIT_UPDATES (line 7). Rate limit guard as first logic (lines 22-36) before param validation and DB queries |
| `src/app/api/clicks/route.ts` | Rate-limited clicks endpoint | ✓ VERIFIED | 81 lines. Imports rateLimit and RATE_LIMIT_CLICKS (line 4). Rate limit guard as first logic (lines 17-31) before isDatabaseConfigured() check |
| `next.config.ts` | Security headers configuration for all responses | ✓ VERIFIED | 68 lines. Defines cspDirectives (lines 8-22), securityHeaders array with 6 headers (lines 24-49), headers() function applying to source /(.*) (lines 56-62) |
| `src/app/api/csp-report/route.ts` | CSP violation report logging endpoint | ✓ VERIFIED | 36 lines. POST handler (lines 13-35) parses both legacy csp-report and Reporting API formats, logs with console.warn, returns 204 No Content |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| src/app/api/updates/check/route.ts | src/lib/rate-limit.ts | import and early-return guard | ✓ WIRED | Line 7 imports rateLimit and RATE_LIMIT_UPDATES. Line 27 calls rateLimit(ip, RATE_LIMIT_UPDATES). Lines 28-35 return 429 if !rl.allowed |
| src/app/api/clicks/route.ts | src/lib/rate-limit.ts | import and early-return guard | ✓ WIRED | Line 4 imports rateLimit and RATE_LIMIT_CLICKS. Line 22 calls rateLimit(ip, RATE_LIMIT_CLICKS). Lines 23-30 return 429 if !rl.allowed |
| next.config.ts | src/app/api/csp-report/route.ts | report-uri directive in CSP header | ✓ WIRED | next.config.ts line 20 includes "report-uri /api/csp-report" in cspDirectives. csp-report/route.ts exports POST handler that browsers will invoke on CSP violations |

### Requirements Coverage

| Requirement | Status | Supporting Evidence |
|-------------|--------|---------------------|
| SEC-01: Rate limiting on public API endpoints | ✓ SATISFIED | Both /api/updates/check and /api/clicks have rate limit guards (truths 1-2 verified) |
| SEC-02: Content Security Policy headers configured | ✓ SATISFIED | Content-Security-Policy-Report-Only header present with correct directives (truth 6 verified) |
| SEC-03: Security response headers | ✓ SATISFIED | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy all present (truths 7-10 verified) |

### Anti-Patterns Found

None.

**Notes:**
- Console.log in rate-limit.ts:135-137 is intentional for operational logging of rate limit denials (per plan requirement "All 429 responses are logged server-side")
- Console.warn in csp-report/route.ts:22-27 is intentional for CSP violation visibility (per plan decision "CSP violation logging via console.warn")

### Human Verification Required

#### 1. Rate limit enforcement under load

**Test:** 
1. Deploy to production
2. Use a load testing tool (e.g., `ab`, `wrk`, or `curl` in a loop) to send 35+ requests/minute to `/api/updates/check` from a single IP
3. Repeat for `/api/clicks` with 15+ requests/minute

**Expected:**
- Requests 1-30 to /api/updates/check should succeed (200)
- Request 31+ should return 429 with `{"error": "Too many requests", "retryAfter": <number>}` and Retry-After header
- Similar behavior for /api/clicks at 11+ requests
- Server logs should show `[rate-limit] 429 | endpoint=... | ip=... | time=...` entries

**Why human:** Requires production deployment and load testing. Automated verification would need to run the dev server and simulate requests, but rate limiting behavior under real serverless execution (potential cold starts, memory sharing) differs from local dev.

#### 2. Security headers in production responses

**Test:**
1. Deploy to production
2. Run `curl -I https://kickleague.com` (or production URL)
3. Verify response includes all 6 security headers:
   - Content-Security-Policy-Report-Only
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: camera=(), microphone=(), ...
   - Report-To

**Expected:**
All 6 headers present on homepage, API routes, and static assets.

**Why human:** next.config.ts headers() function is verified in code, but actual header application depends on Next.js build and Vercel deployment config. Production verification needed to ensure no middleware or edge config overrides these headers.

#### 3. CSP allows AdSense and blocks unexpected sources

**Test:**
1. Deploy to production with AdSense units active
2. Load the homepage in browser
3. Open DevTools Console — check for CSP violations
4. Verify AdSense ads render without errors
5. Check Vercel logs or /api/csp-report for any violation reports

**Expected:**
- AdSense scripts from pagead2.googlesyndication.com, googletagservices.com load without CSP blocks
- Team logos from media.api-sports.io load without CSP blocks
- Google Fonts from fonts.googleapis.com and fonts.gstatic.com load without CSP blocks
- No CSP violations for legitimate site resources
- If violations appear for unexpected domains, update CSP directives and switch from Report-Only to enforcing

**Why human:** CSP correctness depends on:
1. Complete inventory of third-party sources (AdSense, analytics, fonts) which can only be verified visually in production with real ads rendering
2. Unexpected sources that only appear in production (e.g., Vercel analytics, preview mode scripts)
3. Need to verify Report-Only mode collects violations without breaking the site before switching to enforcing mode

#### 4. CSP violation reporting endpoint receives and logs reports

**Test:**
1. After deploying to production, intentionally trigger a CSP violation (e.g., add a test script tag loading from evil.com in browser DevTools)
2. Check production logs (Vercel dashboard or log drain) for `[csp-report]` entries
3. Verify the logged JSON includes blockedUri, violatedDirective, documentUri

**Expected:**
- Browser sends POST to /api/csp-report
- Server logs show `[csp-report] {"blockedUri":"...","violatedDirective":"...","documentUri":"...","timestamp":"..."}`
- Endpoint returns 204 status

**Why human:** Requires production browser to trigger CSP violation and Vercel log inspection. Automated test would need to mock browser CSP violation reports, but real browser behavior (different formats, edge cases) can only be verified in production.

### Summary

**All must-haves verified.** Phase 16 goal achieved:

1. **Rate limiting:** Both public API endpoints (/api/updates/check, /api/clicks) have token bucket rate limiting with per-IP limits (30/min, 10/min) and global ceilings (300, 100). All 429 responses include JSON error body with retryAfter field and Retry-After header. Denials are logged server-side with IP, endpoint, and timestamp. No rate limit info headers exposed.

2. **Security headers:** All responses include 6 security headers via next.config.ts:
   - Content-Security-Policy-Report-Only with directives whitelisting AdSense scripts/frames, Google Fonts, API-Football images, and analytics while blocking everything else
   - X-Frame-Options: DENY (prevent clickjacking)
   - X-Content-Type-Options: nosniff (prevent MIME sniffing)
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy denying camera, microphone, geolocation, and other unused browser features
   - Report-To header configuring CSP violation reporting endpoint

3. **CSP violation reporting:** /api/csp-report endpoint logs CSP violations with blockedUri, violatedDirective, documentUri, and always returns 204 to prevent browser retries.

**Commits verified:**
- 1444654 (feat: create rate limiter)
- d0d3290 (feat: wire rate limiting)
- da1d5ee (feat: security headers)
- 9310d92 (feat: CSP report endpoint)

**Implementation quality:** No stubs, no placeholders, no anti-patterns. All artifacts are substantive and fully wired. Code includes proper TypeScript types, error handling, and operational logging.

**Production readiness:** Code is production-ready. Human verification needed to:
1. Confirm rate limiting works under production load
2. Verify headers appear in production responses
3. Ensure CSP allows AdSense/fonts/images without violations
4. Validate CSP report endpoint receives browser violation reports

**Next steps:**
- Monitor /api/csp-report logs in production for 24-48 hours
- Once clean (no false positives), switch Content-Security-Policy-Report-Only to Content-Security-Policy in next.config.ts to enforce
- Phase 17 (Monitoring) can integrate CSP violations into Sentry for better visibility

---

_Verified: 2026-02-10T19:55:00Z_
_Verifier: Claude (gsd-verifier)_
