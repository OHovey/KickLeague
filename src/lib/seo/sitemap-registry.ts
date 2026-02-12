import { getTeamSitemapEntries, getMatchSitemapEntries, getLeagueSitemapEntries, getStatsSitemapEntries } from './sitemap-queries';

export interface SitemapEntry {
  /** Canonical path WITHOUT locale prefix (e.g., '/teams/arsenal') */
  path: string;
  /** Route key from routing.pathnames for localized path resolution */
  routeKey: string;
  /** Dynamic segment params (e.g., { slug: 'arsenal' }) */
  params?: Record<string, string>;
  /** Last modified date */
  lastmod: Date;
}

export interface SitemapSegment {
  /** Segment name -- becomes the filename (e.g., 'teams' -> /sitemaps/teams.xml) */
  name: string;
  /** Fetch all entries for this segment. Returns array of SitemapEntry. */
  fetchEntries: () => Promise<SitemapEntry[]>;
  /** Default changefreq for entries in this segment */
  changefreq?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
}

/** Maximum URLs per individual sitemap file (sitemap spec limit) */
export const MAX_URLS_PER_SITEMAP = 50_000;

/**
 * Central sitemap segment registry.
 * To add a new page type, push a new SitemapSegment to this array.
 */
export const sitemapSegments: SitemapSegment[] = [
  {
    name: 'static',
    changefreq: 'daily',
    fetchEntries: async () => [
      { path: '/', routeKey: '/', lastmod: new Date() },
      { path: '/matches', routeKey: '/matches', lastmod: new Date() },
    ],
  },
  {
    name: 'teams',
    changefreq: 'daily',
    fetchEntries: getTeamSitemapEntries,
  },
  {
    name: 'matches',
    changefreq: 'weekly',
    fetchEntries: getMatchSitemapEntries,
  },
  {
    name: 'leagues',
    changefreq: 'daily',
    fetchEntries: getLeagueSitemapEntries,
  },
  {
    name: 'stats',
    changefreq: 'daily',
    fetchEntries: getStatsSitemapEntries,
  },
];
