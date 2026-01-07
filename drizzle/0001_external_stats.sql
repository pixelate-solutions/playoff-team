ALTER TABLE nfl_teams ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE games ADD COLUMN IF NOT EXISTS external_game_key text;

CREATE INDEX IF NOT EXISTS games_external_game_key_idx ON games (external_game_key);

DO $$ BEGIN
  ALTER TABLE player_game_stats ADD CONSTRAINT player_game_stats_unique UNIQUE (player_id, game_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
