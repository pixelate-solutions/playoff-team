import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { entries, entryPlayers, nflTeams, players } from "@/db/schema";
import { createEntrySchema } from "@/lib/schemas";
import { validateRoster } from "@/lib/roster";
import { getSetting } from "@/lib/settings";

export async function POST(request: Request) {
  try {
    const payload = createEntrySchema.parse(await request.json());

    const entriesLocked = await getSetting("entries_locked", false);
    if (entriesLocked) {
      return NextResponse.json({ error: "Entries are locked." }, { status: 403 });
    }

    const existingEntry = await db.query.entries.findFirst({\n+      where: eq(entries.email, payload.email),\n+    });\n+\n+    if (existingEntry) {\n+      return NextResponse.json({ error: \"That email already has an entry.\" }, { status: 409 });\n+    }\n+\n+    const slotSet = new Set(payload.roster.map((item) => item.slot));
    if (slotSet.size !== payload.roster.length) {
      return NextResponse.json({ error: "Roster slots must be unique." }, { status: 400 });
    }

    const playerIds = payload.roster.map((item) => item.playerId);
    const dbPlayers = await db
      .select({
        id: players.id,
        position: players.position,
        nflTeamId: players.nflTeamId,
        madePlayoffs: nflTeams.madePlayoffs,
        isActive: players.isActive,
      })
      .from(players)
      .innerJoin(nflTeams, eq(players.nflTeamId, nflTeams.id))
      .where(inArray(players.id, playerIds));

    if (dbPlayers.length !== payload.roster.length) {
      return NextResponse.json({ error: "One or more players were not found." }, { status: 400 });
    }

    const rosterPlayers = payload.roster.map((slot) => {
      const player = dbPlayers.find((item) => item.id === slot.playerId);
      if (!player) {
        throw new Error("Player not found");
      }

      if (!player.madePlayoffs) {
        throw new Error("Roster can only include playoff teams.");
      }

      if (!player.isActive) {
        throw new Error("Roster cannot include inactive players.");
      }

      if (slot.slot !== "FLEX" && !slot.slot.startsWith(player.position)) {
        throw new Error(`Slot ${slot.slot} does not match ${player.position}.`);
      }

      if (slot.slot === "FLEX" && !["RB", "WR", "TE"].includes(player.position)) {
        throw new Error("Flex slot must be RB, WR, or TE.");
      }

      return {
        playerId: player.id,
        position: player.position,
        nflTeamId: player.nflTeamId,
      };
    });

    const validation = validateRoster(rosterPlayers);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
    }

    const [entry] = await db
      .insert(entries)
      .values({
        teamName: payload.teamName,
        participantName: payload.participantName,
        email: payload.email,
      })
      .returning();

    await db.insert(entryPlayers).values(
      payload.roster.map((slot) => ({
        entryId: entry.id,
        playerId: slot.playerId,
        slot: slot.slot,
      }))
    );

    return NextResponse.json({ id: entry.id });
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes("entries_email_unique") || message.includes("duplicate key")) {
        return NextResponse.json({ error: "That email already has an entry." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
