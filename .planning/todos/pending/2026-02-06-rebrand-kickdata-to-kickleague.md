---
created: 2026-02-06T00:02
title: Rebrand KickLeague to KickLeague
area: general
files:
  - src/app/[locale]/layout.tsx:24
  - src/components/header/Header.tsx:18
  - src/messages/en.json:3
  - src/messages/de.json:3
  - src/messages/es.json:3
  - src/messages/fr.json:3
  - src/messages/it.json:3
  - src/app/[locale]/teams/[slug]/page.tsx:21-24
  - src/app/[locale]/matches/[id]/page.tsx:32-49
  - src/lib/seed/index.ts:59,136
---

## Problem

The site has been renamed from **KickLeague** to **KickLeague**. All user-facing brand references need updating. The name currently appears in:

### Source files (user-facing — must change)
1. `src/app/[locale]/layout.tsx` — metadata `title: 'KickLeague'`
2. `src/components/header/Header.tsx` — rendered brand name in header
3. `src/messages/{en,de,es,fr,it}.json` — `appName` key in all 5 locale files
4. `src/app/[locale]/teams/[slug]/page.tsx` — page title metadata (3 occurrences)
5. `src/app/[locale]/matches/[id]/page.tsx` — page title metadata (5 occurrences)
6. `src/lib/seed/index.ts` — CLI description and console log (2 occurrences)

### Planning docs (optional — cosmetic only)
~22 planning/research files reference "KickLeague" or "KickLeague". These are historical docs and don't affect the running application. Update at discretion.

## Solution

Simple find-and-replace of "KickLeague" → "KickLeague" across the 10 source files listed above. No structural changes needed. The `appName` in message files should cascade to any components using `t('common.appName')`.
