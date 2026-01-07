import { eq } from "drizzle-orm";
import { db } from "@/db";
import { entries, entryPlayers, playerGameStats, players } from "@/db/schema";
import { computePointsFromStats, normalizePoints } from "@/lib/scoring";

export async function recalculateAllEntryTotals() {
  const stats = await db.select().from(playerGameStats);
  const pointsByPlayer = new Map<string, number>();

  for (const stat of stats) {
    const points = computePointsFromStats(stat);
    pointsByPlayer.set(stat.playerId, (pointsByPlayer.get(stat.playerId) ?? 0) + points);
  }

  const roster = await db
    .select({
      entryId: entryPlayers.entryId,
      playerId: entryPlayers.playerId,
      playoffOverridePoints: players.playoffOverridePoints,
    })
    .from(entryPlayers)
    .innerJoin(players, eq(entryPlayers.playerId, players.id));

  const entryTotals = new Map<string, number>();

  for (const item of roster) {
    const overrideAvailable = item.playoffOverridePoints !== null && item.playoffOverridePoints !== undefined;
    const override = normalizePoints(item.playoffOverridePoints);
    const playerPoints = overrideAvailable ? override : pointsByPlayer.get(item.playerId) ?? 0;
    entryTotals.set(item.entryId, (entryTotals.get(item.entryId) ?? 0) + playerPoints);
  }

  const allEntries = await db.select({ id: entries.id }).from(entries);
  for (const entry of allEntries) {
    const totalPointsCached = entryTotals.get(entry.id) ?? 0;
    await db
      .update(entries)
      .set({ totalPointsCached: totalPointsCached.toFixed(2) })
      .where(eq(entries.id, entry.id));
  }

  return entryTotals;
}
