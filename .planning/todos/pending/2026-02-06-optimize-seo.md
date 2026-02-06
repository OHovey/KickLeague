---
created: 2026-02-06T00:04
title: Optimize SEO for the site
area: general
files:
  - src/app/[locale]/layout.tsx:23-25
  - src/app/[locale]/teams/[slug]/page.tsx:12
  - src/app/[locale]/matches/[id]/page.tsx:25
  - src/app/[locale]/page.tsx
  - src/app/[locale]/matches/page.tsx
---

## Problem

The site has minimal SEO setup. Currently:

### What exists
- Basic `metadata` in locale layout (title + description only)
- `generateMetadata` on team detail and match detail pages (dynamic titles)

### What's missing
1. **No `sitemap.xml`** — search engines can't discover all league/team/match pages
2. **No `robots.txt`** — no crawl directives
3. **No OpenGraph / Twitter meta tags** — links shared on social media show no preview image, title, or description
4. **No structured data (JSON-LD)** — no SportsEvent, SportsTeam, or BreadcrumbList schema markup for rich results
5. **No canonical URLs** — multi-locale pages may cause duplicate content issues
6. **No per-page descriptions** — homepage and matches list page have no `generateMetadata`
7. **No alternate hreflang tags** — 5 locales exist but search engines don't know about them
8. **Static metadata on layout** — should use template pattern for consistent `title` suffix

### Why it matters
As discussed earlier in this session, the #1 bottleneck for affiliate revenue is traffic, and organic search is the primary free traffic channel. Without proper SEO infrastructure, Google can't effectively index or rank the site.

## Solution

Key items (roughly priority-ordered):

1. `sitemap.xml` — dynamic Next.js sitemap listing all leagues, teams, matches per locale
2. `robots.txt` — allow all crawlers, point to sitemap
3. OpenGraph + Twitter Card meta on all pages (use `generateMetadata` with `openGraph` field)
4. JSON-LD structured data — `SportsEvent` for matches, `SportsTeam` for teams, `BreadcrumbList` for navigation
5. Canonical URLs + `alternates.languages` for hreflang across 5 locales
6. Metadata `title.template` pattern in layout (e.g., `%s | KickLeague`)
7. `generateMetadata` for homepage and matches list page
