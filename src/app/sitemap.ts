import type { MetadataRoute } from 'next';
import { routing, locales } from '@/i18n/routing';
import { getAllTeamSlugs, getFinishedMatchIds } from '@/lib/seo/sitemap-queries';

const host = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kickleague.com';

/**
 * Resolve a localized path for a given route and locale.
 */
function getLocalizedPath(
  route: keyof typeof routing.pathnames,
  locale: (typeof locales)[number],
  params?: Record<string, string>,
): string {
  const pathConfig = routing.pathnames[route];
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
  return `/${locale}${path}`;
}

function buildEntry(
  route: keyof typeof routing.pathnames,
  params?: Record<string, string>,
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = `${host}${getLocalizedPath(route, locale, params)}`;
  }

  return {
    url: `${host}${getLocalizedPath(route, 'en', params)}`,
    lastModified: new Date(),
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticEntries = [buildEntry('/'), buildEntry('/matches')];

  // Dynamic team pages
  const teamSlugs = await getAllTeamSlugs();
  const teamEntries = teamSlugs.map((slug) =>
    buildEntry('/teams/[slug]', { slug }),
  );

  // Dynamic match pages (finished only -- upcoming have thin content)
  const matchIds = await getFinishedMatchIds();
  const matchEntries = matchIds.map((id) =>
    buildEntry('/matches/[id]', { id: String(id) }),
  );

  return [...staticEntries, ...teamEntries, ...matchEntries];
}
