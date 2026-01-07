import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { adminSettingsSchema } from "@/lib/schemas";
import { getSetting, setSetting } from "@/lib/settings";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const entriesLocked = await getSetting("entries_locked", false);
  const currentRound = await getSetting("current_round", "Wildcard");
  const seasonYear = await getSetting("season_year", 2025);

  return NextResponse.json({ entriesLocked, currentRound, seasonYear });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = adminSettingsSchema.parse(await request.json());
    await setSetting("entries_locked", payload.entriesLocked);

    if (payload.currentRound) {
      await setSetting("current_round", payload.currentRound);
    }

    if (payload.seasonYear) {
      await setSetting("season_year", payload.seasonYear);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
