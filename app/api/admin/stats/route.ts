import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { playerGameStats } from "@/db/schema";
import { adminStatsSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");

  if (!gameId) {
    return NextResponse.json([]);
  }

  const stats = await db.query.playerGameStats.findMany({
    where: eq(playerGameStats.gameId, gameId),
  });

  return NextResponse.json(stats);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = adminStatsSchema.parse(await request.json());

    const existing = await db.query.playerGameStats.findFirst({
      where: and(eq(playerGameStats.playerId, payload.playerId), eq(playerGameStats.gameId, payload.gameId)),
    });

    if (existing) {
      const [record] = await db
        .update(playerGameStats)
        .set(payload)
        .where(eq(playerGameStats.id, existing.id))
        .returning();
      return NextResponse.json(record);
    }

    const [record] = await db.insert(playerGameStats).values(payload).returning();
    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
