import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { entryPlayers, games, nflTeams, playerGameStats, players } from "@/db/schema";
import { computePointsBreakdown } from "@/lib/scoring";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");

  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const rosterEntry = await db.query.entryPlayers.findFirst({
    where: and(eq(entryPlayers.entryId, id), eq(entryPlayers.playerId, playerId)),
  });

  if (!rosterEntry) {
    return NextResponse.json({ error: "Player not found on roster" }, { status: 404 });
  }

  const homeTeams = alias(nflTeams, "home_teams");
  const awayTeams = alias(nflTeams, "away_teams");

  const playerRow = await db
    .select({
      id: players.id,
      name: players.name,
      position: players.position,
      teamAbbr: nflTeams.abbreviation,
      playoffOverridePoints: players.playoffOverridePoints,
    })
    .from(players)
    .innerJoin(nflTeams, eq(players.nflTeamId, nflTeams.id))
    .where(eq(players.id, playerId))
    .then((rows) => rows[0] ?? null);

  if (!playerRow) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const statsRows = await db
    .select({
      gameId: playerGameStats.gameId,
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
      round: games.round,
      seasonType: games.seasonType,
      week: games.week,
      kickoffAt: games.kickoffAt,
      final: games.final,
      homeScore: games.homeScore,
      awayScore: games.awayScore,
      homeTeamAbbr: homeTeams.abbreviation,
      awayTeamAbbr: awayTeams.abbreviation,
    })
    .from(playerGameStats)
    .innerJoin(games, eq(playerGameStats.gameId, games.id))
    .innerJoin(homeTeams, eq(games.homeTeamId, homeTeams.id))
    .innerJoin(awayTeams, eq(games.awayTeamId, awayTeams.id))
    .where(eq(playerGameStats.playerId, playerId))
    .orderBy(games.kickoffAt);

  const gamesWithBreakdown = statsRows.map((stat) => {
    const breakdown = computePointsBreakdown(stat);
    return {
      gameId: stat.gameId,
      round: stat.round,
      seasonType: stat.seasonType,
      week: stat.week,
      kickoffAt: stat.kickoffAt,
      final: stat.final,
      homeScore: stat.homeScore,
      awayScore: stat.awayScore,
      homeTeamAbbr: stat.homeTeamAbbr,
      awayTeamAbbr: stat.awayTeamAbbr,
      totalPoints: breakdown.totalPoints,
      breakdown: breakdown.items,
      isManualOverride: breakdown.isManualOverride,
    };
  });

  return NextResponse.json({ player: playerRow, games: gamesWithBreakdown });
}
