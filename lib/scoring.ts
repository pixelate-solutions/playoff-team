import type { InferSelectModel } from "drizzle-orm";
import { playerGameStats } from "@/db/schema";

export type PlayerGameStatsRow = InferSelectModel<typeof playerGameStats>;

export function computePointsFromStats(row: PlayerGameStatsRow): number {
  if (row.manualOverridePoints !== null && row.manualOverridePoints !== undefined) {
    return Number(row.manualOverridePoints);
  }

  const passingPoints = Math.floor(row.passingYards / 20) + row.passingTds * 6 + row.passingTwoPt * 2;
  const rushingPoints = Math.floor(row.rushingYards / 10) + row.rushingTds * 6 + row.rushingTwoPt * 2;
  const receivingPoints =
    Math.floor(row.receivingYards / 10) +
    row.receivingTds * 6 +
    row.receivingTwoPt * 2 +
    row.receptions * 1;
  const kickingPoints =
    row.fgMade0to39 * 3 +
    row.fgMade40to49 * 4 +
    row.fgMade50to59 * 5 +
    row.fgMade60Plus * 6 +
    row.xpMade * 1;
  const defensePoints =
    row.defFumbleRecoveries * 2 +
    row.defStTds * 9 +
    row.defInt * 2 +
    row.sacks * 1 +
    row.safeties * 2 +
    row.fum2pk * 2 +
    row.fum2pt * 2 +
    row.int2pk * 2 +
    row.int2pt * 2;

  return passingPoints + rushingPoints + receivingPoints + kickingPoints + defensePoints;
}

export const calculateFantasyPoints = computePointsFromStats;

export function normalizePoints(value: unknown) {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}
