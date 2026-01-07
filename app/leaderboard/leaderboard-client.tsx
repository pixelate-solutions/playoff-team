"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type LeaderboardItem = {
  id: string;
  teamName: string;
  participantName: string;
  paid: boolean;
  totalPoints: number;
};

export function LeaderboardClient({
  initialData,
  linksEnabled,
}: {
  initialData: LeaderboardItem[];
  linksEnabled: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const [sortDesc, setSortDesc] = useState(true);

  const data = useMemo(() => {
    const sorted = [...initialData].sort((a, b) => (sortDesc ? b.totalPoints - a.totalPoints : a.totalPoints - b.totalPoints));
    return showAll ? sorted : sorted.slice(0, 10);
  }, [initialData, showAll, sortDesc]);

  return (
    <div className="container space-y-8">
      <div className="space-y-2">
        <Badge variant="secondary">Leaderboard</Badge>
        <h1 className="font-display text-4xl text-slate-900">Playoff Rankings</h1>
        <p className="text-slate-600">Every entry, every point, one leaderboard.</p>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Current Standings</CardTitle>
            <CardDescription>Sorted by total points.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setSortDesc((prev) => !prev)}>
              Sort {sortDesc ? "DESC" : "ASC"}
            </Button>
            <Button variant="secondary" onClick={() => setShowAll((prev) => !prev)}>
              {showAll ? "Show Top 10" : "Show All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="hidden md:table-cell">Participant</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="hidden md:table-cell">Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((entry, index) => (
                <TableRow key={entry.id}>
                  <TableCell>#{index + 1}</TableCell>
                  <TableCell>
                    {linksEnabled ? (
                      <Link className="font-medium text-slate-900 hover:underline" href={`/entry/${entry.id}`}>
                        {entry.participantName}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-900">{entry.participantName}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{entry.participantName}</TableCell>
                  <TableCell>{entry.totalPoints.toFixed(2)}</TableCell>
                  <TableCell className="hidden md:table-cell">{entry.paid ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
