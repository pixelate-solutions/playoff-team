import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminLeaderboardPage() {
  const leaderboard = await db
    .select({
      id: entries.id,
      participantName: entries.participantName,
      email: entries.email,
      paid: entries.paid,
      totalPointsCached: entries.totalPointsCached,
    })
    .from(entries)
    .orderBy(sql`${entries.totalPointsCached} DESC`);

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Admin</Badge>
        <h1 className="font-display text-4xl text-slate-900">Leaderboard</h1>
        <p className="text-slate-600">Full standings with entry details.</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Entries</CardTitle>
          <CardDescription>Click an entry to edit roster and payment status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Link href={`/admin/entries/${entry.id}`} className="font-medium text-slate-900 hover:underline">
                      {entry.participantName}
                    </Link>
                  </TableCell>
                  <TableCell>{entry.email}</TableCell>
                  <TableCell>{Number(entry.totalPointsCached).toFixed(2)}</TableCell>
                  <TableCell>{entry.paid ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
