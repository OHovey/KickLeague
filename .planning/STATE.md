# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** Football fans can see league standings with rich visual context -- sparklines, trend indicators, form runs, position history -- presented with the information density of a financial dashboard.
**Current focus:** v1.4 Programmatic SEO -- Defining requirements

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements for v1.4
Last activity: 2026-02-12 — Milestone v1.4 started, v1.3 archived

## Performance Metrics

**v1.0 Velocity:**
- Total plans completed: 26
- Average duration: 3.8 min
- Total execution time: ~1.77 hours

**v1.1 Velocity:**
- Total plans completed: 6
- Average duration: 2.5 min
- Total execution time: 15 min

**v1.2 Velocity:**
- Total plans completed: 21
- Timeline: 5 days (2026-02-07 to 2026-02-09)

**v1.3 Velocity:**
| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 16 | 01 | 2min | 2 | 3 |
| 16 | 02 | 1min | 2 | 2 |
| 17 | 01 | 3min | 2 | 8 |
| 17 | 02 | 2min | 2 | 4 |
| 18 | 01 | 3min | 2 | 2 |
| 18 | 02 | ~45min | 2 | 0 |
| 19 | 01 | 5min | 2 | 2 |
| 19 | 02 | 10min | 2 | 0 |
| 20 | 01 | 2min | 3 | 3 |

## Accumulated Context

### Decisions

All decisions logged in PROJECT.md Key Decisions table (17 decisions, all marked Good).

**16-01:** In-memory token bucket rate limiter (no Redis); lazy cleanup for serverless; no X-RateLimit-* headers exposed
**16-02:** CSP in report-only mode for safe rollout; CSP violation logging via console.warn (not database)
**17-01:** 10% tracesSampleRate for Sentry (low cost for content site); no Replay integration; CSP updated for Sentry/Vercel analytics domains
**17-02:** Budget thresholds at 80%/93% of daily limit; fatal Sentry level for critical; best-effort budget checks in cron routes
**18-01:** DEPLOY_URL documented as commented-out optional (falls back to VERCEL_URL); Sentry vars marked required; 14 tables counted in schema
**18-02:** Personal Vercel account deployment (not team scope); individual league seeding for timeout resilience; migrations applied before first deploy
**19-01:** 3-minute QStash polling (484/1000 daily QStash free tier); fixture-window detection prevents wasted API-Football calls
**19-02:** 2-day data gap (Feb 9-11) expected — daily-resync at 04:00 UTC will backfill; no manual intervention needed
**20-01:** Checklists reference exact env var names from source code for accuracy; markdown checkboxes for trackable action items

### Pending Todos (manual/infrastructure)

- Sign up for 5 affiliate programs (Paddy Power, Entain, Kindred, 888, William Hill)
- Collect affiliate IDs/btags from each dashboard after approval
- Set up Google AdSense account and create 8 ad unit slots
- Update public/ads.txt with real publisher ID
- ~~Configure Sentry env vars~~ (done -- .env.local configured 2026-02-10)
- ~~Configure QStash env vars~~ (done -- .env.local configured 2026-02-11)

### Pending Todos (code)

- ~~Show current matchweek standings before week completes~~ (done -- quick task 8, 2026-02-12)
- ~~Fix language dropdown z-index behind stats card~~ (done -- quick task 9, 2026-02-12)
- ~~Include team emblem in league table~~ (done -- quick task 10, 2026-02-12)
- ~~Rename results to recent matches and fixtures to upcoming matches~~ (done -- quick task 11, 2026-02-12)

### Tech Debt

None remaining -- all v1.0/v1.1 tech debt resolved in v1.2.

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Fix empty biggest upset card on homepage | 2026-02-10 | 0a0c054 | [1-fix-empty-biggest-upset-card-on-homepage](./quick/1-fix-empty-biggest-upset-card-on-homepage/) |
| 2 | Fix league table position change column showing blanks | 2026-02-10 | 81937b3 | [2-fix-league-table-column-showing-blanks-a](./quick/2-fix-league-table-column-showing-blanks-a/) |
| 3 | Balance recent results card height to match fixtures | 2026-02-10 | c5a2265 | [3-balance-recent-results-card-height-to-ma](./quick/3-balance-recent-results-card-height-to-ma/) |
| 4 | Add date to recent result rows and balance height | 2026-02-10 | 7e3dfcf | [4-add-date-to-recent-result-rows-and-balan](./quick/4-add-date-to-recent-result-rows-and-balan/) |
| 5 | Make both match preview cards equal height | 2026-02-10 | 093ba2a | [5-make-both-match-preview-cards-equal-heig](./quick/5-make-both-match-preview-cards-equal-heig/) |
| 6 | Prepare frontend-design skill prompt | 2026-02-10 | 8da9ae1 | [6-prepare-a-frontend-design-skill-prompt-f](./quick/6-prepare-a-frontend-design-skill-prompt-f/) |
| 7 | Add feedback option in navbar | 2026-02-10 | 87f5a4e | [7-add-feedback-option-in-navbar-that-submi](./quick/7-add-feedback-option-in-navbar-that-submi/) |
| 8 | Show in-progress matchweek standings by default | 2026-02-12 | 1aa013a | [8-show-in-progress-matchweek-standings-by-](./quick/8-show-in-progress-matchweek-standings-by-/) |
| 9 | Fix language dropdown z-index behind stat cards | 2026-02-12 | a275b28 | [9-fix-language-dropdown-z-index-behind-sta](./quick/9-fix-language-dropdown-z-index-behind-sta/) |
| 10 | Include team emblem in league table | 2026-02-12 | fdd7b16 | [10-include-team-emblem-in-league-table](./quick/10-include-team-emblem-in-league-table/) |
| 11 | Rename Results/Fixtures to Recent Matches/Upcoming Matches | 2026-02-12 | 5025118 | [11-rename-results-to-recent-matches-and-fix](./quick/11-rename-results-to-recent-matches-and-fix/) |

## Session Continuity

Last session: 2026-02-12
Stopped at: Completed quick task 11 (rename Results/Fixtures to Recent Matches/Upcoming Matches)
Resume file: None
Production URL: https://kick-league-gray.vercel.app
