import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { nflTeams, players } from "@/db/schema";
import { CreateEntryClient } from "@/app/create-entry/create-entry-client";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function CreateEntryPage() {
  const teamList = await db.query.nflTeams.findMany({
    where: eq(nflTeams.madePlayoffs, true),
  });
  const roster = await db
    .select({
      id: players.id,
      name: players.name,
      position: players.position,
      nflTeamId: players.nflTeamId,
      teamName: nflTeams.name,
      teamAbbreviation: nflTeams.abbreviation,
    })
    .from(players)
    .innerJoin(nflTeams, eq(players.nflTeamId, nflTeams.id))
    .where(and(eq(nflTeams.madePlayoffs, true), eq(players.isActive, true)));

  const entriesLocked = await getSetting("entries_locked", false);

  return <CreateEntryClient players={roster} teams={teamList} entriesLocked={Boolean(entriesLocked)} />;
}
