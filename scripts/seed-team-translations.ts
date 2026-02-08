/**
 * Seed the team_translations table with locale-specific team names.
 *
 * Only creates translation rows where the name actually differs from the
 * English default stored in the teams table. Teams like "Liverpool" that
 * are the same in all locales are skipped entirely.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/seed-team-translations.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { teams } from '../src/db/schema/teams.js';
import { teamTranslations } from '../src/db/schema/translations.js';

// ─── Translation Data ──────────────────────────────────────────────────────
// Key = English name as stored in the teams table.
// Value = map of locale -> translated name (only where it differs from English).

const TRANSLATIONS: Record<string, Partial<Record<string, string>>> = {
  // ── Bundesliga ─────────────────────────────────────────────────────────
  'Bayern Munich': {
    de: 'Bayern München',
    it: 'Bayern Monaco',
    es: 'Bayern Múnich',
    // fr: same as en
  },
  'Borussia Monchengladbach': {
    de: 'Borussia Mönchengladbach',
  },
  'FC Cologne': {
    de: '1. FC Köln',
    fr: 'FC Cologne',
  },
  '1. FC Köln': {
    en: 'FC Cologne', // if stored with umlaut, provide English variant
    fr: 'FC Cologne',
  },

  // ── La Liga ────────────────────────────────────────────────────────────
  'Atletico Madrid': {
    es: 'Atlético de Madrid',
    de: 'Atlético Madrid',
    it: 'Atletico Madrid',
    fr: 'Atlético Madrid',
  },
  'Deportivo Alaves': {
    es: 'Deportivo Alavés',
  },
  'Almeria': {
    es: 'UD Almería',
  },

  // ── Serie A ────────────────────────────────────────────────────────────
  'Inter Milan': {
    it: 'Inter',
    de: 'Inter Mailand',
  },
  'AC Milan': {
    de: 'AC Mailand',
    it: 'Milan',
  },
  'Napoli': {
    it: 'SSC Napoli',
  },
  'AS Roma': {
    it: 'Roma',
  },

  // ── Ligue 1 ────────────────────────────────────────────────────────────
  'Marseille': {
    fr: 'Olympique de Marseille',
    de: 'Olympique Marseille',
    it: 'Olympique Marsiglia',
  },
  'Lyon': {
    fr: 'Olympique Lyonnais',
    de: 'Olympique Lyon',
    it: 'Olympique Lione',
  },
  'Lille': {
    fr: 'LOSC Lille',
  },
  'Rennes': {
    fr: 'Stade Rennais',
  },
  'Strasbourg': {
    fr: 'RC Strasbourg Alsace',
  },
  'Lens': {
    fr: 'RC Lens',
  },
  'Nice': {
    fr: 'OGC Nice',
  },
  'Nantes': {
    fr: 'FC Nantes',
  },
  'Toulouse': {
    fr: 'Toulouse FC',
  },
  'Montpellier': {
    fr: 'Montpellier HSC',
  },
  'Reims': {
    fr: 'Stade de Reims',
  },
  'Brest': {
    fr: 'Stade Brestois 29',
  },

  // ── Premier League ────────────────────────────────────────────────────
  // Most PL team names are the same across locales, but a few have variants
  'Newcastle': {
    de: 'Newcastle United',
    it: 'Newcastle United',
    es: 'Newcastle United',
    fr: 'Newcastle United',
  },
};

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Run with DOTENV_CONFIG_PATH=.env.local');
    process.exit(1);
  }

  const db = drizzle(url);

  // Fetch all teams from the database
  const allTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams);

  const teamsByName = new Map(allTeams.map((t) => [t.name, t.id]));

  console.log(`Found ${allTeams.length} teams in the database.`);

  let inserted = 0;
  let skipped = 0;

  for (const [englishName, localeMap] of Object.entries(TRANSLATIONS)) {
    const teamId = teamsByName.get(englishName);
    if (!teamId) {
      console.log(`  SKIP: "${englishName}" not found in database`);
      skipped++;
      continue;
    }

    for (const [locale, translatedName] of Object.entries(localeMap)) {
      if (!translatedName) continue;
      // Skip if the translated name is the same as the English name
      if (translatedName === englishName) continue;

      await db
        .insert(teamTranslations)
        .values({ teamId, locale, name: translatedName })
        .onConflictDoUpdate({
          target: [teamTranslations.teamId, teamTranslations.locale],
          set: { name: translatedName },
        });

      console.log(`  OK: ${englishName} [${locale}] -> ${translatedName}`);
      inserted++;
    }
  }

  console.log(`\nDone. Inserted/updated: ${inserted}, Skipped (not in DB): ${skipped}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
