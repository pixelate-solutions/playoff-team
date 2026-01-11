import type { InferSelectModel } from "drizzle-orm";
import { playerGameStats } from "@/db/schema";

export type PlayerGameStatsRow = InferSelectModel<typeof playerGameStats>;
export type PlayerGameStatsInput = Omit<
  PlayerGameStatsRow,
  "id" | "playerId" | "gameId" | "createdAt" | "updatedAt"
>;

export type PointsBreakdownItem = {
  label: string;
  stat: number;
  points: number;
  unit?: string;
};

export type PointsBreakdown = {
  totalPoints: number;
  items: PointsBreakdownItem[];
  isManualOverride: boolean;
};

export function computePointsFromStats(row: PlayerGameStatsInput): number {
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

export function computePointsBreakdown(row: PlayerGameStatsInput): PointsBreakdown {
  const overrideValue = normalizePoints(row.manualOverridePoints);
  if (row.manualOverridePoints !== null && row.manualOverridePoints !== undefined) {
    return {
      totalPoints: overrideValue,
      items: [
        {
          label: "Manual override",
          stat: overrideValue,
          points: overrideValue,
          unit: "pts",
        },
      ],
      isManualOverride: true,
    };
  }

  const items: PointsBreakdownItem[] = [];
  const addItem = (label: string, stat: number, points: number, unit?: string) => {
    if (stat === 0 && points === 0) return;
    items.push({ label, stat, points, unit });
  };

  const passingYardsPoints = Math.floor(row.passingYards / 20);
  addItem("Passing Yards", row.passingYards, passingYardsPoints, "yds");
  addItem("Passing TD", row.passingTds, row.passingTds * 6, "TD");
  addItem("Passing 2PT", row.passingTwoPt, row.passingTwoPt * 2, "2pt");

  const rushingYardsPoints = Math.floor(row.rushingYards / 10);
  addItem("Rushing Yards", row.rushingYards, rushingYardsPoints, "yds");
  addItem("Rushing TD", row.rushingTds, row.rushingTds * 6, "TD");
  addItem("Rushing 2PT", row.rushingTwoPt, row.rushingTwoPt * 2, "2pt");

  const receivingYardsPoints = Math.floor(row.receivingYards / 10);
  addItem("Receiving Yards", row.receivingYards, receivingYardsPoints, "yds");
  addItem("Receiving TD", row.receivingTds, row.receivingTds * 6, "TD");
  addItem("Receiving 2PT", row.receivingTwoPt, row.receivingTwoPt * 2, "2pt");
  addItem("Receptions", row.receptions, row.receptions, "rec");

  addItem("FG 0-39", row.fgMade0to39, row.fgMade0to39 * 3, "made");
  addItem("FG 40-49", row.fgMade40to49, row.fgMade40to49 * 4, "made");
  addItem("FG 50-59", row.fgMade50to59, row.fgMade50to59 * 5, "made");
  addItem("FG 60+", row.fgMade60Plus, row.fgMade60Plus * 6, "made");
  addItem("XP", row.xpMade, row.xpMade, "made");

  addItem("Interception", row.defInt, row.defInt * 2, "INT");
  addItem("Sack", row.sacks, row.sacks, "sack");
  addItem("Safety", row.safeties, row.safeties * 2, "safety");
  addItem("Fumble Recovery", row.defFumbleRecoveries, row.defFumbleRecoveries * 2, "rec");
  addItem("Def/ST TD", row.defStTds, row.defStTds * 9, "TD");
  addItem("Fum2PK", row.fum2pk, row.fum2pk * 2, "2pt");
  addItem("Fum2PT", row.fum2pt, row.fum2pt * 2, "2pt");
  addItem("Int2PK", row.int2pk, row.int2pk * 2, "2pt");
  addItem("Int2PT", row.int2pt, row.int2pt * 2, "2pt");

  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);
  return { totalPoints, items, isManualOverride: false };
}

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
