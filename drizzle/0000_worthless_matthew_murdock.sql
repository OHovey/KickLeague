CREATE TYPE "public"."event_type" AS ENUM('goal', 'own_goal', 'penalty_scored', 'penalty_missed', 'yellow_card', 'red_card', 'substitution', 'var');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'finished', 'postponed', 'cancelled', 'first_half', 'halftime', 'second_half', 'extra_time', 'penalties');--> statement-breakpoint
CREATE TYPE "public"."tiebreaker_method" AS ENUM('goal_difference', 'goals_for', 'head_to_head', 'away_goals');--> statement-breakpoint
CREATE TYPE "public"."zone_type" AS ENUM('champions_league', 'champions_league_qualifying', 'europa_league', 'conference_league', 'relegation_playoff', 'relegation');--> statement-breakpoint
CREATE TABLE "league_config" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "league_config_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"league_id" integer NOT NULL,
	"season" varchar(10) NOT NULL,
	"team_count" integer NOT NULL,
	"tiebreaker_order" varchar(255) NOT NULL,
	"matchweeks_total" integer NOT NULL,
	"has_xg" boolean DEFAULT false NOT NULL,
	"has_detailed_stats" boolean DEFAULT true NOT NULL,
	"has_player_stats" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league_zones" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "league_zones_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"league_id" integer NOT NULL,
	"season" varchar(10) NOT NULL,
	"zone_type" "zone_type" NOT NULL,
	"start_position" integer NOT NULL,
	"end_position" integer NOT NULL,
	"color" varchar(7) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "leagues_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"api_id" integer NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"country" varchar(50) NOT NULL,
	"logo_url" varchar(500),
	"current_season" varchar(10) NOT NULL,
	CONSTRAINT "leagues_api_id_unique" UNIQUE("api_id"),
	CONSTRAINT "leagues_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "teams_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"api_id" integer NOT NULL,
	"league_id" integer NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"short_name" varchar(50),
	"abbreviation" varchar(3),
	"logo_url" varchar(500),
	"stadium_name" varchar(200),
	"founded" integer,
	"country" varchar(50),
	CONSTRAINT "teams_api_id_unique" UNIQUE("api_id"),
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "players_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"api_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"first_name" varchar(50),
	"last_name" varchar(50),
	"position" varchar(10),
	"number" integer,
	"nationality" varchar(50),
	"photo_url" varchar(500),
	"age" integer,
	"height" varchar(10),
	"weight" varchar(10),
	CONSTRAINT "players_api_id_unique" UNIQUE("api_id")
);
--> statement-breakpoint
CREATE TABLE "fixture_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fixture_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"fixture_id" integer NOT NULL,
	"type" "event_type" NOT NULL,
	"minute" integer NOT NULL,
	"extra_minute" integer,
	"team_id" integer NOT NULL,
	"player_id" integer,
	"assist_player_id" integer,
	"detail" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "fixture_stats" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fixture_stats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"fixture_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"possession" real,
	"shots" integer,
	"shots_on_target" integer,
	"corners" integer,
	"fouls" integer,
	"offsides" integer,
	"yellow_cards" integer,
	"red_cards" integer,
	"xg" real
);
--> statement-breakpoint
CREATE TABLE "fixtures" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fixtures_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"api_id" integer NOT NULL,
	"league_id" integer NOT NULL,
	"season" varchar(10) NOT NULL,
	"matchweek" integer,
	"home_team_id" integer NOT NULL,
	"away_team_id" integer NOT NULL,
	"kickoff" timestamp with time zone NOT NULL,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"referee" varchar(100),
	"venue" varchar(200),
	CONSTRAINT "fixtures_api_id_unique" UNIQUE("api_id")
);
--> statement-breakpoint
CREATE TABLE "standings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "standings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"league_id" integer NOT NULL,
	"season" varchar(10) NOT NULL,
	"matchweek" integer NOT NULL,
	"team_id" integer NOT NULL,
	"position" integer NOT NULL,
	"played" integer NOT NULL,
	"won" integer NOT NULL,
	"drawn" integer NOT NULL,
	"lost" integer NOT NULL,
	"goals_for" integer NOT NULL,
	"goals_against" integer NOT NULL,
	"goal_difference" integer NOT NULL,
	"points" integer NOT NULL,
	"form" varchar(10),
	"home_won" integer NOT NULL,
	"home_drawn" integer NOT NULL,
	"home_lost" integer NOT NULL,
	"home_goals_for" integer NOT NULL,
	"home_goals_against" integer NOT NULL,
	"away_won" integer NOT NULL,
	"away_drawn" integer NOT NULL,
	"away_lost" integer NOT NULL,
	"away_goals_for" integer NOT NULL,
	"away_goals_against" integer NOT NULL,
	"points_deduction" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "league_config" ADD CONSTRAINT "league_config_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_zones" ADD CONSTRAINT "league_zones_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_events" ADD CONSTRAINT "fixture_events_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_events" ADD CONSTRAINT "fixture_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_events" ADD CONSTRAINT "fixture_events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_events" ADD CONSTRAINT "fixture_events_assist_player_id_players_id_fk" FOREIGN KEY ("assist_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_stats" ADD CONSTRAINT "fixture_stats_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_stats" ADD CONSTRAINT "fixture_stats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings" ADD CONSTRAINT "standings_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings" ADD CONSTRAINT "standings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "league_config_unique" ON "league_config" USING btree ("league_id","season");--> statement-breakpoint
CREATE INDEX "league_zones_lookup" ON "league_zones" USING btree ("league_id","season");--> statement-breakpoint
CREATE INDEX "teams_league_idx" ON "teams" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "players_team_idx" ON "players" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "fixture_events_fixture" ON "fixture_events" USING btree ("fixture_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fixture_stats_unique" ON "fixture_stats" USING btree ("fixture_id","team_id");--> statement-breakpoint
CREATE INDEX "fixtures_league_season" ON "fixtures" USING btree ("league_id","season");--> statement-breakpoint
CREATE INDEX "fixtures_kickoff" ON "fixtures" USING btree ("kickoff");--> statement-breakpoint
CREATE INDEX "fixtures_status" ON "fixtures" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fixtures_home_team" ON "fixtures" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "fixtures_away_team" ON "fixtures" USING btree ("away_team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "standings_unique" ON "standings" USING btree ("league_id","season","matchweek","team_id");--> statement-breakpoint
CREATE INDEX "standings_league_season_week" ON "standings" USING btree ("league_id","season","matchweek");