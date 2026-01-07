import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const conferenceEnum = pgEnum("conference", ["AFC", "NFC"]);
export const playerPositionEnum = pgEnum("player_position", ["QB", "RB", "WR", "TE", "K", "DST"]);
export const entrySlotEnum = pgEnum("entry_slot", [
  "QB1",
  "QB2",
  "QB3",
  "QB4",
  "RB1",
  "RB2",
  "RB3",
  "WR1",
  "WR2",
  "WR3",
  "FLEX",
  "TE",
  "K",
  "DST",
]);
export const roundEnum = pgEnum("playoff_round", ["Wildcard", "Divisional", "Conference", "SuperBowl"]);
export const seasonTypeEnum = pgEnum("season_type", ["regular", "post"]);

export const nflTeams = pgTable("nfl_teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  abbreviation: text("abbreviation").notNull().unique(),
  conference: conferenceEnum("conference").notNull(),
  seed: integer("seed"),
  madePlayoffs: boolean("made_playoffs").notNull().default(false),
  eliminatedRound: text("eliminated_round"),
  externalId: text("external_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  position: playerPositionEnum("position").notNull(),
  nflTeamId: uuid("nfl_team_id")
    .references(() => nflTeams.id, { onDelete: "cascade" })
    .notNull(),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  playoffOverridePoints: numeric("playoff_override_points", { precision: 10, scale: 2 }),
  externalId: text("external_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamName: text("team_name").notNull(),
  participantName: text("participant_name").notNull(),
  email: text("email").notNull().unique(),
  paid: boolean("paid").notNull().default(false),
  totalPointsCached: numeric("total_points_cached", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const entryPlayers = pgTable("entry_players", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id")
    .references(() => entries.id, { onDelete: "cascade" })
    .notNull(),
  playerId: uuid("player_id")
    .references(() => players.id, { onDelete: "cascade" })
    .notNull(),
  slot: entrySlotEnum("slot").notNull(),
  locked: boolean("locked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  round: roundEnum("round").notNull(),
  seasonType: seasonTypeEnum("season_type").notNull().default("post"),
  week: integer("week"),
  homeTeamId: uuid("home_team_id")
    .references(() => nflTeams.id, { onDelete: "cascade" })
    .notNull(),
  awayTeamId: uuid("away_team_id")
    .references(() => nflTeams.id, { onDelete: "cascade" })
    .notNull(),
  kickoffAt: timestamp("kickoff_at", { withTimezone: true }).notNull(),
  externalGameKey: text("external_game_key"),
  final: boolean("final").notNull().default(false),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const playerGameStats = pgTable(
  "player_game_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .references(() => players.id, { onDelete: "cascade" })
      .notNull(),
    gameId: uuid("game_id")
      .references(() => games.id, { onDelete: "cascade" })
      .notNull(),
    passingYards: integer("passing_yards").notNull().default(0),
    passingTds: integer("passing_tds").notNull().default(0),
    passingTwoPt: integer("passing_two_pt").notNull().default(0),
    rushingYards: integer("rushing_yards").notNull().default(0),
    rushingTds: integer("rushing_tds").notNull().default(0),
    rushingTwoPt: integer("rushing_two_pt").notNull().default(0),
    receivingYards: integer("receiving_yards").notNull().default(0),
    receivingTds: integer("receiving_tds").notNull().default(0),
    receivingTwoPt: integer("receiving_two_pt").notNull().default(0),
    receptions: integer("receptions").notNull().default(0),
    fgMade0to39: integer("fg_made_0_39").notNull().default(0),
    fgMade40to49: integer("fg_made_40_49").notNull().default(0),
    fgMade50to59: integer("fg_made_50_59").notNull().default(0),
    fgMade60Plus: integer("fg_made_60_plus").notNull().default(0),
    xpMade: integer("xp_made").notNull().default(0),
    defInt: integer("def_int").notNull().default(0),
    sacks: integer("sacks").notNull().default(0),
    safeties: integer("safeties").notNull().default(0),
    defFumbleRecoveries: integer("def_fumble_recoveries").notNull().default(0),
    defStTds: integer("def_st_tds").notNull().default(0),
    fum2pk: integer("fum2pk").notNull().default(0),
    fum2pt: integer("fum2pt").notNull().default(0),
    int2pk: integer("int2pk").notNull().default(0),
    int2pt: integer("int2pt").notNull().default(0),
    manualOverridePoints: numeric("manual_override_points", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    playerGameUnique: uniqueIndex("player_game_stats_unique").on(table.playerId, table.gameId),
  })
);

export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});
