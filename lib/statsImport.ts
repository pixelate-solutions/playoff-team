import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { games, nflTeams, playerGameStats, players } from "@/db/schema";
import { recalculateAllEntryTotals } from "@/lib/recalculate";

export const playoffRounds = ["Wildcard", "Divisional", "Conference", "SuperBowl"] as const;
export type PlayoffRound = (typeof playoffRounds)[number];

export type NormalizedStat = {
  externalPlayerId?: string;
  playerName?: string;
  teamAbbr?: string;
  position?: string;
  gameKey: string;
  round: PlayoffRound;
  seasonType?: "regular" | "post";
  week?: number;
  kickoffAt: string;
  passingYards?: number;
  passingTds?: number;
  passingTwoPt?: number;
  rushingYards?: number;
  rushingTds?: number;
  rushingTwoPt?: number;
  receivingYards?: number;
  receivingTds?: number;
  receivingTwoPt?: number;
  receptions?: number;
  fg0_39?: number;
  fg40_49?: number;
  fg50_59?: number;
  fg60Plus?: number;
  xpMade?: number;
  interceptions?: number;
  sacks?: number;
  safeties?: number;
  fumbleRecoveries?: number;
  returnTds?: number;
  fum2pk?: number;
  fum2pt?: number;
  int2pk?: number;
  int2pt?: number;
};

type PlayerRow = {
  id: string;
  name: string;
  position: string;
  externalId: string | null;
  teamId: string;
  teamAbbr: string;
};

type GameGroup = {
  kickoffAt: Date;
  round: PlayoffRound;
  seasonType: "regular" | "post";
  week?: number;
  teamAbbrs: Set<string>;
};

function normalizeName(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
  const suffixes = new Set(["jr", "sr", "ii", "iii", "iv", "v"]);
  const tokens = normalized
    .split(/\s+/)
    .filter((token) => token && !suffixes.has(token));
  return tokens.join("");
}

function parseKickoffAt(value?: string) {
  if (!value) {
    return new Date();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function isDstPosition(position?: string) {
  const normalized = (position ?? "").toUpperCase();
  return normalized === "DST" || normalized === "DEF" || normalized === "D/ST";
}

function hasStatValues(stat: NormalizedStat) {
  return Object.entries(stat).some(([key, value]) => {
    if (
      key === "externalPlayerId" ||
      key === "playerName" ||
      key === "teamAbbr" ||
      key === "position" ||
      key === "gameKey" ||
      key === "round" ||
      key === "kickoffAt"
    ) {
      return false;
    }
    return typeof value === "number" && value !== 0;
  });
}

function toInt(value: number | undefined) {
  if (value === null || value === undefined) return 0;
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}

export async function importNormalizedStats(stats: NormalizedStat[]) {
  if (!stats.length) {
    return;
  }

  const teams = await db.query.nflTeams.findMany();
  const teamByAbbr = new Map(teams.map((team) => [team.abbreviation.toUpperCase(), team]));

  const playerRows: PlayerRow[] = await db
    .select({
      id: players.id,
      name: players.name,
      position: players.position,
      externalId: players.externalId,
      teamId: players.nflTeamId,
      teamAbbr: nflTeams.abbreviation,
    })
    .from(players)
    .innerJoin(nflTeams, eq(players.nflTeamId, nflTeams.id));

  const playerByExternalId = new Map<string, PlayerRow>();
  const playerByNameTeam = new Map<string, PlayerRow>();
  const dstByTeam = new Map<string, PlayerRow>();

  for (const player of playerRows) {
    if (player.externalId) {
      playerByExternalId.set(player.externalId, player);
    }
    const key = `${normalizeName(player.name)}|${player.teamAbbr.toUpperCase()}`;
    playerByNameTeam.set(key, player);
    if (player.position === "DST") {
      dstByTeam.set(player.teamAbbr.toUpperCase(), player);
    }
  }

  const gameGroups = new Map<string, GameGroup>();
  for (const stat of stats) {
    if (!stat.gameKey) {
      continue;
    }
    const group = gameGroups.get(stat.gameKey) ?? {
      kickoffAt: parseKickoffAt(stat.kickoffAt),
      round: stat.round,
      seasonType: stat.seasonType ?? "post",
      week: stat.week,
      teamAbbrs: new Set<string>(),
    };
    if (stat.seasonType) {
      group.seasonType = stat.seasonType;
    }
    if (stat.week) {
      group.week = stat.week;
    }
    if (stat.teamAbbr) {
      group.teamAbbrs.add(stat.teamAbbr.toUpperCase());
    }
    gameGroups.set(stat.gameKey, group);
  }

  const gameKeys = Array.from(gameGroups.keys());
  const existingGames = gameKeys.length
    ? await db
        .select({
          id: games.id,
          externalGameKey: games.externalGameKey,
        })
        .from(games)
        .where(inArray(games.externalGameKey, gameKeys))
    : [];

  const gameIdByKey = new Map<string, string>();
  for (const game of existingGames) {
    if (game.externalGameKey) {
      gameIdByKey.set(game.externalGameKey, game.id);
    }
  }

  for (const [gameKey, group] of gameGroups.entries()) {
    if (gameIdByKey.has(gameKey)) {
      const existingId = gameIdByKey.get(gameKey);
      if (existingId) {
        await db
          .update(games)
          .set({
            round: group.round ?? "Wildcard",
            seasonType: group.seasonType ?? "post",
            week: group.week,
          })
          .where(eq(games.id, existingId));
      }
      continue;
    }

    const teamIds = Array.from(group.teamAbbrs)
      .map((abbr) => teamByAbbr.get(abbr)?.id)
      .filter((id): id is string => Boolean(id));

    if (teamIds.length < 2) {
      const fallbackIds = teams.slice(0, 2).map((team) => team.id);
      if (fallbackIds.length < 2) {
        continue;
      }
      teamIds.push(...fallbackIds);
    }

    const [created] = await db
      .insert(games)
      .values({
        round: group.round ?? "Wildcard",
        seasonType: group.seasonType ?? "post",
        week: group.week,
        homeTeamId: teamIds[0],
        awayTeamId: teamIds[1],
        kickoffAt: group.kickoffAt,
        externalGameKey: gameKey,
        final: true,
      })
      .returning({ id: games.id });

    if (created?.id) {
      gameIdByKey.set(gameKey, created.id);
    }
  }

  for (const stat of stats) {
    if (!hasStatValues(stat)) {
      continue;
    }
    const gameId = gameIdByKey.get(stat.gameKey);
    if (!gameId) {
      continue;
    }

    let player: PlayerRow | undefined;
    if (stat.externalPlayerId) {
      player = playerByExternalId.get(stat.externalPlayerId);
    }

    if (!player && isDstPosition(stat.position) && stat.teamAbbr) {
      player = dstByTeam.get(stat.teamAbbr.toUpperCase());
    }

    if (!player && stat.playerName && stat.teamAbbr) {
      const key = `${normalizeName(stat.playerName)}|${stat.teamAbbr.toUpperCase()}`;
      player = playerByNameTeam.get(key);
    }

    if (!player) {
      continue;
    }

    const values = {
      playerId: player.id,
      gameId,
      passingYards: toInt(stat.passingYards),
      passingTds: toInt(stat.passingTds),
      passingTwoPt: toInt(stat.passingTwoPt),
      rushingYards: toInt(stat.rushingYards),
      rushingTds: toInt(stat.rushingTds),
      rushingTwoPt: toInt(stat.rushingTwoPt),
      receivingYards: toInt(stat.receivingYards),
      receivingTds: toInt(stat.receivingTds),
      receivingTwoPt: toInt(stat.receivingTwoPt),
      receptions: toInt(stat.receptions),
      fgMade0to39: toInt(stat.fg0_39),
      fgMade40to49: toInt(stat.fg40_49),
      fgMade50to59: toInt(stat.fg50_59),
      fgMade60Plus: toInt(stat.fg60Plus),
      xpMade: toInt(stat.xpMade),
      defInt: toInt(stat.interceptions),
      sacks: toInt(stat.sacks),
      safeties: toInt(stat.safeties),
      defFumbleRecoveries: toInt(stat.fumbleRecoveries),
      defStTds: toInt(stat.returnTds),
      fum2pk: toInt(stat.fum2pk),
      fum2pt: toInt(stat.fum2pt),
      int2pk: toInt(stat.int2pk),
      int2pt: toInt(stat.int2pt),
    };

    await db
      .insert(playerGameStats)
      .values(values)
      .onConflictDoUpdate({
        target: [playerGameStats.playerId, playerGameStats.gameId],
        set: values,
      });
  }

  await recalculateAllEntryTotals();
}

export async function replaceNormalizedStats(stats: NormalizedStat[]) {
  await db.delete(playerGameStats);

  if (!stats.length) {
    await recalculateAllEntryTotals();
    return;
  }

  await importNormalizedStats(stats);
}
