---
created: 2026-02-09T05:51:22.093Z
title: Pull all required Sports API data and verify daily request budget
area: api
files:
  - src/lib/api-football.ts
  - src/app/api/cron
---

## Problem

The database needs to be populated with all required stats data from the Sports API (API-Football). Currently the data pipeline exists (Phase 6) but needs verification that:

1. All required data endpoints are being called to populate the database with the stats needed for the dashboard (standings, matches, fixtures, events, odds, team details, player stats, etc.)
2. The total daily API request count across all 5 leagues stays under the 2,000 requests/day limit on the current subscription tier
3. Any missing data points that the UI expects but the pipeline doesn't currently fetch are identified

This includes checking cron polling frequency, number of endpoints per league, and whether batch/bulk endpoints can reduce request counts.

## Solution

1. Audit all server actions and components to catalog which data fields they read from the database
2. Map those fields back to API-Football endpoints required to populate them
3. Calculate daily request budget: (endpoints per league) x (5 leagues) x (polls per day)
4. Compare against 2,000/day limit
5. Identify optimization opportunities (bulk endpoints, reduced polling frequency for non-live data)
6. Document any data gaps where the UI expects data the pipeline doesn't fetch
