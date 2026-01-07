"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Player {
  id: string;
  name: string;
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST";
  nflTeamId: string;
  isActive: boolean;
  notes: string | null;
  playoffOverridePoints: string | number | null;
  externalId: string | null;
}

interface Team {
  id: string;
  name: string;
  abbreviation: string;
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [form, setForm] = useState({
    name: "",
    position: "QB" as Player["position"],
    nflTeamId: "",
    isActive: true,
    notes: "",
    playoffOverridePoints: "",
    externalId: "",
  });

  useEffect(() => {
    Promise.all([fetch("/api/admin/players"), fetch("/api/admin/teams")])
      .then(async ([playerRes, teamRes]) => [await playerRes.json(), await teamRes.json()])
      .then(([playerData, teamData]) => {
        setPlayers(playerData);
        setTeams(teamData);
        if (teamData[0]) {
          setForm((prev) => ({ ...prev, nflTeamId: teamData[0].id }));
        }
      });
  }, []);

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      if (filterTeam !== "all" && player.nflTeamId !== filterTeam) return false;
      if (filterPosition !== "all" && player.position !== filterPosition) return false;
      return true;
    });
  }, [players, filterTeam, filterPosition]);

  async function handleCreate() {
    try {
      const response = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          player: {
            name: form.name,
            position: form.position,
            nflTeamId: form.nflTeamId,
            isActive: form.isActive,
            notes: form.notes || null,
            playoffOverridePoints: form.playoffOverridePoints ? Number(form.playoffOverridePoints) : null,
            externalId: form.externalId || null,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to create player");
      setPlayers((prev) => [...prev, data]);
      setForm((prev) => ({ ...prev, name: "", notes: "", playoffOverridePoints: "", externalId: "" }));
      toast.success("Player added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create player");
    }
  }

  async function handleUpdate(player: Player) {
    try {
      const normalized = {
        ...player,
        playoffOverridePoints:
          player.playoffOverridePoints === null || player.playoffOverridePoints === ""
            ? null
            : Number(player.playoffOverridePoints),
        externalId: player.externalId ?? null,
      };
      const response = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", player: normalized }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to update player");
      setPlayers((prev) => prev.map((item) => (item.id === player.id ? data : item)));
      toast.success("Player updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function handleDelete(id: string) {
    try {
      const player = players.find((item) => item.id === id);
      if (!player) return;
      const response = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", player }),
      });
      if (!response.ok) throw new Error("Failed to delete player");
      setPlayers((prev) => prev.filter((item) => item.id !== id));
      toast.success("Player deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Admin</Badge>
        <h1 className="font-display text-4xl text-slate-900">Manage Players</h1>
        <p className="text-slate-600">CRUD for NFL players by team and position.</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Add Player</CardTitle>
          <CardDescription>Include playoff override points if needed.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Player name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          <Select value={form.position} onValueChange={(value) => setForm((prev) => ({ ...prev, position: value as Player["position"] }))}>
            <SelectTrigger>
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              {(["QB", "RB", "WR", "TE", "K", "DST"] as const).map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {pos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={form.nflTeamId} onValueChange={(value) => setForm((prev) => ({ ...prev, nflTeamId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.abbreviation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Notes" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
          <Input placeholder="Playoff override points" value={form.playoffOverridePoints} onChange={(event) => setForm((prev) => ({ ...prev, playoffOverridePoints: event.target.value }))} />
          <Input placeholder="External ID" value={form.externalId} onChange={(event) => setForm((prev) => ({ ...prev, externalId: event.target.value }))} />
          <Button onClick={handleCreate} disabled={!form.name || !form.nflTeamId}>Add Player</Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Players</CardTitle>
          <CardDescription>Filter and edit roster pool.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.abbreviation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All positions</SelectItem>
                {(["QB", "RB", "WR", "TE", "K", "DST"] as const).map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Pos</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Override</TableHead>
                <TableHead>External ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    <Input value={player.name} onChange={(event) => setPlayers((prev) => prev.map((item) => (item.id === player.id ? { ...item, name: event.target.value } : item)))} />
                  </TableCell>
                  <TableCell>
                    <Select value={player.position} onValueChange={(value) => setPlayers((prev) => prev.map((item) => (item.id === player.id ? { ...item, position: value as Player["position"] } : item)))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Position" />
                      </SelectTrigger>
                      <SelectContent>
                        {(["QB", "RB", "WR", "TE", "K", "DST"] as const).map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={player.nflTeamId} onValueChange={(value) => setPlayers((prev) => prev.map((item) => (item.id === player.id ? { ...item, nflTeamId: value } : item)))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Team" />
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
                    <Input
                      value={player.playoffOverridePoints ?? ""}
                      onChange={(event) =>
                        setPlayers((prev) =>
                          prev.map((item) =>
                            item.id === player.id ? { ...item, playoffOverridePoints: event.target.value } : item
                          )
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={player.externalId ?? ""}
                      onChange={(event) =>
                        setPlayers((prev) =>
                          prev.map((item) =>
                            item.id === player.id ? { ...item, externalId: event.target.value } : item
                          )
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" onClick={() => handleUpdate(player)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(player.id)}>Delete</Button>
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
