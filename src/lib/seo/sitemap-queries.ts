import { getDb, isDatabaseConfigured } from '@/db/connection';
import { teams, fixtures } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
