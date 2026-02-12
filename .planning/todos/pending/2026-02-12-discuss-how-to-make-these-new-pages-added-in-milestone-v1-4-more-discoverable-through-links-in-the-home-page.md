---
created: 2026-02-12T21:17:39.929Z
title: Discuss how to make v1.4 pages more discoverable through homepage links
area: ui
files:
  - src/app/[locale]/page.tsx
  - src/app/[locale]/league/[slug]/page.tsx
  - src/app/[locale]/stats/[leagueSlug]/[stat]/page.tsx
---

## Problem

Milestone v1.4 (Programmatic SEO) added several new page types -- league detail pages, team detail pages, and stat leaderboard pages -- but they are not linked from the homepage or other high-traffic pages. Users browsing the site have no way to discover these pages through navigation; they are only reachable via search engines or direct URL.

This reduces both user engagement (visitors don't find the content) and SEO value (internal links pass authority and help crawlers discover pages).

## Solution

Discuss and plan how to surface v1.4 pages on the homepage and other key pages. Options to consider:

- Add a "Browse Leagues" section on the homepage linking to each league detail page
- Add "Top Scorers" / "Top Assists" preview cards on the homepage linking to stat leaderboards
- Add cross-links from league detail pages to their stat leaderboards
- Add links in the league table rows to team detail pages
- Consider a dedicated navigation menu or footer links for all new page types
