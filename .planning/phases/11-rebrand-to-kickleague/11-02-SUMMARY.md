---
phase: 11
plan: 02
subsystem: branding
tags: [svg, favicon, pwa, icons, sharp]
dependency-graph:
  requires: []
  provides: [wordmark-svg, icon-only-svg, favicon-set, pwa-icons]
  affects: [11-03]
tech-stack:
  added: []
  patterns: [svg-icon-design, sharp-icon-generation, ico-format]
key-files:
  created:
    - public/images/wordmark.svg
    - public/images/wordmark-icon-only.svg
    - src/app/icon.svg
    - src/app/favicon.ico
    - src/app/apple-icon.png
    - public/icons/icon-192x192.png
    - public/icons/icon-512x512.png
    - scripts/generate-icons.ts
  modified: []
decisions:
  - id: d-1102-01
    decision: "Football icon uses pentagon-with-seams pattern (circle + pentagon + 5 radial lines)"
    rationale: "Classic football panel shape is universally recognizable at all sizes"
  - id: d-1102-02
    decision: "Icon generation via sharp script rather than manual PNG creation"
    rationale: "Reproducible; can regenerate all icons from single SVG source if design changes"
  - id: d-1102-03
    decision: "ICO file wraps 32x32 PNG in ICO container (PNG-in-ICO format)"
    rationale: "Modern browsers support PNG-in-ICO; simpler than BMP-format ICO"
metrics:
  duration: "~2 min"
  completed: "2026-02-07"
---

# Phase 11 Plan 02: Brand Visual Assets Summary

**SVG wordmark with sporty italic typography, football icon, and full favicon/PWA icon set generated via sharp**

## What Was Done

### Task 1: SVG Wordmark and Icon-Only Variant
Created two SVG files for the KickLeague visual identity:

- **wordmark.svg** (320x56 viewBox): Football outline icon to the left of "KickLeague" text in bold italic with `skewX(-4)` transform for sporty energy. Uses `currentColor` for flexible color inheritance.
- **wordmark-icon-only.svg** (48x48 viewBox): Standalone football icon -- circle with pentagon panel and 5 radial seam lines. Also uses `currentColor`.

### Task 2: Favicon and PWA Icon Set
Created a generation script (`scripts/generate-icons.ts`) using sharp to rasterize from SVG:

- **src/app/icon.svg**: White-on-transparent football for modern browser tabs
- **src/app/favicon.ico**: 32x32 ICO (PNG-in-ICO format) for legacy browsers
- **src/app/apple-icon.png**: 180x180 PNG, dark background (#0a0a0f), white football
- **public/icons/icon-192x192.png**: PWA icon at 192x192
- **public/icons/icon-512x512.png**: PWA icon at 512x512

All rasterized icons use dark background (#0a0a0f) with rounded corners (rx=80 at 512px) and white football centered with padding.

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | SVG wordmark and icon-only | cc29e10 | public/images/wordmark.svg, public/images/wordmark-icon-only.svg |
| 2 | Favicon and PWA icon set | a19c0b0 | src/app/icon.svg, src/app/favicon.ico, src/app/apple-icon.png, public/icons/*.png, scripts/generate-icons.ts |

## Decisions Made

1. **Football icon pattern**: Pentagon-with-seams (circle + inner pentagon + 5 radial lines from vertices to edge). This is the classic football panel shape, universally recognizable even at 16x16.

2. **Sharp-based generation script**: Rather than manually creating PNG/ICO files, a reproducible `scripts/generate-icons.ts` reads SVG source and generates all variants. Re-run after any icon redesign.

3. **PNG-in-ICO format**: The favicon.ico wraps a 32x32 PNG inside an ICO container header. All modern browsers support this format, and it avoids the complexity of BMP-format ICO encoding.

4. **Dark background with rounded corners**: Rasterized icons use `#0a0a0f` background with `rx=80` (at 512 scale) for rounded app-icon appearance on home screens.

## Deviations from Plan

None -- plan executed exactly as written.

## Next Phase Readiness

Plan 03 (Manifest, OG Image, Header) depends on these assets:
- `public/images/wordmark.svg` -- will be used in Header component
- `public/icons/*.png` -- referenced by `manifest.ts`
- Football icon design -- OG image will use similar styling

All assets are in place and ready for Plan 03 consumption.

## Self-Check: PASSED
