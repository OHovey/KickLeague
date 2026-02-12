// Usage: npx tsx scripts/verify-sitemap-migration.ts
//
// Compares the old monolithic sitemap URLs against the new segmented
// sitemaps to confirm zero URL loss during the migration.
//
// Loads .env.local before any app imports (dynamic import pattern)
// to ensure DATABASE_URL is available when db/connection initializes.

import { config } from 'dotenv';

// Load .env.local (Next.js convention) then fall back to .env
// MUST happen before any @/ imports that touch the database
config({ path: '.env.local' });
config();

async function main() {
  // Dynamic imports so that dotenv runs first (before db/connection module init)
  const { isDatabaseConfigured } = await import('@/db/connection');
  const { getAllTeamSlugs, getFinishedMatchIds } = await import(
    '@/lib/seo/sitemap-queries'
  );
  const { sitemapSegments } = await import('@/lib/seo/sitemap-registry');
  const { routing, locales } = await import('@/i18n/routing');

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kickleague.com';

  /**
   * Resolve a localized path for a given route key and locale.
   * Ported from the original monolithic sitemap.ts (same logic as sitemap-xml.ts).
   */
  function getLocalizedPath(
    routeKey: string,
    locale: (typeof locales)[number],
    params?: Record<string, string>,
  ): string {
    const pathConfig =
      routing.pathnames[routeKey as keyof typeof routing.pathnames];
    if (!pathConfig) return routeKey;

    let path: string;
    if (typeof pathConfig === 'string') {
      path = pathConfig;
    } else {
      path = (pathConfig as Record<string, string>)[locale];
    }

    // Replace dynamic segments like [slug] and [id]
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        path = path.replace(`[${key}]`, value);
      }
    }

    return path;
  }

  /**
   * Reconstruct the old monolithic sitemap URL set.
   * Mirrors the deleted src/app/sitemap.ts logic exactly:
   *   - Static pages: / and /matches (x5 locales)
   *   - Team pages: /teams/{slug} (x5 locales)
   *   - Match pages: /matches/{id} (x5 locales)
   */
  async function buildOldSitemapUrls(): Promise<Set<string>> {
    const urls = new Set<string>();

    // Static pages
    const staticPaths: { routeKey: string }[] = [
      { routeKey: '/' },
      { routeKey: '/matches' },
    ];
    for (const { routeKey } of staticPaths) {
      for (const locale of locales) {
        const localizedPath = getLocalizedPath(routeKey, locale);
        urls.add(`${siteUrl}/${locale}${localizedPath}`);
      }
    }

    // Team pages
    const teamSlugs = await getAllTeamSlugs();
    for (const slug of teamSlugs) {
      for (const locale of locales) {
        const localizedPath = getLocalizedPath('/teams/[slug]', locale, {
          slug,
        });
        urls.add(`${siteUrl}/${locale}${localizedPath}`);
      }
    }

    // Match pages
    const matchIds = await getFinishedMatchIds();
    for (const id of matchIds) {
      for (const locale of locales) {
        const localizedPath = getLocalizedPath('/matches/[id]', locale, {
          id: String(id),
        });
        urls.add(`${siteUrl}/${locale}${localizedPath}`);
      }
    }

    return urls;
  }

  /**
   * Collect all URLs from the new segmented sitemaps.
   * For each segment, fetches entries and generates all locale variants.
   */
  async function buildNewSitemapUrls(): Promise<Set<string>> {
    const urls = new Set<string>();

    for (const segment of sitemapSegments) {
      const entries = await segment.fetchEntries();
      for (const entry of entries) {
        for (const locale of locales) {
          const localizedPath = getLocalizedPath(
            entry.routeKey,
            locale,
            entry.params,
          );
          urls.add(`${siteUrl}/${locale}${localizedPath}`);
        }
      }
    }

    return urls;
  }

  // --- Run verification ---

  console.log('Sitemap Migration Verification');
  console.log('==============================\n');

  if (!isDatabaseConfigured()) {
    console.log(
      'WARNING: DATABASE_URL not configured. Cannot verify without data.',
    );
    console.log('Exiting with code 0 (skipped).');
    process.exit(0);
  }

  console.log('Building old monolithic sitemap URLs...');
  const oldUrls = await buildOldSitemapUrls();
  console.log(`  Old sitemap: ${oldUrls.size} URLs\n`);

  console.log('Building new segmented sitemap URLs...');
  const newUrls = await buildNewSitemapUrls();
  console.log(`  New sitemaps: ${newUrls.size} URLs\n`);

  // Compare: find any old URLs missing from new set
  const missing: string[] = [];
  for (const url of oldUrls) {
    if (!newUrls.has(url)) {
      missing.push(url);
    }
  }

  // Summary
  console.log('--- Results ---');
  console.log(`Old URLs:     ${oldUrls.size}`);
  console.log(`New URLs:     ${newUrls.size}`);
  console.log(`Missing URLs: ${missing.length}`);

  if (missing.length > 0) {
    console.log('\nMISSING URLs (present in old, absent in new):');
    for (const url of missing) {
      console.log(`  - ${url}`);
    }
    console.log('\nFAILED: Some URLs were lost during migration.');
    process.exit(1);
  }

  // Check for new URLs not in old (informational only)
  const added: string[] = [];
  for (const url of newUrls) {
    if (!oldUrls.has(url)) {
      added.push(url);
    }
  }
  if (added.length > 0) {
    console.log(
      `\nNote: ${added.length} new URL(s) not in old sitemap (expected if new content added)`,
    );
  }

  console.log(
    '\nPASSED: All old sitemap URLs exist in new segmented sitemaps. Zero URLs lost.',
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
