DO $$ BEGIN
  CREATE TYPE "season_type" AS ENUM ('regular', 'post');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "games"
  ADD COLUMN IF NOT EXISTS "season_type" "season_type" NOT NULL DEFAULT 'post';

ALTER TABLE "games"
  ADD COLUMN IF NOT EXISTS "week" integer;
