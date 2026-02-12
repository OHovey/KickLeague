import { getDb, isDatabaseConfigured } from '@/db/connection';
import { teams, fixtures, leagues } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { SitemapEntry } from './sitemap-registry';
import { getQualifyingPlayerSlugs } from '@/lib/players/queries';
import { getQualifyingH2HPairs } from '@/lib/h2h/queries';

const STAT_TYPES = ['top-scorers', 'top-assists', 'disciplinary'] as const;

export async function getAllTeamSlugs(): Promise<string[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await getDb()
    .select({ slug: teams.slug })
    .from(teams);
  return rows.map((r) => r.slug);
}

export async function getFinishedMatchIds(): Promise<number[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await getDb()
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(eq(fixtures.status, 'finished'));
  return rows.map((r) => r.id);
}

/**
 * Fetch all teams as SitemapEntry objects.
 * No updatedAt column exists, so lastmod defaults to now.
 */
export async function getTeamSitemapEntries(): Promise<SitemapEntry[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await getDb()
    .select({ slug: teams.slug })
    .from(teams);
  const now = new Date();
  return rows.map((r) => ({
    path: `/teams/${r.slug}`,
    routeKey: '/teams/[slug]',
    params: { slug: r.slug },
    lastmod: now,
  }));
}

/**
 * Fetch all finished matches as SitemapEntry objects.
 * Uses kickoff date as lastmod (no updatedAt column).
 */
export async function getMatchSitemapEntries(): Promise<SitemapEntry[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await getDb()
    .select({ id: fixtures.id, kickoff: fixtures.kickoff })
    .from(fixtures)
    .where(eq(fixtures.status, 'finished'));
  return rows.map((r) => ({
    path: `/matches/${r.id}`,
    routeKey: '/matches/[id]',
    params: { id: String(r.id) },
    lastmod: r.kickoff,
  }));
}

/**
 * Fetch all leagues as SitemapEntry objects.
 * No updatedAt column exists, so lastmod defaults to now.
 */
export async function getLeagueSitemapEntries(): Promise<SitemapEntry[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await getDb()
    .select({ slug: leagues.slug })
    .from(leagues);
  const now = new Date();
  return rows.map((r) => ({
    path: `/leagues/${r.slug}`,
    routeKey: '/leagues/[slug]',
    params: { slug: r.slug },
    lastmod: now,
  }));
}

/**
 * Enumerate all stat leaderboard pages as SitemapEntry objects.
 * Static combinations of leagues x stat types (no complex DB query needed).
 */
export async function getStatsSitemapEntries(): Promise<SitemapEntry[]> {
  if (!isDatabaseConfigured()) return [];
  const leagueRows = await getDb()
    .select({ slug: leagues.slug })
    .from(leagues);

  const now = new Date();
  const entries: SitemapEntry[] = [];

  for (const league of leagueRows) {
    for (const stat of STAT_TYPES) {
      entries.push({
        path: `/leagues/${league.slug}/stats/${stat}`,
        routeKey: '/leagues/[slug]/stats/[stat]',
        params: { slug: league.slug, stat },
        lastmod: now,
      });
    }
  }

  return entries;
}

/**
 * Fetch qualifying player slugs (5+ appearances) as SitemapEntry objects.
 * Reuses getQualifyingPlayerSlugs from player queries.
 * No updatedAt column exists, so lastmod defaults to now.
 */
export async function getPlayerSitemapEntries(): Promise<SitemapEntry[]> {
  if (!isDatabaseConfigured()) return [];
  const slugs = await getQualifyingPlayerSlugs();
  const now = new Date();
  return slugs.map((slug) => ({
    path: `/players/${slug}`,
    routeKey: '/players/[slug]',
    params: { slug },
    lastmod: now,
  }));
}

/**
 * Fetch qualifying H2H pairs (3+ meetings) as SitemapEntry objects.
 * Uses canonical slug ordering (alphabetical) for consistent URLs.
 * No updatedAt column exists, so lastmod defaults to now.
 */
export async function getH2HSitemapEntries(): Promise<SitemapEntry[]> {
  if (!isDatabaseConfigured()) return [];
  const pairs = await getQualifyingH2HPairs();
  const now = new Date();
  return pairs.map((pair) => {
    const matchup = `${pair.team1Slug}-vs-${pair.team2Slug}`;
    return {
      path: `/h2h/${matchup}`,
      routeKey: '/h2h/[matchup]',
      params: { matchup },
      lastmod: now,
    };
  });
}
