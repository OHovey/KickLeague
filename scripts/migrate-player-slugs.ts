import { neon } from '@neondatabase/serverless';

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sql = neon(url);

  // Drop the unique index temporarily so we can update all slugs
  console.log('Dropping unique index temporarily...');
  await sql`DROP INDEX IF EXISTS players_slug_idx`;

  // Fix slugs: LOWER first, THEN replace spaces, THEN strip non-alphanumeric
  console.log('Fixing slugs (correct order: lower -> replace spaces -> strip)...');
  await sql`UPDATE players SET slug = REGEXP_REPLACE(REPLACE(LOWER(name), ' ', '-'), '[^a-z0-9\-]', '', 'g')`;

  // Handle duplicates: append api_id for non-unique slugs
  console.log('Handling duplicates...');
  await sql`UPDATE players p SET slug = p.slug || '-' || p.api_id WHERE p.slug IN (SELECT slug FROM players GROUP BY slug HAVING COUNT(*) > 1)`;

  // Verify no remaining duplicates before recreating index
  const dupes = await sql`SELECT slug, COUNT(*) as cnt FROM players GROUP BY slug HAVING COUNT(*) > 1`;
  if (dupes.length > 0) {
    console.error('Still have duplicates:', dupes);
    process.exit(1);
  }

  // Recreate unique index
  console.log('Recreating unique index...');
  await sql`CREATE UNIQUE INDEX players_slug_idx ON players USING btree (slug)`;

  console.log('Done!');

  // Verify
  const sample = await sql`SELECT id, name, slug FROM players ORDER BY id LIMIT 10`;
  console.log('Sample slugs:', sample);

  // Count total
  const count = await sql`SELECT COUNT(*) as cnt FROM players`;
  console.log('Total players:', count[0].cnt);

  // Check for any remaining empty slugs
  const empty = await sql`SELECT COUNT(*) as cnt FROM players WHERE slug = '' OR slug IS NULL`;
  console.log('Empty slugs:', empty[0].cnt);
}

migrate().catch(console.error);
