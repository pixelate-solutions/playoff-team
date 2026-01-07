import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { nflTeams, players } from "@/db/schema";

const SLEEPER_PLAYERS_URL = "https://api.sleeper.app/v1/players/nfl";
const suffixes = new Set(["jr", "sr", "ii", "iii", "iv", "v"]);
const manualIdByKey = new Map<string, string>([
  [buildKey(normalizeName("Josh Palmer"), "WR", "LAC"), "7670"],
  [buildKey(normalizeName("Andres Borregales"), "K", "CLE"), "12713"],
]);

type SleeperPlayer = {
  player_id: string;
  full_name?: string;
  team?: string | null;
  team_abbr?: string | null;
  position?: string | null;
};

function normalizeName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function stripSuffix(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length && suffixes.has(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts.join(" ");
}

function buildKey(name: string, position: string, team: string) {
  return `${name}|${position}|${team}`;
}

async function fetchSleeperPlayers(): Promise<Record<string, SleeperPlayer>> {
  const response = await fetch(SLEEPER_PLAYERS_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Sleeper players request failed (${response.status})`);
  }
  return (await response.json()) as Record<string, SleeperPlayer>;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const force = args.has("--force");

  const sleeperPlayers = await fetchSleeperPlayers();
  const index = new Map<string, Map<string, SleeperPlayer>>();
  const defByTeam = new Map<string, SleeperPlayer>();

  for (const player of Object.values(sleeperPlayers)) {
    if (!player.position) {
      continue;
    }
    const position = player.position.toUpperCase();
    const team = (player.team ?? player.team_abbr ?? "").toUpperCase();

    if (position === "DEF" && team) {
      defByTeam.set(team, player);
    }

    if (!player.full_name) {
      continue;
    }

    const normalized = normalizeName(player.full_name);
    const withoutSuffix = stripSuffix(normalized);

    const keys = [
      buildKey(normalized, position, team),
      buildKey(withoutSuffix, position, team),
      buildKey(normalized, position, ""),
      buildKey(withoutSuffix, position, ""),
    ];

    for (const key of keys) {
      const list = index.get(key) ?? new Map<string, SleeperPlayer>();
      list.set(player.player_id, player);
      index.set(key, list);
    }

  }

  const roster = await db
    .select({
      id: players.id,
      name: players.name,
      position: players.position,
      externalId: players.externalId,
      teamAbbreviation: nflTeams.abbreviation,
      teamName: nflTeams.name,
    })
    .from(players)
    .innerJoin(nflTeams, eq(players.nflTeamId, nflTeams.id));

  let updated = 0;
  let skipped = 0;
  let unmatched = 0;
  let ambiguous = 0;

  const unmatchedList: string[] = [];
  const ambiguousList: string[] = [];

  for (const player of roster) {
    if (player.externalId && !force) {
      skipped += 1;
      continue;
    }

    if (player.teamAbbreviation === "DRAFT" || player.teamAbbreviation === "FA") {
      skipped += 1;
      continue;
    }

    const position = player.position === "DST" ? "DEF" : player.position;
    const team = player.teamAbbreviation.toUpperCase();

    let match: SleeperPlayer | null = null;
    let wasAmbiguous = false;

    const manualKey = buildKey(normalizeName(player.name), position, team);
    const manualId = manualIdByKey.get(manualKey);
    if (manualId) {
      if (!dryRun) {
        await db.update(players).set({ externalId: manualId }).where(eq(players.id, player.id));
      }
      updated += 1;
      continue;
    }

    if (position === "DEF") {
      match = defByTeam.get(team) ?? null;
    } else {
      const normalized = normalizeName(player.name);
      const withoutSuffix = stripSuffix(normalized);
      const keys = [
        buildKey(normalized, position, team),
        buildKey(withoutSuffix, position, team),
        buildKey(normalized, position, ""),
        buildKey(withoutSuffix, position, ""),
      ];

      for (const key of keys) {
        const list = index.get(key);
        if (!list || list.size === 0) {
          continue;
        }
        if (list.size === 1) {
          match = Array.from(list.values())[0];
          break;
        }
        if (!match) {
          wasAmbiguous = true;
          ambiguous += 1;
          ambiguousList.push(`${player.name} (${player.teamAbbreviation})`);
          match = null;
          break;
        }
      }
    }

    if (!match) {
      if (!wasAmbiguous) {
        unmatched += 1;
        unmatchedList.push(`${player.name} (${player.teamAbbreviation})`);
      }
      continue;
    }

    if (!dryRun) {
      await db
        .update(players)
        .set({ externalId: match.player_id })
        .where(eq(players.id, player.id));
    }

    updated += 1;
  }

  console.log(`Sleeper ID mapping ${dryRun ? "dry run" : "complete"}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (existing/DRAFT/FA): ${skipped}`);
  console.log(`Unmatched: ${unmatched}`);
  console.log(`Ambiguous: ${ambiguous}`);

  if (unmatchedList.length) {
    console.log("Unmatched sample:", unmatchedList.slice(0, 20));
  }
  if (ambiguousList.length) {
    console.log("Ambiguous sample:", ambiguousList.slice(0, 20));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
