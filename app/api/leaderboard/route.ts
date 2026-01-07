import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/entries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const round = searchParams.get("round");
  const leaderboard = await getLeaderboard(round);
  return NextResponse.json(leaderboard);
}
