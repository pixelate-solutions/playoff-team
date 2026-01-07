"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRoundLabelShort, sortRoundLabels } from "@/lib/rounds";
import { sortRosterBySlot } from "@/lib/roster";

type EntryResponse = {
  entry: {
    id: string;
    teamName: string;
    participantName: string;
    email: string;
    totalPointsCached: string | number;
  };
  roster: {
    slot: string;
    playerId: string;
    playerName: string;
    position: string;
    teamAbbreviation: string;
  }[];
  playerPoints: {
    playerId: string;
    totalPoints: number;
    byRound: Record<string, number>;
    override: boolean;
  }[];
  totalPoints: number;
};

export function MyEntryClient() {
  const searchParams = useSearchParams();
  const [entryId, setEntryId] = useState<string | null>(null);
  const [data, setData] = useState<EntryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    const queryId = searchParams.get("entryId");
    if (queryId) {
      setEntryId(queryId);
      localStorage.setItem("entryId", queryId);
      return;
    }

    const stored = localStorage.getItem("entryId");
    if (stored) {
      setEntryId(stored);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!entryId) return;
    setLoading(true);
    fetch(`/api/entries/${entryId}`)
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error ?? "Entry not found");
        }
        setData(payload);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [entryId]);

  const pointsByPlayer = useMemo(() => {
    const map = new Map<string, EntryResponse["playerPoints"][number]>();
    data?.playerPoints.forEach((player) => map.set(player.playerId, player));
    return map;
  }, [data]);

  const sortedRoster = useMemo(() => {
    return data ? sortRosterBySlot(data.roster) : [];
  }, [data]);

  const roundTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    data?.playerPoints.forEach((player) => {
      Object.entries(player.byRound).forEach(([round, points]) => {
        totals[round] = (totals[round] ?? 0) + points;
      });
    });
    return totals;
  }, [data]);

  const roundLabels = useMemo(() => {
    if (!data) return [];
    const labels = new Set<string>();
    data.playerPoints.forEach((player) => {
      Object.keys(player.byRound).forEach((label) => labels.add(label));
    });
    return sortRoundLabels(Array.from(labels));
  }, [data]);

  async function handleLookup() {
    setLookupLoading(true);
    try {
      const response = await fetch("/api/entries/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lookupEmail }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Entry not found");
      }
      setEntryId(payload.id);
      localStorage.setItem("entryId", payload.id);
      const url = new URL(window.location.href);
      url.searchParams.set("entryId", payload.id);
      window.history.replaceState(null, "", url.toString());
      toast.success(`Entry found: ${payload.teamName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lookup failed");
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <div className="container space-y-8">
      <div className="space-y-2">
        <Badge variant="secondary">My Roster</Badge>
        <h1 className="font-display text-4xl text-slate-900">Roster & Live Scoring</h1>
        <p className="text-slate-600">Track your player pool as the playoffs unfold.</p>
      </div>

      {!entryId && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Find My Roster</CardTitle>
            <CardDescription>Enter the email you used to create your entry.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="you@example.com"
              value={lookupEmail}
              onChange={(event) => setLookupEmail(event.target.value)}
            />
            <Button onClick={handleLookup} disabled={!lookupEmail || lookupLoading}>
              {lookupLoading ? "Looking up..." : "Find Entry"}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-slate-500">Loading your roster...</p>}

      {!loading && entryId && !data && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Find My Roster</CardTitle>
            <CardDescription>Use the email you entered when creating your roster.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="you@example.com"
              value={lookupEmail}
              onChange={(event) => setLookupEmail(event.target.value)}
            />
            <Button onClick={handleLookup} disabled={!lookupEmail || lookupLoading}>
              {lookupLoading ? "Looking up..." : "Find Entry"}
            </Button>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{data.entry.teamName}</CardTitle>
              <CardDescription>{data.entry.participantName} - {data.entry.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slot</TableHead>
                    <TableHead>Player</TableHead>
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
                          <div className="text-xs text-slate-500">{player.teamAbbreviation}</div>
                          {roundLine && <div className="text-[11px] text-slate-400">{roundLine}</div>}
                        </TableCell>
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
                <CardDescription>Updated after every stat entry.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-display text-slate-900">{data.totalPoints.toFixed(2)}</div>
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
      )}
    </div>
  );
}
