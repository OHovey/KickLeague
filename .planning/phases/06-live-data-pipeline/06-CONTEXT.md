# Phase 6: Live Data Pipeline - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated backend infrastructure that keeps the platform current without manual intervention. Covers: scheduled polling of API-Football, match completion detection, standings recalculation, cache invalidation, ISR revalidation, and browser-side smart polling for silent data refresh. Does NOT include SSE, user accounts, or admin UI.

</domain>

<decisions>
## Implementation Decisions

### Polling Strategy
- **Budget-tier polling (current):** During active matches, poll API-Football every 30 minutes. Add upgrade todo for 60-second polling when budget allows.
- **Off-peak:** Daily resync only (once at fixed time, e.g. 04:00 UTC). No off-peak polling.
- **Current season only** for daily resync (~30 API calls). Previous season data is static.
- **Stagger by league:** Each league polls at a different offset to spread API load.
- **Smart re-fetch:** Check DB for fixtures scheduled today/tomorrow. Only poll fixture IDs that are actually happening or just happened. Skip leagues with no active matches.
- **Skip player squads** during daily resyncs. Squads rarely change — refresh weekly or manually during transfer windows.
- **Estimated daily cost:** ~5-15 API calls on quiet days, ~30 on full matchdays (budget tier).

### Update Delivery (Browser)
- **Smart polling, not SSE.** Browser polls own Next.js API route (e.g. `/api/updates/check`) — zero external API cost.
- **During match windows:** Browser polls every 30 seconds.
- **Off-peak:** Browser polls every 5 minutes (reduced rate, always active).
- **Silent refresh:** Data updates automatically in place. No "new data available" banner — table just updates.
- **Data freshness indicator:** Subtle "Last updated: X min ago" in page footer or table header.

### Failure & Recovery
- **Retry with backoff:** On API-Football failure (down, rate limited, timeout), retry 3 times with increasing delay, then skip until next scheduled poll.
- **Auto-correct data drift:** If daily resync detects standings mismatch vs computed standings, overwrite with fresh API data silently. Log the discrepancy.
- **Logging:** Structured JSON logging that flows into Vercel's built-in log viewer. Investigate Axiom integration for searchable dashboards.
- **Auto-handle postponements:** If API says postponed/cancelled, update DB fixture status automatically. No manual review needed.

### Match Window Awareness
- **Fixture-driven detection:** Check upcoming fixtures in DB. If a match kicks off within the next 3 hours, activate match-day polling for that league.
- **Tiered post-kickoff polling:** Poll more actively near expected full-time (~90-100 min), reduce frequency after 2 hours, stop at 3 hours post-kickoff.
- **Upgrade todo:** Constant 2-min polling throughout match duration when budget allows.
- **Match completion chain:** Claude's discretion — recalculate standings, invalidate cache, trigger ISR revalidation as appropriate.

### API Usage Tracking
- **Database table** to track API calls: date, endpoint, league, call count, success/failure. Enables monitoring daily budget consumption.
- **API polling document:** Maintain a living document describing how the polling system works, updated as the system is refined.

### Claude's Discretion
- Match completion chain specifics (standings recalc + cache + ISR vs lazy approach)
- Exact backoff intervals for retry logic
- QStash job configuration details
- Redis vs DB for "last updated" timestamp checks
- Structured log format specifics
- Axiom vs plain Vercel logs decision

</decisions>

<specifics>
## Specific Ideas

- User wants to track API usage over time to understand costs — database table for call accounting is a hard requirement, not optional.
- Current full reseed is ~421 API calls (too expensive for daily). Smart re-fetch approach is essential to stay within budget.
- Free tier is 100 calls/day — daily pipeline must stay well under this during development.
- Polling system should be designed with clear upgrade path: document what changes at each tier (free → pro).

</specifics>

<deferred>
## Deferred Ideas

- Custom admin dashboard for pipeline health — use Vercel logs + API usage table for now.
- SSE (Server-Sent Events) for true push updates — smart polling covers v1 needs.
- Email/Slack alerting for extended API outages — logs sufficient for now.

</deferred>

## Upgrade Todos (Budget Tier → Pro Tier)

These are documented upgrade paths to activate when API budget increases:

1. **Match polling frequency:** 30 min → 60 seconds during active matches
2. **Post-kickoff polling:** Tiered backoff → constant 2-min polling throughout match
3. **Fixture detail batches:** Can fetch events/stats per fixture (currently empty on free tier)

---

*Phase: 06-live-data-pipeline*
*Context gathered: 2026-02-05*
