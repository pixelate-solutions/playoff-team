import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyPoolCounter } from "@/components/money-pool-counter";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(entries);
  const entryCount = Number(count ?? 0);
  const moneyPool = entryCount * 100;

  return (
    <div className="container">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center gap-6">
          <Badge variant="secondary" className="w-fit">2025 NFL Playoff Fantasy Challenge</Badge>
          <h1 className="font-display text-5xl leading-tight text-slate-900 md:text-6xl">
            Draft one player per playoff team. Survive every round.
          </h1>
          <p className="text-lg text-slate-600">
            Every game is a knockout. When a team is eliminated, you lose that player. Build a roster that can
            survive from Wildcard Weekend to the Super Bowl and chase the biggest payout.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/create-entry">Create Your Team</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/leaderboard">View Leaderboard</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span>Entry Fee: $100</span>
            <span>70/15/10/5 payout split</span>
            <span>ESPN stat updates</span>
          </div>
          <Card className="glass-card mx-auto w-full lg:w-3/4 mt-4 lg:mt-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-700">Money Pool</CardTitle>
              <CardDescription>Live total based on entries.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 py-3 text-white">
                <span className="text-xs uppercase tracking-[0.2em]">Total Pot</span>
                <span className="font-display text-3xl">
                  <MoneyPoolCounter amount={moneyPool} />
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Based on {entryCount} teams.</p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Quick Snapshot</CardTitle>
              <CardDescription>Know the stakes before you draft.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
                <span className="text-sm uppercase tracking-[0.2em]">Entry Fee</span>
                <span className="font-display text-3xl">$100</span>
              </div>
              <div className="grid gap-3">
                {[
                  { label: "1st Place", value: "70%" },
                  { label: "2nd Place", value: "15%" },
                  { label: "3rd Place", value: "10%" },
                  { label: "Commissioner", value: "5%" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/60 bg-white/70 px-4 py-3">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="font-display text-2xl text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Roster Requirements</CardTitle>
              <CardDescription>14 total players, one per playoff team.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Quarterbacks</span>
                <span className="font-medium text-slate-900">4</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Running Backs</span>
                <span className="font-medium text-slate-900">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Wide Receivers</span>
                <span className="font-medium text-slate-900">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Flex (RB/WR/TE)</span>
                <span className="font-medium text-slate-900">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tight End</span>
                <span className="font-medium text-slate-900">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Kicker</span>
                <span className="font-medium text-slate-900">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Defense (DST)</span>
                <span className="font-medium text-slate-900">1</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
