import { routing, locales, defaultLocale } from '@/i18n/routing';
import type { SitemapEntry } from './sitemap-registry';
import { MAX_URLS_PER_SITEMAP } from './sitemap-registry';

/**
 * Resolve a localized path for a given route key and locale.
 * Ported from the original monolithic sitemap.ts.
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
 * Build sitemap-index XML listing all segment sitemaps.
 * Handles pagination for segments exceeding MAX_URLS_PER_SITEMAP.
 */
export function buildSitemapIndexXml(
  segments: { name: string; count: number }[],
  siteUrl: string,
): string {
  const now = new Date().toISOString();
  const entries = segments
    .filter((s) => s.count > 0)
    .flatMap((s) => {
      if (s.count <= MAX_URLS_PER_SITEMAP) {
        return [
          `  <sitemap>\n    <loc>${siteUrl}/sitemaps/${s.name}.xml</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`,
        ];
      }
      // Paginate
      const pages = Math.ceil(s.count / MAX_URLS_PER_SITEMAP);
      return Array.from({ length: pages }, (_, i) => {
        const pageNum = i + 1;
        return `  <sitemap>\n    <loc>${siteUrl}/sitemaps/${s.name}-${pageNum}.xml</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`;
      });
    });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</sitemapindex>',
  ].join('\n');
}

/**
 * Build a single sitemap XML with xhtml:link alternates for all locales.
 */
export function buildSitemapXml(
  entries: SitemapEntry[],
  siteUrl: string,
  changefreq?: string,
): string {
  const urlBlocks = entries.map((entry) => {
    const canonicalPath = getLocalizedPath(
      entry.routeKey,
      defaultLocale,
      entry.params,
    );
    const loc = `${siteUrl}/${defaultLocale}${canonicalPath}`;
    const lastmod = entry.lastmod.toISOString();

    const alternateLinks = locales
      .map((locale) => {
        const localizedPath = getLocalizedPath(
          entry.routeKey,
          locale,
          entry.params,
        );
        return `    <xhtml:link rel="alternate" hreflang="${locale}" href="${siteUrl}/${locale}${localizedPath}" />`;
      })
      .join('\n');

    const changefreqTag = changefreq
      ? `\n    <changefreq>${changefreq}</changefreq>`
      : '';

    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmod}</lastmod>${changefreqTag}`,
      alternateLinks,
      '  </url>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urlBlocks,
    '</urlset>',
  ].join('\n');
}
