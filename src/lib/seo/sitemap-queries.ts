import { getDb, isDatabaseConfigured } from '@/db/connection';
import { teams, fixtures, leagues } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { SitemapEntry } from './sitemap-registry';

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
