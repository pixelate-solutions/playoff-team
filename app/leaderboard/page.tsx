import { getLeaderboard } from "@/lib/entries";
import { LeaderboardClient } from "@/app/leaderboard/leaderboard-client";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard(null);
  return <LeaderboardClient initialData={leaderboard} />;
}
