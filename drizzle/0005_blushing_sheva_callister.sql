-- Add slug column (initially nullable for backfill)
ALTER TABLE "players" ADD COLUMN "slug" varchar(150);--> statement-breakpoint

-- Backfill slugs from player name: lowercase first, then spaces to hyphens, then strip non-alphanumeric
UPDATE "players" SET "slug" = REGEXP_REPLACE(REPLACE(LOWER("name"), ' ', '-'), '[^a-z0-9\-]', '', 'g');--> statement-breakpoint

-- Handle duplicates: append api_id for non-unique slugs
UPDATE "players" p SET "slug" = p."slug" || '-' || p."api_id"
WHERE p."slug" IN (SELECT "slug" FROM "players" GROUP BY "slug" HAVING COUNT(*) > 1);--> statement-breakpoint

-- Now enforce NOT NULL
ALTER TABLE "players" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint

-- Add unique index
CREATE UNIQUE INDEX "players_slug_idx" ON "players" USING btree ("slug");
