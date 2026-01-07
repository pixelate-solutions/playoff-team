import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { players } from "@/db/schema";
import { adminPlayerSchema } from "@/lib/schemas";
import { z } from "zod";

const payloadSchema = z.object({
  action: z.enum(["create", "update", "delete"]),
  player: adminPlayerSchema,
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const roster = await db.query.players.findMany();
  return NextResponse.json(roster);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = payloadSchema.parse(await request.json());
    const overrideValue =
      payload.player.playoffOverridePoints === null || payload.player.playoffOverridePoints === undefined
        ? payload.player.playoffOverridePoints
        : String(payload.player.playoffOverridePoints);
    const playerValues = {
      name: payload.player.name,
      position: payload.player.position,
      nflTeamId: payload.player.nflTeamId,
      isActive: payload.player.isActive,
      notes: payload.player.notes ?? null,
      externalId: payload.player.externalId ?? null,
      playoffOverridePoints: overrideValue,
    } satisfies typeof players.$inferInsert;

    if (payload.action === "create") {
      const [player] = await db
        .insert(players)
        .values(playerValues)
        .returning();
      return NextResponse.json(player);
    }

    if (payload.action === "update") {
      if (!payload.player.id) {
        return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
      }
      const [player] = await db
        .update(players)
        .set(playerValues)
        .where(eq(players.id, payload.player.id))
        .returning();
      return NextResponse.json(player);
    }

    if (!payload.player.id) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
    }
    await db.delete(players).where(eq(players.id, payload.player.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
