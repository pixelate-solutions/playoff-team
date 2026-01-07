import { getLeaderboard } from "@/lib/entries";
import { LeaderboardClient } from "@/app/leaderboard/leaderboard-client";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard(null);
  const leaderboardLinksEnabled = await getSetting("leaderboard_links_enabled", true);
  return <LeaderboardClient initialData={leaderboard} linksEnabled={Boolean(leaderboardLinksEnabled)} />;
}
