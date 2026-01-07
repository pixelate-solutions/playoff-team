import { z } from "zod";
import { entrySlotSchema } from "@/lib/roster";

export const createEntrySchema = z.object({
  firstName: z.string().min(2).max(40),
  lastName: z.string().min(2).max(60),
  email: z.string().email(),
  roster: z
    .array(
      z.object({
        playerId: z.string().uuid(),
        slot: entrySlotSchema,
      })
    )
    .min(14)
    .max(14),
});

export const entryLookupSchema = z.object({
  email: z.string().email(),
});

export const adminTeamSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  abbreviation: z.string().min(2).max(4),
  conference: z.enum(["AFC", "NFC"]),
  seed: z.number().int().nullable().optional(),
  madePlayoffs: z.boolean(),
  eliminatedRound: z.string().nullable().optional(),
  externalId: z.string().nullable().optional(),
});

export const adminPlayerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  position: z.enum(["QB", "RB", "WR", "TE", "K", "DST"]),
  nflTeamId: z.string().uuid(),
  isActive: z.boolean(),
  notes: z.string().nullable().optional(),
  playoffOverridePoints: z.number().nullable().optional(),
  externalId: z.string().nullable().optional(),
});

export const adminPlayerOverrideSchema = z.object({
  playerId: z.string().uuid(),
  playoffOverridePoints: z.number().nullable(),
});

export const adminGameSchema = z.object({
  id: z.string().uuid().optional(),
  round: z.enum(["Wildcard", "Divisional", "Conference", "SuperBowl"]),
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
  kickoffAt: z.string(),
  final: z.boolean(),
  homeScore: z.number().int().nullable().optional(),
  awayScore: z.number().int().nullable().optional(),
});

export const adminStatsSchema = z.object({
  playerId: z.string().uuid(),
  gameId: z.string().uuid(),
  passingYards: z.number().int().nonnegative().default(0),
  passingTds: z.number().int().nonnegative().default(0),
  passingTwoPt: z.number().int().nonnegative().default(0),
  rushingYards: z.number().int().nonnegative().default(0),
  rushingTds: z.number().int().nonnegative().default(0),
  rushingTwoPt: z.number().int().nonnegative().default(0),
  receivingYards: z.number().int().nonnegative().default(0),
  receivingTds: z.number().int().nonnegative().default(0),
  receivingTwoPt: z.number().int().nonnegative().default(0),
  receptions: z.number().int().nonnegative().default(0),
  fgMade0to39: z.number().int().nonnegative().default(0),
  fgMade40to49: z.number().int().nonnegative().default(0),
  fgMade50to59: z.number().int().nonnegative().default(0),
  fgMade60Plus: z.number().int().nonnegative().default(0),
  xpMade: z.number().int().nonnegative().default(0),
  defInt: z.number().int().nonnegative().default(0),
  sacks: z.number().int().nonnegative().default(0),
  safeties: z.number().int().nonnegative().default(0),
  defFumbleRecoveries: z.number().int().nonnegative().default(0),
  defStTds: z.number().int().nonnegative().default(0),
  fum2pk: z.number().int().nonnegative().default(0),
  fum2pt: z.number().int().nonnegative().default(0),
  int2pk: z.number().int().nonnegative().default(0),
  int2pt: z.number().int().nonnegative().default(0),
  manualOverridePoints: z.number().nullable().optional(),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1),
});

export const adminRosterUpdateSchema = z.object({
  entryId: z.string().uuid(),
  playerId: z.string().uuid(),
  slot: entrySlotSchema,
  action: z.enum(["add", "remove"]),
});

export const adminEntryUpdateSchema = z.object({
  entryId: z.string().uuid(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

export const adminSettingsSchema = z.object({
  entriesLocked: z.boolean().optional(),
  currentRound: z.enum(["Wildcard", "Divisional", "Conference", "SuperBowl"]).optional(),
  seasonYear: z.number().int().optional(),
  leaderboardLinksEnabled: z.boolean().optional(),
});
