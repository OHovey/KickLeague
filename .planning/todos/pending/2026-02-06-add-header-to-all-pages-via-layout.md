---
created: 2026-02-06T00:00
title: Add Header to all pages via layout
area: ui
files:
  - src/app/[locale]/layout.tsx
  - src/components/header/Header.tsx
  - src/app/[locale]/page.tsx
  - src/app/[locale]/matches/page.tsx
  - src/app/[locale]/matches/[id]/page.tsx
  - src/app/[locale]/teams/[slug]/page.tsx
---

## Problem

The homepage Header component (`src/components/header/Header.tsx`) is imported individually in some page files rather than being placed in the shared locale layout (`src/app/[locale]/layout.tsx`). This means:

1. Not every page necessarily includes the Header
2. Each page has to import and render it separately — duplication
3. Adding new pages risks forgetting the Header

The Header should be rendered once in `layout.tsx` so it automatically appears on every page under `[locale]/`.

## Solution

Move the `<Header />` import into `src/app/[locale]/layout.tsx`, render it above `{children}`, and remove individual Header imports from each page file. May need to check if the Header needs locale prop or uses `useLocale()` internally.
