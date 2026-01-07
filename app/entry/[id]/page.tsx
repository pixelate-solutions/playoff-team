import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEntryWithRoster } from "@/lib/entries";
import { formatRoundLabelShort, sortRoundLabels } from "@/lib/rounds";
import { sortRosterBySlot } from "@/lib/roster";

export const dynamic = "force-dynamic";

export default async function EntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getEntryWithRoster(id);

  if (!entry) {
    notFound();
  }

  const pointsByPlayer = new Map(entry.playerPoints.map((player) => [player.playerId, player]));
  const sortedRoster = sortRosterBySlot(entry.roster);
  const roundTotals: Record<string, number> = {};

  entry.playerPoints.forEach((player) => {
    Object.entries(player.byRound).forEach(([round, points]) => {
      roundTotals[round] = (roundTotals[round] ?? 0) + points;
    });
  });

  const roundLabels = sortRoundLabels(Array.from(new Set(Object.keys(roundTotals))));

  return (
    <div className="container space-y-8">
      <div className="space-y-2">
        <Badge variant="secondary">Entry</Badge>
        <h1 className="font-display text-4xl text-slate-900">{entry.entry.participantName}</h1>
        <p className="text-slate-600">{entry.entry.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Roster</CardTitle>
            <CardDescription>Player list with round totals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slot</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Pos</TableHead>
                  <TableHead>Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRoster.map((player) => {
                  const points = pointsByPlayer.get(player.playerId);
                  const roundLine = points
                    ? roundLabels
                        .map(
                          (round) => `${formatRoundLabelShort(round)} ${points.byRound[round]?.toFixed(2) ?? "0.00"}`
                        )
                        .join(" | ")
                    : null;
                  return (
                    <TableRow key={player.playerId}>
                      <TableCell>{player.slot}</TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{player.playerName}</div>
                        {roundLine && <div className="text-[11px] text-slate-400">{roundLine}</div>}
                      </TableCell>
                      <TableCell>{player.teamAbbreviation}</TableCell>
                      <TableCell>{player.position}</TableCell>
                      <TableCell>{points?.totalPoints.toFixed(2) ?? "0.00"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Total Points</CardTitle>
              <CardDescription>Updated after score entries.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-display text-slate-900">{entry.totalPoints.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Scoring Breakdown</CardTitle>
              <CardDescription>Points by week or playoff round.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              {roundLabels.length ? (
                roundLabels.map((round) => (
                  <div key={round} className="flex items-center justify-between">
                    <span>{round}</span>
                    <span className="font-medium text-slate-900">{(roundTotals[round] ?? 0).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No stats yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
