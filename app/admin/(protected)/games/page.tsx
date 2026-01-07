"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Game {
  id: string;
  round: "Wildcard" | "Divisional" | "Conference" | "SuperBowl";
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string;
  final: boolean;
  homeScore: number | null;
  awayScore: number | null;
}

interface Team {
  id: string;
  abbreviation: string;
}

const rounds = ["Wildcard", "Divisional", "Conference", "SuperBowl"] as const;

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState({
    round: "Wildcard" as Game["round"],
    homeTeamId: "",
    awayTeamId: "",
    kickoffAt: "",
    final: false,
    homeScore: "",
    awayScore: "",
  });

  useEffect(() => {
    Promise.all([fetch("/api/admin/games"), fetch("/api/admin/teams")])
      .then(async ([gameRes, teamRes]) => [await gameRes.json(), await teamRes.json()])
      .then(([gameData, teamData]) => {
        setGames(gameData);
        setTeams(teamData);
        if (teamData[0]) {
          setForm((prev) => ({ ...prev, homeTeamId: teamData[0].id, awayTeamId: teamData[0].id }));
        }
      });
  }, []);

  async function handleCreate() {
    try {
      const response = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          game: {
            round: form.round,
            homeTeamId: form.homeTeamId,
            awayTeamId: form.awayTeamId,
            kickoffAt: form.kickoffAt,
            final: form.final,
            homeScore: form.homeScore ? Number(form.homeScore) : null,
            awayScore: form.awayScore ? Number(form.awayScore) : null,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to create game");
      setGames((prev) => [...prev, data]);
      toast.success("Game added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create game");
    }
  }

  async function handleUpdate(game: Game) {
    try {
      const response = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", game }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to update game");
      setGames((prev) => prev.map((item) => (item.id === game.id ? data : item)));
      toast.success("Game updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function handleDelete(id: string) {
    try {
      const game = games.find((item) => item.id === id);
      if (!game) return;
      const response = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", game }),
      });
      if (!response.ok) throw new Error("Failed to delete game");
      setGames((prev) => prev.filter((item) => item.id !== id));
      toast.success("Game deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Admin</Badge>
        <h1 className="font-display text-4xl text-slate-900">Manage Games</h1>
        <p className="text-slate-600">Add playoff matchups and final scores.</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Add Game</CardTitle>
          <CardDescription>Create a playoff game entry.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Select value={form.round} onValueChange={(value) => setForm((prev) => ({ ...prev, round: value as Game["round"] }))}>
            <SelectTrigger>
              <SelectValue placeholder="Round" />
            </SelectTrigger>
            <SelectContent>
              {rounds.map((round) => (
                <SelectItem key={round} value={round}>
                  {round}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={form.homeTeamId} onValueChange={(value) => setForm((prev) => ({ ...prev, homeTeamId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Home team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.abbreviation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={form.awayTeamId} onValueChange={(value) => setForm((prev) => ({ ...prev, awayTeamId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Away team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.abbreviation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Kickoff ISO" value={form.kickoffAt} onChange={(event) => setForm((prev) => ({ ...prev, kickoffAt: event.target.value }))} />
          <Input placeholder="Home score" value={form.homeScore} onChange={(event) => setForm((prev) => ({ ...prev, homeScore: event.target.value }))} />
          <Input placeholder="Away score" value={form.awayScore} onChange={(event) => setForm((prev) => ({ ...prev, awayScore: event.target.value }))} />
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={form.final ? "yes" : "no"}
            onChange={(event) => setForm((prev) => ({ ...prev, final: event.target.value === "yes" }))}
          >
            <option value="no">Not Final</option>
            <option value="yes">Final</option>
          </select>
          <Button onClick={handleCreate}>Add Game</Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Games</CardTitle>
          <CardDescription>Update final scores and kickoff times.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Round</TableHead>
                <TableHead>Home</TableHead>
                <TableHead>Away</TableHead>
                <TableHead>Kickoff</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Final</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <TableRow key={game.id}>
                  <TableCell>
                    <Select value={game.round} onValueChange={(value) => setGames((prev) => prev.map((item) => (item.id === game.id ? { ...item, round: value as Game["round"] } : item)))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Round" />
                      </SelectTrigger>
                      <SelectContent>
                        {rounds.map((round) => (
                          <SelectItem key={round} value={round}>
                            {round}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={game.homeTeamId} onValueChange={(value) => setGames((prev) => prev.map((item) => (item.id === game.id ? { ...item, homeTeamId: value } : item)))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Home" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.abbreviation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={game.awayTeamId} onValueChange={(value) => setGames((prev) => prev.map((item) => (item.id === game.id ? { ...item, awayTeamId: value } : item)))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Away" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.abbreviation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input value={game.kickoffAt} onChange={(event) => setGames((prev) => prev.map((item) => (item.id === game.id ? { ...item, kickoffAt: event.target.value } : item)))} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Input
                        className="w-16"
                        value={game.homeScore ?? ""}
                        onChange={(event) => setGames((prev) => prev.map((item) => (item.id === game.id ? { ...item, homeScore: event.target.value ? Number(event.target.value) : null } : item)))}
                      />
                      <Input
                        className="w-16"
                        value={game.awayScore ?? ""}
                        onChange={(event) => setGames((prev) => prev.map((item) => (item.id === game.id ? { ...item, awayScore: event.target.value ? Number(event.target.value) : null } : item)))}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <select
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      value={game.final ? "yes" : "no"}
                      onChange={(event) =>
                        setGames((prev) => prev.map((item) => (item.id === game.id ? { ...item, final: event.target.value === "yes" } : item)))
                      }
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" onClick={() => handleUpdate(game)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(game.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
