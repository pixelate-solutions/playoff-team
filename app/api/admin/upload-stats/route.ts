import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { importNormalizedStats, type NormalizedStat, playoffRounds } from "@/lib/statsImport";

export const runtime = "nodejs";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function toNumber(value: string | undefined) {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing CSV file" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length <= 1) {
    return NextResponse.json({ error: "CSV appears empty" }, { status: 400 });
  }

  const header = rows[0].map((value) => value.trim().toLowerCase());
  const stats: NormalizedStat[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row.length) continue;
    const map: Record<string, string> = {};
    header.forEach((key, idx) => {
      map[key] = (row[idx] ?? "").trim();
    });

    const round = map["round"] as NormalizedStat["round"];
    if (!playoffRounds.includes(round)) {
      continue;
    }

    const gameKey = map["game_key"];
    if (!gameKey) {
      continue;
    }

    const kickoffAt = map["kickoff_at"] || new Date().toISOString();

    stats.push({
      externalPlayerId: map["external_player_id"] || undefined,
      playerName: map["player_name"] || undefined,
      teamAbbr: map["team_abbr"] || undefined,
      position: map["position"] || undefined,
      round,
      gameKey,
      kickoffAt,
      passingYards: toNumber(map["passing_yards"]),
      passingTds: toNumber(map["passing_tds"]),
      passingTwoPt: toNumber(map["passing_two_pt"]),
      rushingYards: toNumber(map["rushing_yards"]),
      rushingTds: toNumber(map["rushing_tds"]),
      rushingTwoPt: toNumber(map["rushing_two_pt"]),
      receivingYards: toNumber(map["receiving_yards"]),
      receivingTds: toNumber(map["receiving_tds"]),
      receivingTwoPt: toNumber(map["receiving_two_pt"]),
      receptions: toNumber(map["receptions"]),
      fg0_39: toNumber(map["fg0_39"]),
      fg40_49: toNumber(map["fg40_49"]),
      fg50_59: toNumber(map["fg50_59"]),
      fg60Plus: toNumber(map["fg60_plus"]),
      xpMade: toNumber(map["xp_made"]),
      interceptions: toNumber(map["interceptions"]),
      sacks: toNumber(map["sacks"]),
      safeties: toNumber(map["safeties"]),
      fumbleRecoveries: toNumber(map["fumble_recoveries"]),
      returnTds: toNumber(map["return_tds"]),
      fum2pk: toNumber(map["fum2pk"]),
      fum2pt: toNumber(map["fum2pt"]),
      int2pk: toNumber(map["int2pk"]),
      int2pt: toNumber(map["int2pt"]),
    });
  }

  if (!stats.length) {
    return NextResponse.json({ error: "No valid stat rows found in CSV." }, { status: 400 });
  }

  await importNormalizedStats(stats);

  return NextResponse.json({ ok: true, importedCount: stats.length, source: "csv" });
}
