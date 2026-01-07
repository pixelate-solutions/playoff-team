import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { nflTeams } from "@/db/schema";
import { adminTeamSchema } from "@/lib/schemas";
import { z } from "zod";

const payloadSchema = z.object({
  action: z.enum(["create", "update", "delete"]),
  team: adminTeamSchema,
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const teams = await db.query.nflTeams.findMany();
  return NextResponse.json(teams);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = payloadSchema.parse(await request.json());

    if (payload.action === "create") {
      const [team] = await db.insert(nflTeams).values(payload.team).returning();
      return NextResponse.json(team);
    }

    if (payload.action === "update") {
      if (!payload.team.id) {
        return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
      }
      const [team] = await db
        .update(nflTeams)
        .set(payload.team)
        .where(eq(nflTeams.id, payload.team.id))
        .returning();
      return NextResponse.json(team);
    }

    if (!payload.team.id) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }
    await db.delete(nflTeams).where(eq(nflTeams.id, payload.team.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
