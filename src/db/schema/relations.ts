import { relations } from 'drizzle-orm';
import { leagues, leagueConfig, leagueZones } from './leagues';
import { teams } from './teams';
import { players } from './players';
import { fixtures, fixtureEvents, fixtureStats } from './fixtures';
import { standings } from './standings';

// -- League relations --

export const leaguesRelations = relations(leagues, ({ many }) => ({
  config: many(leagueConfig),
  zones: many(leagueZones),
  teams: many(teams),
  fixtures: many(fixtures),
  standings: many(standings),
}));

export const leagueConfigRelations = relations(leagueConfig, ({ one }) => ({
  league: one(leagues, {
    fields: [leagueConfig.leagueId],
    references: [leagues.id],
  }),
}));

export const leagueZonesRelations = relations(leagueZones, ({ one }) => ({
  league: one(leagues, {
    fields: [leagueZones.leagueId],
    references: [leagues.id],
  }),
}));

// -- Team relations --

export const teamsRelations = relations(teams, ({ one, many }) => ({
  league: one(leagues, {
    fields: [teams.leagueId],
    references: [leagues.id],
  }),
  players: many(players),
  homeFixtures: many(fixtures, { relationName: 'homeTeam' }),
  awayFixtures: many(fixtures, { relationName: 'awayTeam' }),
  standings: many(standings),
}));

// -- Player relations --

export const playersRelations = relations(players, ({ one }) => ({
  team: one(teams, {
    fields: [players.teamId],
    references: [teams.id],
  }),
}));

// -- Fixture relations --

export const fixturesRelations = relations(fixtures, ({ one, many }) => ({
  league: one(leagues, {
    fields: [fixtures.leagueId],
    references: [leagues.id],
  }),
  homeTeam: one(teams, {
    fields: [fixtures.homeTeamId],
    references: [teams.id],
    relationName: 'homeTeam',
  }),
  awayTeam: one(teams, {
    fields: [fixtures.awayTeamId],
    references: [teams.id],
    relationName: 'awayTeam',
  }),
  events: many(fixtureEvents),
  stats: many(fixtureStats),
}));

export const fixtureEventsRelations = relations(
  fixtureEvents,
  ({ one }) => ({
    fixture: one(fixtures, {
      fields: [fixtureEvents.fixtureId],
      references: [fixtures.id],
    }),
    team: one(teams, {
      fields: [fixtureEvents.teamId],
      references: [teams.id],
    }),
    player: one(players, {
      fields: [fixtureEvents.playerId],
      references: [players.id],
      relationName: 'eventPlayer',
    }),
    assistPlayer: one(players, {
      fields: [fixtureEvents.assistPlayerId],
      references: [players.id],
      relationName: 'eventAssistPlayer',
    }),
  })
);

export const fixtureStatsRelations = relations(fixtureStats, ({ one }) => ({
  fixture: one(fixtures, {
    fields: [fixtureStats.fixtureId],
    references: [fixtures.id],
  }),
  team: one(teams, {
    fields: [fixtureStats.teamId],
    references: [teams.id],
  }),
}));

// -- Standings relations --

export const standingsRelations = relations(standings, ({ one }) => ({
  league: one(leagues, {
    fields: [standings.leagueId],
    references: [leagues.id],
  }),
  team: one(teams, {
    fields: [standings.teamId],
    references: [teams.id],
  }),
}));
