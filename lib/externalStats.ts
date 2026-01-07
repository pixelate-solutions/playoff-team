export type PlayoffRound = "Wildcard" | "Divisional" | "Conference" | "SuperBowl";

export type ExternalStat = {
  externalPlayerId: string;
  externalTeamId: string;
  gameKey: string;
  round: PlayoffRound;
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

export type FetchPlayoffStatsParams = {
  seasonYear?: number;
};

const SLEEPER_BASE_URL = "https://api.sleeper.app/v1";
const STAT_RANK_KEYS = new Set([
  "pos_rank_half_ppr",
  "pos_rank_ppr",
  "pos_rank_std",
  "rank_half_ppr",
  "rank_ppr",
  "rank_std",
]);

type SleeperPlayer = {
  player_id: string;
  full_name?: string;
  team?: string | null;
  team_abbr?: string | null;
  position?: string | null;
};

let cachedPlayers: Record<string, SleeperPlayer> | null = null;

async function fetchSleeperPlayers(): Promise<Record<string, SleeperPlayer>> {
  if (cachedPlayers) {
    return cachedPlayers;
  }
  const response = await fetch(`${SLEEPER_BASE_URL}/players/nfl`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Sleeper players request failed (${response.status})`);
  }
  const data = (await response.json()) as Record<string, SleeperPlayer>;
  cachedPlayers = data;
  return data;
}

function statValue(stat: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = stat[key];
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string" && value !== "") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
}

function sumStat(stat: Record<string, unknown>, keys: string[]) {
  return keys.reduce((sum, key) => sum + statValue(stat, [key]), 0);
}

function hasOnlyRankFields(stat: Record<string, unknown>) {
  const keys = Object.keys(stat);
  return keys.length > 0 && keys.every((key) => STAT_RANK_KEYS.has(key));
}

function roundFromWeek(week: number): PlayoffRound {
  if (week >= 22) return "SuperBowl";
  if (week === 21) return "Conference";
  if (week === 20) return "Divisional";
  return "Wildcard";
}

async function fetchSleeperStats(seasonYear: number, week: number, seasonType: "post" | "regular") {
  const response = await fetch(
    `${SLEEPER_BASE_URL}/stats/nfl/${seasonYear}/${week}?season_type=${seasonType}`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error(`Sleeper stats request failed (${response.status})`);
  }
  const data = (await response.json()) as Record<string, Record<string, unknown>>;
  return data;
}

type SleeperState = {
  week: number;
  season: string;
  season_type: "post" | "regular";
  season_has_scores?: boolean;
};

async function fetchSleeperState(): Promise<SleeperState> {
  const response = await fetch(`${SLEEPER_BASE_URL}/state/nfl`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Sleeper state request failed (${response.status})`);
  }
  return (await response.json()) as SleeperState;
}

async function findLatestWeekWithStats(seasonYear: number, startWeek: number, seasonType: "post" | "regular") {
  for (let week = startWeek; week >= 1; week -= 1) {
    let stats = await fetchSleeperStats(seasonYear, week, seasonType);
    let values = Object.values(stats);
    let hasStats = values.some((item) => !hasOnlyRankFields(item));

    if (!hasStats) {
      const fallback = seasonType === "post" ? "regular" : "post";
      stats = await fetchSleeperStats(seasonYear, week, fallback);
      values = Object.values(stats);
      hasStats = values.some((item) => !hasOnlyRankFields(item));
    }

    if (hasStats) {
      return { week, stats };
    }
  }

  return null;
}

export async function fetchExternalPlayoffStats(
  params: FetchPlayoffStatsParams
): Promise<ExternalStat[]> {
  const players = await fetchSleeperPlayers();
  const results: ExternalStat[] = [];

  let seasonYear = params.seasonYear;
  let startWeek = 22;
  let seasonType: "post" | "regular" = "post";

  if (!seasonYear) {
    const state = await fetchSleeperState();
    seasonYear = Number(state.season);
    startWeek = state.week;
    seasonType = state.season_type === "regular" ? "regular" : "post";
  }

  if (!seasonYear || Number.isNaN(seasonYear)) {
    throw new Error("Sleeper season year is unavailable.");
  }

  const latest = await findLatestWeekWithStats(seasonYear, startWeek, seasonType);
  if (!latest) {
    return [];
  }

  const { week, stats } = latest;
  const round = roundFromWeek(week);

  for (const [playerId, stat] of Object.entries(stats)) {
    if (!stat || typeof stat !== "object") {
      continue;
    }
    if (hasOnlyRankFields(stat)) {
      continue;
    }

    const player = players[playerId];
    const teamAbbrRaw = player?.team ?? player?.team_abbr ?? null;
    const teamAbbr = teamAbbrRaw ? teamAbbrRaw.toUpperCase() : "";

    const fg0to39 = sumStat(stat, ["fgm_0_19", "fgm_20_29", "fgm_30_39", "fgm_0_39"]);
    const fg40to49 = sumStat(stat, ["fgm_40_49"]);
    const fg50to59 = sumStat(stat, ["fgm_50_59"]);
    const fg60Plus = sumStat(stat, ["fgm_60_plus", "fgm_60+", "fgm_60"]);
    const fgTotal = statValue(stat, ["fgm"]);
    const fallbackFg0to39 = fg0to39 + fg40to49 + fg50to59 + fg60Plus === 0 ? fgTotal : fg0to39;

    const defensiveTds = sumStat(stat, ["def_td", "def_st_td", "def_pr_td", "def_kr_td"]);
    const twoPointReturns = statValue(stat, ["def_2pt", "def_2pt_conv", "def_2pt_return"]);
    let fumTwoPt = statValue(stat, ["fum_2pt", "fum_2pt_conv", "fum_2pt_return", "def_fum_2pt"]);
    let intTwoPt = statValue(stat, ["int_2pt", "int_2pt_conv", "int_2pt_return", "def_int_2pt"]);
    if (fumTwoPt === 0 && intTwoPt === 0 && twoPointReturns > 0) {
      fumTwoPt = twoPointReturns;
    }

    const row = {
      externalPlayerId: playerId,
      externalTeamId: teamAbbr,
      gameKey: `sleeper-${seasonYear}-${seasonType}-week-${week}`,
      round,
      kickoffAt: new Date().toISOString(),
      passingYards: statValue(stat, ["pass_yd", "pass_yds", "passing_yds"]),
      passingTds: statValue(stat, ["pass_td", "pass_tds", "passing_td"]),
      passingTwoPt: statValue(stat, ["pass_2pt", "pass_2pt_conv"]),
      rushingYards: statValue(stat, ["rush_yd", "rush_yds", "rushing_yds"]),
      rushingTds: statValue(stat, ["rush_td", "rush_tds"]),
      rushingTwoPt: statValue(stat, ["rush_2pt", "rush_2pt_conv"]),
      receivingYards: statValue(stat, ["rec_yd", "rec_yds", "receiving_yds"]),
      receivingTds: statValue(stat, ["rec_td", "rec_tds"]),
      receivingTwoPt: statValue(stat, ["rec_2pt", "rec_2pt_conv"]),
      receptions: statValue(stat, ["rec", "receptions"]),
      fg0_39: fallbackFg0to39,
      fg40_49: fg40to49,
      fg50_59: fg50to59,
      fg60Plus: fg60Plus,
      xpMade: statValue(stat, ["xpm", "xp_made"]),
      interceptions: statValue(stat, ["def_int", "def_ints"]),
      sacks: statValue(stat, ["def_sack", "def_sacks", "sack"]),
      safeties: statValue(stat, ["def_safety", "def_safeties"]),
      fumbleRecoveries: statValue(stat, ["def_fum_rec", "def_st_fum_rec", "fum_rec"]),
      returnTds: defensiveTds,
      fum2pk: statValue(stat, ["fum_2pt_kick", "fum_2pt_kicking"]),
      fum2pt: fumTwoPt,
      int2pk: statValue(stat, ["int_2pt_kick", "int_2pt_kicking"]),
      int2pt: intTwoPt,
    };

    const hasStats = Object.entries(row).some(([key, value]) => {
      if (
        key === "externalPlayerId" ||
        key === "externalTeamId" ||
        key === "gameKey" ||
        key === "round" ||
        key === "kickoffAt"
      ) {
        return false;
      }
      return typeof value === "number" && value !== 0;
    });

    if (!hasStats) {
      continue;
    }

    results.push(row);
  }

  return results;
}
