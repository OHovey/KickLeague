import { getDb, isDatabaseConfigured } from '@/db/connection';
import { teams, fixtures } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { SitemapEntry } from './sitemap-registry';

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
