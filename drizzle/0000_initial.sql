-- drizzle/0000_initial.sql

-- Neon already has pgcrypto / gen_random_uuid() available, so we skip CREATE EXTENSION here.

CREATE TYPE conference AS ENUM ('AFC', 'NFC');
CREATE TYPE player_position AS ENUM ('QB', 'RB', 'WR', 'TE', 'K', 'DST');
CREATE TYPE entry_slot AS ENUM ('QB1', 'QB2', 'QB3', 'QB4', 'RB1', 'RB2', 'RB3', 'WR1', 'WR2', 'WR3', 'FLEX', 'TE', 'K', 'DST');
CREATE TYPE playoff_round AS ENUM ('Wildcard', 'Divisional', 'Conference', 'SuperBowl');

CREATE TABLE nfl_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  abbreviation text NOT NULL UNIQUE,
  conference conference NOT NULL,
  seed integer,
  made_playoffs boolean NOT NULL DEFAULT false,
  eliminated_round text,
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position player_position NOT NULL,
  nfl_team_id uuid NOT NULL REFERENCES nfl_teams(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  playoff_override_points numeric(10, 2),
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  participant_name text NOT NULL,
  email text NOT NULL UNIQUE,
  paid boolean NOT NULL DEFAULT false,
  total_points_cached numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE entry_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  slot entry_slot NOT NULL,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round playoff_round NOT NULL,
  home_team_id uuid NOT NULL REFERENCES nfl_teams(id) ON DELETE CASCADE,
  away_team_id uuid NOT NULL REFERENCES nfl_teams(id) ON DELETE CASCADE,
  kickoff_at timestamptz NOT NULL,
  external_game_key text,
  final boolean NOT NULL DEFAULT false,
  home_score integer,
  away_score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE player_game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  passing_yards integer NOT NULL DEFAULT 0,
  passing_tds integer NOT NULL DEFAULT 0,
  passing_two_pt integer NOT NULL DEFAULT 0,
  rushing_yards integer NOT NULL DEFAULT 0,
  rushing_tds integer NOT NULL DEFAULT 0,
  rushing_two_pt integer NOT NULL DEFAULT 0,
  receiving_yards integer NOT NULL DEFAULT 0,
  receiving_tds integer NOT NULL DEFAULT 0,
  receiving_two_pt integer NOT NULL DEFAULT 0,
  receptions integer NOT NULL DEFAULT 0,
  fg_made_0_39 integer NOT NULL DEFAULT 0,
  fg_made_40_49 integer NOT NULL DEFAULT 0,
  fg_made_50_59 integer NOT NULL DEFAULT 0,
  fg_made_60_plus integer NOT NULL DEFAULT 0,
  xp_made integer NOT NULL DEFAULT 0,
  def_int integer NOT NULL DEFAULT 0,
  sacks integer NOT NULL DEFAULT 0,
  safeties integer NOT NULL DEFAULT 0,
  def_fumble_recoveries integer NOT NULL DEFAULT 0,
  def_st_tds integer NOT NULL DEFAULT 0,
  fum2pk integer NOT NULL DEFAULT 0,
  fum2pt integer NOT NULL DEFAULT 0,
  int2pk integer NOT NULL DEFAULT 0,
  int2pt integer NOT NULL DEFAULT 0,
  manual_override_points numeric(10, 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_game_stats_unique UNIQUE (player_id, game_id)
);

CREATE TABLE admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
