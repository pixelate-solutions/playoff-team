import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { games } from "@/db/schema";
import { adminGameSchema } from "@/lib/schemas";
import { z } from "zod";

const payloadSchema = z.object({
  action: z.enum(["create", "update", "delete"]),
  game: adminGameSchema,
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const gameList = await db.query.games.findMany();
  return NextResponse.json(gameList);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = payloadSchema.parse(await request.json());
    const kickoffAt = new Date(payload.game.kickoffAt);

    if (payload.action === "create") {
      const [game] = await db
        .insert(games)
        .values({
          ...payload.game,
          kickoffAt,
        })
        .returning();
      return NextResponse.json(game);
    }

    if (payload.action === "update") {
      if (!payload.game.id) {
        return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
      }
      const [game] = await db
        .update(games)
        .set({
          ...payload.game,
          kickoffAt,
        })
        .where(eq(games.id, payload.game.id))
        .returning();
      return NextResponse.json(game);
    }

    if (!payload.game.id) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }
    await db.delete(games).where(eq(games.id, payload.game.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
