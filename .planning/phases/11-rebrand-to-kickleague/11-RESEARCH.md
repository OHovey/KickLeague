# Phase 11: Rebrand to KickLeague - Research

**Researched:** 2026-02-07
**Domain:** Branding, metadata, PWA assets, find-and-replace across codebase
**Confidence:** HIGH

## Summary

This phase is a comprehensive rename-and-rebrand operation. The codebase currently uses "KickData" in 10 source files (TypeScript, JSON) and "FootballPulse" in ~22 planning/research files. No environment variables use brand-name prefixes -- they use generic names like `DATABASE_URL` and `API_FOOTBALL_KEY`. The phase splits into four workstreams: (1) find-and-replace in source code, (2) create SVG wordmark/logo and favicon, (3) create PWA manifest with icon set, and (4) create OG image. A fifth operational workstream covers GitHub repo rename and Neon re-provisioning.

The metadata architecture should be upgraded from a flat `title: 'KickData'` string to a `title.template` pattern (`%s | KickLeague` with default `KickLeague`), which eliminates the need to hardcode the brand name in every page's `generateMetadata` function -- child pages just set `title: 'About'` and get `About | KickLeague` automatically.

**Primary recommendation:** Do the find-and-replace first (it touches the most files), then create brand assets (SVG, favicon, PWA icons, OG image), then handle the infrastructure renames (GitHub, Neon) as documented manual steps.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Sporty italic/slant typography -- dynamic, athletic feel (ESPN/DAZN energy)
- Football icon + text -- minimal outline football icon to the left of the wordmark
- White on dark -- single-color white wordmark designed for dark backgrounds
- Icon style: minimal outline -- simple line-art football, scales well to small sizes
- Personality: Smart sports companion -- knowledgeable but approachable, data-rich but not intimidating
- Tagline: "Football intelligence, visualized"
- Naming: "KickLeague" (one word) in code/logos, "Kick League" (two words) acceptable in prose/descriptions
- No specific brand reference to emulate -- build its own identity
- Favicon: reuse the minimal outline football icon from the wordmark
- Full PWA icon set: 192x192, 512x512, apple-touch-icon -- make the site installable
- Social preview (og:image): create now (not deferred to Phase 14)
- OG image style: dark card with wordmark centered, tagline below, matching site dark theme
- Package name: rename to "kickleague" in package.json
- GitHub repo: rename from KickData to KickLeague
- Database/Neon project: rename to "kickleague" (full consistency, requires re-provisioning)
- Planning docs: find-and-replace in .planning/ files -- full consistency
- Environment variables: rename any containing "KICKDATA" or "FOOTBALLPULSE" to use KICKLEAGUE prefix
- Source code: all strings, comments, config referencing old names updated

### Claude's Discretion
- Exact SVG design and proportions for the wordmark
- Specific icon sizing and padding for PWA icons
- How to handle the Neon re-provisioning (document steps vs automate)
- OG image dimensions and layout details

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js metadata API | 16.x | `title.template`, `manifest.ts`, `opengraph-image.tsx` | Built-in, zero dependencies |
| `next/og` (ImageResponse) | bundled | OG image generation at build time | Official Next.js API, uses Satori under the hood |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | -- | -- | All functionality is built into Next.js |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `next/og` ImageResponse | Static PNG file | Static is simpler but can't embed the wordmark dynamically; ImageResponse keeps the OG image in sync with code changes |
| Hand-crafted SVG | Design tool (Figma export) | Hand-crafted SVG is fine for a simple wordmark; no external tooling needed |

**Installation:**
```bash
# No new packages needed. Everything is built into Next.js 16.
```

## Architecture Patterns

### Recommended Asset Structure
```
src/app/
  manifest.ts                     # PWA web app manifest (NEW)
  opengraph-image.tsx             # OG image generator (NEW)
  favicon.ico                     # REPLACE with new football icon
  icon.svg                        # NEW -- SVG favicon for modern browsers
  apple-icon.png                  # NEW -- 180x180 apple touch icon
public/
  icons/
    icon-192x192.png              # NEW -- PWA icon
    icon-512x512.png              # NEW -- PWA icon
  images/
    wordmark.svg                  # NEW -- KickLeague wordmark (icon + text)
    wordmark-icon-only.svg        # NEW -- Football icon only (for favicon/small contexts)
```

### Pattern 1: Title Template
**What:** Use `title.template` in the locale layout to auto-append ` | KickLeague` to all child page titles.
**When to use:** Every layout that wraps pages with brand-suffixed titles.
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
// src/app/[locale]/layout.tsx
export const metadata: Metadata = {
  title: {
    template: '%s | KickLeague',
    default: 'KickLeague',
  },
  description: 'Football intelligence, visualized',
};
```

Child pages then just set a simple string title:
```typescript
// src/app/[locale]/teams/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const team = await fetchTeamBySlug(slug);
  if (!team) return { title: 'Team Not Found' };
  return { title: team.name };  // Becomes "Arsenal | KickLeague"
}
```

### Pattern 2: Web App Manifest
**What:** A `manifest.ts` file in `src/app/` that exports PWA metadata.
**When to use:** To make the site installable as a PWA.
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
// src/app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KickLeague',
    short_name: 'KickLeague',
    description: 'Football intelligence, visualized',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#0a0a0f',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
```

### Pattern 3: OG Image with ImageResponse
**What:** A `opengraph-image.tsx` file that generates the social preview card at build time.
**When to use:** For the global OG image shown when sharing the site URL.
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
// src/app/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const alt = 'KickLeague - Football intelligence, visualized';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: '#0a0a0f',
        color: 'white',
      }}>
        {/* Wordmark SVG rendered as img or inline */}
        <div style={{ fontSize: 72, fontWeight: 700, fontStyle: 'italic' }}>
          KickLeague
        </div>
        <div style={{ fontSize: 24, marginTop: 16, opacity: 0.7 }}>
          Football intelligence, visualized
        </div>
      </div>
    ),
    { ...size }
  );
}
```

### Anti-Patterns to Avoid
- **Hardcoding brand name in every page's generateMetadata:** Use `title.template` in the layout instead. Child pages just set `title: 'Team Name'` and the suffix is automatic.
- **Storing PWA icons in src/app/:** PWA icons referenced by `manifest.ts` should be in `public/icons/` since the manifest references them by URL path.
- **Using different OG image dimensions:** Stick with 1200x630 -- it is the standard for both Facebook/Open Graph and Twitter/X.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PWA manifest | Manual `<link rel="manifest">` in layout | `src/app/manifest.ts` | Next.js auto-links it to `<head>` |
| OG image | Manual PNG creation + metadata tags | `src/app/opengraph-image.tsx` | Next.js auto-generates the image and injects `<meta>` tags |
| Title suffixes | Manual string concatenation in every page | `title.template: '%s \| KickLeague'` | One line in layout replaces ~8 hardcoded strings |
| Favicon for modern browsers | Only `.ico` file | `src/app/icon.svg` + `src/app/favicon.ico` | SVG favicons are sharper on high-DPI; `.ico` is fallback |

**Key insight:** Next.js metadata file conventions (`manifest.ts`, `opengraph-image.tsx`, `icon.svg`, `apple-icon.png`) auto-inject the correct `<link>` and `<meta>` tags. No manual `<Head>` wiring needed.

## Common Pitfalls

### Pitfall 1: package-lock.json Name Mismatch
**What goes wrong:** After renaming `name` in `package.json`, `package-lock.json` still says `"name": "kickdata"` in two places (top-level and inside `packages.""`).
**Why it happens:** `package-lock.json` caches the package name and `npm install` does not always rewrite it on name changes.
**How to avoid:** After editing `package.json`, run `npm install` (no flags needed) to regenerate the lock file with the updated name.
**Warning signs:** `npm pkg get name` returns old name, or CI errors about mismatched names.

### Pitfall 2: Forgetting the Title Template Default
**What goes wrong:** Pages that don't define their own `title` show a blank or undefined browser tab.
**Why it happens:** `title.template` only applies to child pages that set a `title`. Without `title.default`, pages without explicit metadata get nothing.
**How to avoid:** Always set `title.default` alongside `title.template`.
**Warning signs:** Empty `<title>` tags in HTML output.

### Pitfall 3: ImageResponse CSS Limitations
**What goes wrong:** Complex CSS in `opengraph-image.tsx` renders incorrectly or throws errors.
**Why it happens:** `ImageResponse` uses Satori which only supports flexbox layout and a subset of CSS. No grid, no `position: absolute` relative to non-flex parents, limited font support.
**How to avoid:** Use only `display: 'flex'`, `flexDirection`, `alignItems`, `justifyContent`. Keep the layout simple. Embed fonts via `readFile` if custom fonts are needed.
**Warning signs:** Build errors mentioning Satori, images that look nothing like the JSX.

### Pitfall 4: Neon Re-Provisioning Breaks Existing Data
**What goes wrong:** Creating a new Neon project means a new, empty database. The old data is in the old project.
**Why it happens:** Neon projects have unique endpoints. A new project = new endpoint + new empty database.
**How to avoid:** Document the manual steps clearly: (1) create new Neon project "kickleague", (2) copy old connection string as backup, (3) update `DATABASE_URL` in `.env.local` and Vercel environment variables, (4) re-run seed to populate new database. Alternatively, use `pg_dump`/`pg_restore` to migrate data.
**Warning signs:** App shows empty league tables after deploy.

### Pitfall 5: GitHub Repo Rename and Local Git Remotes
**What goes wrong:** After renaming the repo on GitHub, `git push` on local machines still targets the old URL.
**Why it happens:** GitHub redirects indefinitely, but it is cleaner to update the remote URL.
**How to avoid:** After the GitHub rename, run `git remote set-url origin https://github.com/USER/KickLeague.git` locally. GitHub redirects will work as a fallback.
**Warning signs:** Git operations work (due to redirect) but `git remote -v` shows old name.

### Pitfall 6: SVG Favicon Not Working in Safari
**What goes wrong:** Safari ignores SVG favicons in some configurations.
**Why it happens:** Safari has limited SVG favicon support. It prefers `apple-touch-icon` and `.ico` files.
**How to avoid:** Always provide three favicon assets: `favicon.ico` (legacy), `icon.svg` (modern browsers), and `apple-icon.png` (Safari/iOS). Next.js serves all three when the files exist in `src/app/`.
**Warning signs:** No favicon visible in Safari tabs.

## Code Examples

### Complete Find-and-Replace Map (Source Files Only)

These are the exact 10 source files containing "KickData" that need updating:

```
src/app/[locale]/layout.tsx              -> title: 'KickData' -> title.template pattern
src/app/[locale]/matches/[id]/page.tsx   -> 6 occurrences of '| KickData' in generateMetadata
src/app/[locale]/teams/[slug]/page.tsx   -> 3 occurrences of '| KickData' in generateMetadata
src/components/header/Header.tsx         -> "KickData" text in Link
src/messages/en.json                     -> "appName": "KickData"
src/messages/es.json                     -> "appName": "KickData"
src/messages/fr.json                     -> "appName": "KickData"
src/messages/de.json                     -> "appName": "KickData"
src/messages/it.json                     -> "appName": "KickData"
src/lib/seed/index.ts                    -> 2 occurrences: description + console.log
```

The `package.json` name field: `"name": "kickdata"` -> `"name": "kickleague"`
The `package-lock.json`: regenerated by `npm install` after package.json change.

### Title Template Migration

Before (current -- hardcoded in every page):
```typescript
// src/app/[locale]/layout.tsx
export const metadata = {
  title: 'KickData',
  description: 'Football league standings with rich visual context',
};

// src/app/[locale]/teams/[slug]/page.tsx
if (!team) return { title: 'Team Not Found | KickData' };
return { title: `${team.name} | KickData` };
```

After (title.template):
```typescript
// src/app/[locale]/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | KickLeague',
    default: 'KickLeague',
  },
  description: 'Football intelligence, visualized',
};

// src/app/[locale]/teams/[slug]/page.tsx
if (!team) return { title: 'Team Not Found' };
return { title: team.name };  // Automatically becomes "Arsenal | KickLeague"
```

### Environment Variable Audit

Current environment variables (from `.env.example`, `.env.local`, and source code):
```
DATABASE_URL          -> No brand prefix. No rename needed.
API_FOOTBALL_KEY      -> No brand prefix. No rename needed.
OVERRIDE_COUNTRY      -> No brand prefix. No rename needed.
DEPLOY_URL            -> No brand prefix. No rename needed.
VERCEL_URL            -> Vercel system var. Cannot rename.
QSTASH_TOKEN          -> No brand prefix. No rename needed.
QSTASH_CURRENT_SIGNING_KEY -> No brand prefix. No rename needed.
QSTASH_NEXT_SIGNING_KEY    -> No brand prefix. No rename needed.
THE_ODDS_API_KEY      -> No brand prefix. No rename needed.
```

**Finding: No environment variables contain "KICKDATA" or "FOOTBALLPULSE".** The decision to "rename any containing KICKDATA or FOOTBALLPULSE" is satisfied trivially -- there are none to rename. This is a no-op.

### Header Component Update
```typescript
// src/components/header/Header.tsx -- current
<Link href="/" className="text-lg font-bold text-white transition-colors hover:text-white/90">
  KickData
</Link>

// After: replace text with wordmark SVG or use appName from i18n
<Link href="/" className="text-lg font-bold text-white transition-colors hover:text-white/90">
  KickLeague
</Link>
// Or better: render the SVG wordmark component
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat `title` string | `title.template` + `title.default` | Next.js 13+ (stable) | Eliminates brand name duplication across pages |
| Static favicon.ico only | `icon.svg` + `favicon.ico` + `apple-icon.png` | Next.js 13+ (stable) | Better cross-browser favicon support |
| Manual OG image | `opengraph-image.tsx` with ImageResponse | Next.js 13+ (stable) | Auto-generates and auto-links OG meta tags |
| Manual manifest.json in public/ | `src/app/manifest.ts` | Next.js 13+ (stable) | Type-safe, auto-linked to HTML |

**Deprecated/outdated:**
- Placing `manifest.json` in `public/` with manual `<link>` tag: Use `src/app/manifest.ts` instead.
- Using `next-pwa` package for basic manifest: Not needed; Next.js handles manifest natively.

## Open Questions

1. **Neon Re-Provisioning Strategy**
   - What we know: A new Neon project means a new connection string and empty database. Seed pipeline can repopulate. `pg_dump`/`pg_restore` is an alternative.
   - What's unclear: Whether the user wants to preserve existing data (pg_dump) or is fine re-seeding from scratch. Re-seeding from API-Football requires API quota.
   - Recommendation: Document both options. Default to re-seed since the seed pipeline already exists and is idempotent. Note that this costs API-Football daily quota.

2. **Custom Font for OG Image**
   - What we know: ImageResponse supports custom fonts via `readFile`. The wordmark calls for sporty italic/slant typography.
   - What's unclear: Which specific font to use. Google Fonts has italic/sporty options (e.g., Russo One, Oswald Italic, Bebas Neue). A TTF/OTF file needs to be bundled.
   - Recommendation: Use a bold italic Google Font (e.g., Inter Bold Italic or a sportier alternative). Keep the font file small (<100KB) to stay under ImageResponse's 500KB bundle limit.

3. **SVG Wordmark Rendering in Header**
   - What we know: Header currently renders plain text "KickData". The wordmark is an SVG with icon + text.
   - What's unclear: Whether to inline the SVG as a React component or use an `<img>` tag referencing the public/ file.
   - Recommendation: Inline SVG as a React component for best control over color/sizing. Export from `public/images/wordmark.svg` for use in OG image and other non-React contexts.

## Sources

### Primary (HIGH confidence)
- [Next.js manifest.ts docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest) -- manifest file convention, MetadataRoute.Manifest type
- [Next.js opengraph-image docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) -- ImageResponse API, size/alt/contentType exports, CSS limitations
- [Next.js generateMetadata docs](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) -- title.template, title.default, title.absolute
- [GitHub Docs: Renaming a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository) -- redirect behavior, steps
- Codebase audit (direct grep/read) -- all 10 source files identified, env vars audited

### Secondary (MEDIUM confidence)
- [Neon Docs: Connection strings](https://neon.com/docs/reference/cli-connection-string) -- connection string management
- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps) -- PWA icon conventions

### Tertiary (LOW confidence)
- None -- all findings verified with primary sources or direct codebase inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all APIs verified in official Next.js docs
- Architecture: HIGH -- patterns verified against current codebase + official docs
- Pitfalls: HIGH -- identified from codebase inspection + known Next.js constraints
- Rename scope: HIGH -- exact file list from grep, every occurrence counted

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable domain, no fast-moving APIs)
