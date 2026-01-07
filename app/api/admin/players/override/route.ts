import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { players } from "@/db/schema";
import { adminPlayerOverrideSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = adminPlayerOverrideSchema.parse(await request.json());

    const overrideValue =
      payload.playoffOverridePoints === null ? null : String(payload.playoffOverridePoints);

    const [updated] = await db
      .update(players)
      .set({ playoffOverridePoints: overrideValue })
      .where(eq(players.id, payload.playerId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, player: updated });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
