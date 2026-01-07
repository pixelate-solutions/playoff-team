import type { NormalizedStat, PlayoffRound } from "@/lib/statsImport";

const ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

type EspnScoreboard = {
  events?: Array<{ id: string; date?: string }>;
};

type EspnSummary = {
  boxscore?: {
    players?: Array<{
      team?: { abbreviation?: string };
      statistics?: Array<{
        name?: string;
        keys?: string[];
        athletes?: Array<{
          athlete?: {
            id?: string;
            displayName?: string;
            position?: { abbreviation?: string };
          };
          stats?: Array<string | number | null>;
        }>;
      }>;
    }>;
  };
  scoringPlays?: Array<{
    text?: string;
    team?: { abbreviation?: string };
    scoringType?: { name?: string };
    type?: { text?: string };
  }>;
};

type DefenseTotals = {
  interceptions: number;
  sacks: number;
  safeties: number;
  fumbleRecoveries: number;
  defensiveTds: number;
  returnTds: number;
};

type KickerBuckets = {
  fg0_39: number;
  fg40_49: number;
  fg50_59: number;
  fg60Plus: number;
};

function getPlayoffWeekForRound(round: PlayoffRound): number {
  switch (round) {
    case "Wildcard":
      return 1;
    case "Divisional":
      return 2;
    case "Conference":
      return 3;
    case "SuperBowl":
      return 4;
    default:
      return 1;
  }
}

function normalizeName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function parseNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    if (trimmed.includes("/")) {
      const [made] = trimmed.split("/");
      const parsed = Number(made);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    if (trimmed.includes("-")) {
      const [first] = trimmed.split("-");
      const parsed = Number(first);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function getStatValue(keys: string[] | undefined, stats: Array<string | number | null> | undefined, key: string) {
  if (!keys || !stats) return 0;
  const index = keys.indexOf(key);
  if (index === -1) return 0;
  return parseNumber(stats[index]);
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

function parseFieldGoalText(text: string) {
  const match = text.match(/^(.+?)\s+(\d{1,3})\s*Yd\s+Field Goal/i);
  if (!match) return null;
  return { kickerName: match[1].trim(), distance: Number(match[2]) };
}

function getOrCreateDefense(map: Map<string, DefenseTotals>, teamAbbr: string) {
  const existing = map.get(teamAbbr);
  if (existing) return existing;
  const created = {
    interceptions: 0,
    sacks: 0,
    safeties: 0,
    fumbleRecoveries: 0,
    defensiveTds: 0,
    returnTds: 0,
  };
  map.set(teamAbbr, created);
  return created;
}

function getOrCreateBuckets(map: Map<string, KickerBuckets>, key: string) {
  const existing = map.get(key);
  if (existing) return existing;
  const created = { fg0_39: 0, fg40_49: 0, fg50_59: 0, fg60Plus: 0 };
  map.set(key, created);
  return created;
}

export async function fetchEspnPlayoffStats(params: {
  seasonYear: number;
  round: PlayoffRound;
}): Promise<NormalizedStat[]> {
  const week = getPlayoffWeekForRound(params.round);
  return fetchEspnStats({
    seasonYear: params.seasonYear,
    week,
    seasonType: "post",
    round: params.round,
  });
}

export async function fetchEspnStats(params: {
  seasonYear: number;
  week: number;
  seasonType: "post" | "regular";
  round?: PlayoffRound;
}): Promise<NormalizedStat[]> {
  const seasonTypeValue = params.seasonType === "post" ? 3 : 2;
  const scoreboardUrl = `${ESPN_BASE_URL}/scoreboard?seasontype=${seasonTypeValue}&week=${params.week}&year=${params.seasonYear}`;
  const scoreboardRes = await fetch(scoreboardUrl, {
    headers: { "User-Agent": "playoff-fantasy-app" },
    cache: "no-store",
  });
  if (!scoreboardRes.ok) {
    throw new Error(`ESPN scoreboard error: ${scoreboardRes.status}`);
  }
  const scoreboard = (await scoreboardRes.json()) as EspnScoreboard;
  const events = scoreboard.events ?? [];

  const allStats: NormalizedStat[] = [];

  for (const event of events) {
    const summaryUrl = `${ESPN_BASE_URL}/summary?event=${event.id}`;
    const summaryRes = await fetch(summaryUrl, {
      headers: { "User-Agent": "playoff-fantasy-app" },
      cache: "no-store",
    });
    if (!summaryRes.ok) continue;
    const summary = (await summaryRes.json()) as EspnSummary;

    const kickoffAt = event.date ?? new Date().toISOString();
    const gameKey = event.id;
    const playerStats = new Map<string, NormalizedStat>();
    const teamDefense = new Map<string, DefenseTotals>();
    const fgBuckets = new Map<string, KickerBuckets>();
    const round = params.round ?? "Wildcard";
    const seasonType = params.seasonType === "post" ? "post" : "regular";
    const week = params.week;

    const scoringPlays = summary.scoringPlays ?? [];
    for (const play of scoringPlays) {
      const text = play.text ?? "";
      const typeName = play.scoringType?.name ?? "";
      const typeText = play.type?.text ?? "";
      if (!/field goal/i.test(typeName) && !/field goal/i.test(typeText) && !/field goal/i.test(text)) {
        continue;
      }
      const parsed = parseFieldGoalText(text);
      const teamAbbr = play.team?.abbreviation ?? "";
      if (!parsed || !teamAbbr) continue;

      const key = `${normalizeName(parsed.kickerName)}|${teamAbbr}`;
      const bucket = getOrCreateBuckets(fgBuckets, key);
      if (parsed.distance >= 60) bucket.fg60Plus += 1;
      else if (parsed.distance >= 50) bucket.fg50_59 += 1;
      else if (parsed.distance >= 40) bucket.fg40_49 += 1;
      else bucket.fg0_39 += 1;
    }

    const teams = summary.boxscore?.players ?? [];
    for (const team of teams) {
      const teamAbbr = team.team?.abbreviation ?? "";
      if (!teamAbbr) continue;

      const defenseEligibleAthletes = new Set<string>();
      for (const category of team.statistics ?? []) {
        const categoryName = (category.name ?? "").toLowerCase();
        if (
          categoryName === "defensive" ||
          categoryName === "interceptions" ||
          categoryName === "kickreturns" ||
          categoryName === "puntreturns"
        ) {
          for (const athleteStat of category.athletes ?? []) {
            const athleteId = athleteStat.athlete?.id;
            if (athleteId) {
              defenseEligibleAthletes.add(athleteId);
            }
          }
        }
      }

      for (const category of team.statistics ?? []) {
        const categoryName = (category.name ?? "").toLowerCase();
        const keys = category.keys ?? [];

        for (const athleteStat of category.athletes ?? []) {
          const athlete = athleteStat.athlete;
          const athleteId = athlete?.id ?? "";
          const athleteName = athlete?.displayName ?? "";
          const position = athlete?.position?.abbreviation ?? "";
          if (!athleteId) continue;

          if (!playerStats.has(athleteId)) {
            playerStats.set(athleteId, {
              externalPlayerId: athleteId,
              playerName: athleteName,
              teamAbbr,
              position,
              gameKey,
              round,
              seasonType,
              week,
              kickoffAt,
            });
          }

          const entry = playerStats.get(athleteId)!;
          const stats = athleteStat.stats ?? [];

          if (categoryName === "passing") {
            entry.passingYards = (entry.passingYards ?? 0) + getStatValue(keys, stats, "passingYards");
            entry.passingTds = (entry.passingTds ?? 0) + getStatValue(keys, stats, "passingTouchdowns");
          }

          if (categoryName === "rushing") {
            entry.rushingYards = (entry.rushingYards ?? 0) + getStatValue(keys, stats, "rushingYards");
            entry.rushingTds = (entry.rushingTds ?? 0) + getStatValue(keys, stats, "rushingTouchdowns");
          }

          if (categoryName === "receiving") {
            entry.receptions = (entry.receptions ?? 0) + getStatValue(keys, stats, "receptions");
            entry.receivingYards = (entry.receivingYards ?? 0) + getStatValue(keys, stats, "receivingYards");
            entry.receivingTds = (entry.receivingTds ?? 0) + getStatValue(keys, stats, "receivingTouchdowns");
          }

          if (categoryName === "kicking") {
            const fgMade = getStatValue(keys, stats, "fieldGoalsMade/fieldGoalAttempts");
            const xpMade = getStatValue(keys, stats, "extraPointsMade/extraPointAttempts");
            if (fgMade || xpMade) {
              entry.xpMade = (entry.xpMade ?? 0) + xpMade;
              const key = `${normalizeName(athleteName)}|${teamAbbr}`;
              const buckets = fgBuckets.get(key);
              if (buckets) {
                const bucketTotal = buckets.fg0_39 + buckets.fg40_49 + buckets.fg50_59 + buckets.fg60Plus;
                const remainder = Math.max(0, fgMade - bucketTotal);
                entry.fg0_39 = buckets.fg0_39 + remainder;
                entry.fg40_49 = buckets.fg40_49;
                entry.fg50_59 = buckets.fg50_59;
                entry.fg60Plus = buckets.fg60Plus;
              } else {
                entry.fg0_39 = (entry.fg0_39 ?? 0) + fgMade;
              }
            }
          }

          if (categoryName === "defensive") {
            const defense = getOrCreateDefense(teamDefense, teamAbbr);
            defense.sacks += getStatValue(keys, stats, "sacks");
            defense.defensiveTds += getStatValue(keys, stats, "defensiveTouchdowns");
            defense.safeties += getStatValue(keys, stats, "safeties");
          }

          if (categoryName === "interceptions") {
            const defense = getOrCreateDefense(teamDefense, teamAbbr);
            defense.interceptions += getStatValue(keys, stats, "interceptions");
            defense.returnTds += getStatValue(keys, stats, "interceptionTouchdowns");
          }

          if (categoryName === "fumbles") {
            const defense = getOrCreateDefense(teamDefense, teamAbbr);
            const recovered = getStatValue(keys, stats, "fumblesRecovered");
            if (recovered && defenseEligibleAthletes.has(athleteId)) {
              defense.fumbleRecoveries += recovered;
            }
          }

          if (categoryName === "kickreturns") {
            const defense = getOrCreateDefense(teamDefense, teamAbbr);
            defense.returnTds += getStatValue(keys, stats, "kickReturnTouchdowns");
          }

          if (categoryName === "puntreturns") {
            const defense = getOrCreateDefense(teamDefense, teamAbbr);
            defense.returnTds += getStatValue(keys, stats, "puntReturnTouchdowns");
          }
        }
      }
    }

    for (const entry of playerStats.values()) {
      if (hasStatValues(entry)) {
        allStats.push(entry);
      }
    }

    for (const [teamAbbr, defense] of teamDefense.entries()) {
      const totalReturnTds = Math.max(defense.defensiveTds, defense.returnTds);
      const dstStat: NormalizedStat = {
        teamAbbr,
        position: "DST",
        gameKey,
        round,
        seasonType,
        week,
        kickoffAt,
        interceptions: defense.interceptions,
        sacks: defense.sacks,
        safeties: defense.safeties,
        fumbleRecoveries: defense.fumbleRecoveries,
        returnTds: totalReturnTds,
      };

      if (hasStatValues(dstStat)) {
        allStats.push(dstStat);
      }
    }
  }

  return allStats;
}
