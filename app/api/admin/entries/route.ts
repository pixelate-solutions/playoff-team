import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { entries, entryPlayers } from "@/db/schema";
import { adminEntryUpdateSchema, adminRosterUpdateSchema } from "@/lib/schemas";
import { z } from "zod";

const payloadSchema = z.object({
  action: z.enum(["togglePaid", "updateRoster", "delete", "updateEntry"]),
  entryId: z.string().uuid(),
  paid: z.boolean().optional(),
  rosterUpdate: adminRosterUpdateSchema.optional(),
  entryUpdate: adminEntryUpdateSchema.optional(),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const allEntries = await db.query.entries.findMany();
  return NextResponse.json(allEntries);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = payloadSchema.parse(await request.json());

    if (payload.action === "togglePaid") {
      const [entry] = await db
        .update(entries)
        .set({ paid: payload.paid ?? false })
        .where(eq(entries.id, payload.entryId))
        .returning();
      return NextResponse.json(entry);
    }

    if (payload.action === "delete") {
      await db.delete(entryPlayers).where(eq(entryPlayers.entryId, payload.entryId));
      await db.delete(entries).where(eq(entries.id, payload.entryId));
      return NextResponse.json({ ok: true });
    }

    if (payload.action === "updateEntry") {
      if (!payload.entryUpdate) {
        return NextResponse.json({ error: "Entry update is required" }, { status: 400 });
      }
      const update = payload.entryUpdate;
      const fullName = `${update.firstName ?? ""} ${update.lastName ?? ""}`.trim();
      const [entry] = await db
        .update(entries)
        .set({
          teamName: fullName || undefined,
          participantName: fullName || undefined,
          email: update.email ?? undefined,
        })
        .where(eq(entries.id, update.entryId))
        .returning();
      return NextResponse.json(entry);
    }

    if (!payload.rosterUpdate) {
      return NextResponse.json({ error: "Roster update is required" }, { status: 400 });
    }

    const update = payload.rosterUpdate;

    if (update.action === "remove") {
      await db.delete(entryPlayers).where(and(eq(entryPlayers.entryId, update.entryId), eq(entryPlayers.playerId, update.playerId)));
      return NextResponse.json({ ok: true });
    }

    await db
      .delete(entryPlayers)
      .where(and(eq(entryPlayers.entryId, update.entryId), eq(entryPlayers.slot, update.slot)));

    const [record] = await db
      .insert(entryPlayers)
      .values({
        entryId: update.entryId,
        playerId: update.playerId,
        slot: update.slot,
      })
      .returning();

    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
