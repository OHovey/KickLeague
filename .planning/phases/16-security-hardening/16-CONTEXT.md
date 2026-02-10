# Phase 16: Security Hardening - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Protect public API endpoints from abuse with rate limiting, and ensure the site sends proper security headers on every response. Covers `/api/updates/check` and `/api/clicks` endpoints. Does not add authentication, WAF, or new security features beyond what's in the success criteria.

</domain>

<decisions>
## Implementation Decisions

### Rate limit thresholds
- Moderate strictness: ~30 requests/minute per IP
- Both global ceiling AND per-IP limits (protects against distributed attacks)
- `/api/clicks` gets stricter limits (~10/min) since legitimate users click fewer affiliate links
- `/api/updates/check` gets the standard ~30/min threshold
- Immediate 429 response once limit is hit — no sliding window smoothing
- Rate limit info headers (X-RateLimit-Remaining, etc.) NOT exposed in responses — don't reveal limits to attackers

### CSP strictness
- CSP violations should be reported to a logging endpoint (report-uri/report-to)
- Allow room for future third-party integrations beyond AdSense + analytics — don't make the allowlist so tight it needs a redeploy for every new widget
- Specific CSP level and rollout strategy (enforce vs report-only first): Claude's discretion based on what the site actually needs

### Iframe & embedding policy
- X-Frame-Options: DENY — block all framing, no embedding anywhere
- Referrer-Policy: strict-origin-when-cross-origin — full URL to same-origin, only origin to cross-origin
- Social media crawlers should still work for OG/rich link previews (this is unaffected by framing rules)
- Permissions-Policy: Claude's discretion based on current feature set (the site doesn't use camera/mic/etc., but geo-compliance may need geolocation)

### Error responses
- Rate-limited requests return JSON only: `{ error: "Too many requests", retryAfter: <seconds> }`
- No custom styled 429 page — these are API endpoints consumed programmatically
- Include Retry-After header in 429 responses (standard HTTP practice)
- Log ALL 429 responses server-side: IP, endpoint, and timestamp for abuse pattern monitoring

### Claude's Discretion
- Exact CSP directive values and allowlisted domains
- Whether to start CSP in report-only mode before enforcing
- Permissions-Policy specifics (which browser features to deny/allow)
- Rate limiter implementation approach (in-memory, edge middleware, etc.)
- Global rate limit ceiling value
- X-Content-Type-Options value (nosniff is the obvious choice)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The key constraint is that rate limiting should be simple and infrastructure-light (no Redis or external rate limit service needed for the scale of this site).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-security-hardening*
*Context gathered: 2026-02-10*
