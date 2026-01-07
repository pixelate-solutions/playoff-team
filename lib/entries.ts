import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { entries, entryPlayers, games, nflTeams, playerGameStats, players } from "@/db/schema";
import { computePointsFromStats, normalizePoints } from "@/lib/scoring";
import { playoffRounds, type PlayoffRound } from "@/lib/statsImport";

export async function getEntryWithRoster(entryId: string) {
  const entry = await db.query.entries.findFirst({
    where: eq(entries.id, entryId),
  });

  if (!entry) {
    return null;
  }

  const roster = await db
    .select({
      entryPlayerId: entryPlayers.id,
      slot: entryPlayers.slot,
      locked: entryPlayers.locked,
      playerId: players.id,
      playerName: players.name,
      position: players.position,
      teamId: players.nflTeamId,
      teamName: nflTeams.name,
      teamAbbreviation: nflTeams.abbreviation,
      playoffOverridePoints: players.playoffOverridePoints,
    })
    .from(entryPlayers)
    .innerJoin(players, eq(entryPlayers.playerId, players.id))
    .innerJoin(nflTeams, eq(players.nflTeamId, nflTeams.id))
    .where(eq(entryPlayers.entryId, entryId));

  const playerIds = roster.map((player) => player.playerId);

  const stats = playerIds.length
    ? await db
        .select({
          playerId: playerGameStats.playerId,
          round: games.round,
          seasonType: games.seasonType,
          week: games.week,
          passingYards: playerGameStats.passingYards,
          passingTds: playerGameStats.passingTds,
          passingTwoPt: playerGameStats.passingTwoPt,
          rushingYards: playerGameStats.rushingYards,
          rushingTds: playerGameStats.rushingTds,
          rushingTwoPt: playerGameStats.rushingTwoPt,
          receivingYards: playerGameStats.receivingYards,
          receivingTds: playerGameStats.receivingTds,
          receivingTwoPt: playerGameStats.receivingTwoPt,
          receptions: playerGameStats.receptions,
          fgMade0to39: playerGameStats.fgMade0to39,
          fgMade40to49: playerGameStats.fgMade40to49,
          fgMade50to59: playerGameStats.fgMade50to59,
          fgMade60Plus: playerGameStats.fgMade60Plus,
          xpMade: playerGameStats.xpMade,
          defInt: playerGameStats.defInt,
          sacks: playerGameStats.sacks,
          safeties: playerGameStats.safeties,
          defFumbleRecoveries: playerGameStats.defFumbleRecoveries,
          defStTds: playerGameStats.defStTds,
          fum2pk: playerGameStats.fum2pk,
          fum2pt: playerGameStats.fum2pt,
          int2pk: playerGameStats.int2pk,
          int2pt: playerGameStats.int2pt,
          manualOverridePoints: playerGameStats.manualOverridePoints,
        })
        .from(playerGameStats)
        .innerJoin(games, eq(playerGameStats.gameId, games.id))
        .where(inArray(playerGameStats.playerId, playerIds))
    : [];

  const playerPoints = roster.map((player) => {
    if (player.playoffOverridePoints !== null && player.playoffOverridePoints !== undefined) {
      return {
        playerId: player.playerId,
        totalPoints: normalizePoints(player.playoffOverridePoints),
        byRound: {},
        override: true,
      };
    }

    const perRound: Record<string, number> = {};
    const playerStats = stats.filter((stat) => stat.playerId === player.playerId);

    for (const stat of playerStats) {
      const roundKey =
        stat.seasonType === "regular" && stat.week ? `Week ${stat.week}` : stat.round;
      const points = computePointsFromStats(stat);
      perRound[roundKey] = (perRound[roundKey] ?? 0) + points;
    }

    const totalPoints = Object.values(perRound).reduce((sum, val) => sum + val, 0);

    return {
      playerId: player.playerId,
      totalPoints,
      byRound: perRound,
      override: false,
    };
  });

  const totalPoints = playerPoints.reduce((sum, player) => sum + player.totalPoints, 0);

  return {
    entry,
    roster,
    playerPoints,
    totalPoints,
  };
}

export async function getLeaderboard(round?: string | null) {
  const items = await db
    .select({
      id: entries.id,
      teamName: entries.teamName,
      participantName: entries.participantName,
      paid: entries.paid,
      totalPointsCached: entries.totalPointsCached,
    })
    .from(entries)
    .orderBy(sql`${entries.totalPointsCached} DESC`);

  if (!round) {
    return items.map((item) => ({
      ...item,
      totalPoints: normalizePoints(item.totalPointsCached),
    }));
  }

  const weekMatch = round.match(/week\s*(\d+)/i);
  const week = weekMatch ? Number(weekMatch[1]) : null;
  const isPlayoffRound = playoffRounds.includes(round as PlayoffRound);

  if (!week && !isPlayoffRound) {
    return items.map((item) => ({
      ...item,
      totalPoints: normalizePoints(item.totalPointsCached),
    }));
  }

  const roster = await db
    .select({
      entryId: entryPlayers.entryId,
      playerId: entryPlayers.playerId,
      passingYards: playerGameStats.passingYards,
      passingTds: playerGameStats.passingTds,
      passingTwoPt: playerGameStats.passingTwoPt,
      rushingYards: playerGameStats.rushingYards,
      rushingTds: playerGameStats.rushingTds,
      rushingTwoPt: playerGameStats.rushingTwoPt,
      receivingYards: playerGameStats.receivingYards,
      receivingTds: playerGameStats.receivingTds,
      receivingTwoPt: playerGameStats.receivingTwoPt,
      receptions: playerGameStats.receptions,
      fgMade0to39: playerGameStats.fgMade0to39,
      fgMade40to49: playerGameStats.fgMade40to49,
      fgMade50to59: playerGameStats.fgMade50to59,
      fgMade60Plus: playerGameStats.fgMade60Plus,
      xpMade: playerGameStats.xpMade,
      defInt: playerGameStats.defInt,
      sacks: playerGameStats.sacks,
      safeties: playerGameStats.safeties,
      defFumbleRecoveries: playerGameStats.defFumbleRecoveries,
      defStTds: playerGameStats.defStTds,
      fum2pk: playerGameStats.fum2pk,
      fum2pt: playerGameStats.fum2pt,
      int2pk: playerGameStats.int2pk,
      int2pt: playerGameStats.int2pt,
      manualOverridePoints: playerGameStats.manualOverridePoints,
    })
    .from(entryPlayers)
    .innerJoin(playerGameStats, eq(entryPlayers.playerId, playerGameStats.playerId))
    .innerJoin(games, eq(playerGameStats.gameId, games.id))
    .where(
      week
        ? and(eq(games.seasonType, "regular"), eq(games.week, week))
        : and(eq(games.seasonType, "post"), eq(games.round, round as PlayoffRound))
    );

  const entryTotals = new Map<string, number>();
  for (const item of roster) {
    const points = computePointsFromStats(item);
    entryTotals.set(item.entryId, (entryTotals.get(item.entryId) ?? 0) + points);
  }

  return items.map((item) => ({
    ...item,
    totalPoints: entryTotals.get(item.id) ?? 0,
  }));
}
