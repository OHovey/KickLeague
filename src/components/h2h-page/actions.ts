'use server';

import { isDatabaseConfigured, getDb } from '@/db/connection';
import { teams } from '@/db/schema';
import {
  getH2HMeetings,
  getH2HAggregateRecord,
  getTeamFormAndPosition,
  type H2HMeeting,
  type H2HAggregateRecord,
  type TeamFormAndPosition,
} from '@/lib/h2h/queries';
import { getLocale } from 'next-intl/server';
import { getLocalizedTeamNames } from '@/lib/teams/translations';

// -- Types -------------------------------------------------------------------

// Note: types are NOT re-exported from 'use server' modules.
// Import them directly from '@/lib/h2h/queries' in consumers.

export interface H2HPageData {
  team1: {
    id: number;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  team2: {
    id: number;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  meetings: H2HMeeting[];
  aggregate: H2HAggregateRecord;
  team1Form: TeamFormAndPosition | null;
  team2Form: TeamFormAndPosition | null;
  leagueSlug: string;
}

// -- Server Action -----------------------------------------------------------

/**
 * Parse a matchup slug like "arsenal-vs-chelsea" into two team slugs.
 * Team slugs can contain hyphens (e.g., "manchester-united"), so we query
 * all team slugs from the DB and find the valid split.
 */
async function parseMatchupSlug(
  matchupSlug: string
): Promise<{ team1Slug: string; team2Slug: string } | null> {
  const db = getDb();
  const allTeams = await db
    .select({ slug: teams.slug })
    .from(teams);
  const slugSet = new Set(allTeams.map((t) => t.slug));

  // Find the position of "-vs-" that yields two valid team slugs
  const separator = '-vs-';
  let searchFrom = 0;

  while (true) {
    const idx = matchupSlug.indexOf(separator, searchFrom);
    if (idx === -1) break;

    const left = matchupSlug.slice(0, idx);
    const right = matchupSlug.slice(idx + separator.length);

    if (slugSet.has(left) && slugSet.has(right)) {
      return { team1Slug: left, team2Slug: right };
    }

    searchFrom = idx + 1;
  }

  return null;
}

/**
 * Fetch all data needed for a head-to-head comparison page.
 * Returns null if database is unavailable, teams not found, or fewer than 3 meetings
 * (thin content guard).
 */
export async function fetchH2HPageData(
  matchupSlug: string
): Promise<H2HPageData | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const parsed = await parseMatchupSlug(matchupSlug);
  if (!parsed) {
    return null;
  }

  const { team1Slug, team2Slug } = parsed;

  // Fetch meetings between the two teams
  const meetings = await getH2HMeetings(team1Slug, team2Slug);

  // Thin content guard: require at least 3 meetings
  if (meetings.length < 3) {
    return null;
  }

  // Determine team1/team2 IDs from meetings
  // team1 = the team whose slug matches team1Slug
  const firstMeeting = meetings[0];
  const team1Id =
    firstMeeting.homeTeamSlug === team1Slug
      ? firstMeeting.homeTeamId
      : firstMeeting.awayTeamId;
  const team2Id =
    firstMeeting.homeTeamSlug === team2Slug
      ? firstMeeting.homeTeamId
      : firstMeeting.awayTeamId;

  // Compute aggregate record
  const aggregate = getH2HAggregateRecord(meetings, team1Id, team2Id);

  // Fetch form and position for both teams in parallel
  const [team1Form, team2Form] = await Promise.all([
    getTeamFormAndPosition(team1Slug),
    getTeamFormAndPosition(team2Slug),
  ]);

  // Build team info from the first meeting
  const team1Info = firstMeeting.homeTeamSlug === team1Slug
    ? {
        id: firstMeeting.homeTeamId,
        name: firstMeeting.homeTeamName,
        slug: firstMeeting.homeTeamSlug,
        logoUrl: firstMeeting.homeTeamLogoUrl,
      }
    : {
        id: firstMeeting.awayTeamId,
        name: firstMeeting.awayTeamName,
        slug: firstMeeting.awayTeamSlug,
        logoUrl: firstMeeting.awayTeamLogoUrl,
      };

  const team2Info = firstMeeting.homeTeamSlug === team2Slug
    ? {
        id: firstMeeting.homeTeamId,
        name: firstMeeting.homeTeamName,
        slug: firstMeeting.homeTeamSlug,
        logoUrl: firstMeeting.homeTeamLogoUrl,
      }
    : {
        id: firstMeeting.awayTeamId,
        name: firstMeeting.awayTeamName,
        slug: firstMeeting.awayTeamSlug,
        logoUrl: firstMeeting.awayTeamLogoUrl,
      };

  // Determine league slug from form data or first meeting
  const leagueSlug = team1Form?.leagueSlug ?? team2Form?.leagueSlug ?? 'premier-league';

  // Localize team names
  const locale = await getLocale();
  if (locale !== 'en') {
    const teamIds = [team1Info.id, team2Info.id];
    const englishNames = new Map<number, string>();
    englishNames.set(team1Info.id, team1Info.name);
    englishNames.set(team2Info.id, team2Info.name);

    const localizedNames = await getLocalizedTeamNames(
      teamIds,
      locale,
      englishNames
    );

    team1Info.name = localizedNames.get(team1Info.id) ?? team1Info.name;
    team2Info.name = localizedNames.get(team2Info.id) ?? team2Info.name;

    // Also localize team names in meetings
    for (const m of meetings) {
      if (m.homeTeamId === team1Info.id) {
        m.homeTeamName = team1Info.name;
        m.awayTeamName = team2Info.name;
      } else {
        m.homeTeamName = team2Info.name;
        m.awayTeamName = team1Info.name;
      }
    }

    // Localize form team names
    if (team1Form) {
      team1Form.teamName = team1Info.name;
    }
    if (team2Form) {
      team2Form.teamName = team2Info.name;
    }
  }

  return {
    team1: team1Info,
    team2: team2Info,
    meetings,
    aggregate,
    team1Form,
    team2Form,
    leagueSlug,
  };
}
