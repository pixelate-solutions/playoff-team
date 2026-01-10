import { sql } from "drizzle-orm";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { getEntryWithRoster } from "@/lib/entries";
import { AdminScoreboardClient } from "@/app/admin/(protected)/admin-scoreboard-client";
import { getSetting } from "@/lib/settings";

export default async function AdminDashboard() {
  const entryList = await db
    .select({ id: entries.id })
    .from(entries)
    .orderBy(sql`${entries.totalPointsCached} DESC`);

  const entryDetails = await Promise.all(entryList.map((entry) => getEntryWithRoster(entry.id)));

  const entriesWithRoster = entryDetails
    .filter((detail) => detail !== null)
    .map((detail) => {
      const pointsByPlayer = new Map(detail!.playerPoints.map((player) => [player.playerId, player]));
      return {
        entryId: detail!.entry.id,
        teamName: detail!.entry.participantName,
        participantName: detail!.entry.participantName,
        email: detail!.entry.email,
        paid: detail!.entry.paid,
        totalPoints: detail!.totalPoints,
        roster: detail!.roster.map((player) => ({
          slot: player.slot,
          playerId: player.playerId,
          playerName: player.playerName,
          position: player.position,
          teamAbbreviation: player.teamAbbreviation,
          totalPoints: pointsByPlayer.get(player.playerId)?.totalPoints ?? 0,
          overridePoints: player.playoffOverridePoints ?? null,
        })),
      };
    });

  const currentRound = await getSetting("current_round", "Wildcard");
  const leaderboardLinksEnabled = await getSetting("leaderboard_links_enabled", true);
  const entriesLocked = await getSetting("entries_locked", false);

  return (
    <AdminScoreboardClient
      entries={entriesWithRoster}
      initialRound={currentRound as "Wildcard" | "Divisional" | "Conference" | "SuperBowl"}
      initialLeaderboardLinksEnabled={Boolean(leaderboardLinksEnabled)}
      initialEntriesLocked={Boolean(entriesLocked)}
    />
  );
}
