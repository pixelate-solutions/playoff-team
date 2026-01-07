import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { fetchEspnPlayoffStats, fetchEspnStats } from "@/lib/espn";
import { replaceNormalizedStats } from "@/lib/statsImport";

const requestSchema = z
  .object({
    seasonYear: z.coerce.number().int().optional(),
    mode: z.enum(["playoff", "regular"]).default("playoff"),
    rounds: z.array(z.enum(["Wildcard", "Divisional", "Conference", "SuperBowl"])).optional(),
    weeks: z.array(z.coerce.number().int().min(1).max(18)).optional(),
  })
  .refine(
    (data) => (data.mode === "playoff" ? Boolean(data.rounds?.length) : Boolean(data.weeks?.length)),
    "Playoff mode requires rounds; regular mode requires weeks."
  );

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const now = new Date();
  const defaultSeasonYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  let seasonYear: number | undefined;
  let rounds: Array<"Wildcard" | "Divisional" | "Conference" | "SuperBowl"> | undefined;
  let weeks: number[] | undefined;
  let mode: "playoff" | "regular" = "playoff";
  if (payload !== null) {
    const parsed = requestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    seasonYear = parsed.data.seasonYear ?? defaultSeasonYear;
    rounds = parsed.data.rounds;
    weeks = parsed.data.weeks;
    mode = parsed.data.mode;
  }

  try {
    if (!seasonYear) {
      seasonYear = defaultSeasonYear;
    }

    const stats =
      mode === "regular"
        ? (
            await Promise.all(
              Array.from(new Set(weeks ?? []))
                .sort((a, b) => a - b)
                .map((selectedWeek) =>
                  fetchEspnStats({
                    seasonYear: seasonYear || defaultSeasonYear,
                    week: selectedWeek,
                    seasonType: "regular",
                  })
                )
            )
          ).flat()
        : (
            await Promise.all(
              Array.from(new Set(rounds ?? [])).map((selectedRound) =>
                fetchEspnPlayoffStats({
                  seasonYear: seasonYear || defaultSeasonYear,
                  round: selectedRound,
                })
              )
            )
          ).flat();

    await replaceNormalizedStats(stats);

    return NextResponse.json({
      ok: true,
      importedCount: stats.length,
      source: "espn",
      message: stats.length ? undefined : "No stats returned for the selected weeks or rounds.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    return NextResponse.json({
      ok: false,
      message: "ESPN fetch failed.",
      error: message,
    });
  }
}
