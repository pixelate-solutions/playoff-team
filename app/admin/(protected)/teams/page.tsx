"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  conference: "AFC" | "NFC";
  seed: number | null;
  madePlayoffs: boolean;
  eliminatedRound: string | null;
  externalId: string | null;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState({
    name: "",
    abbreviation: "",
    conference: "AFC" as "AFC" | "NFC",
    seed: "",
    madePlayoffs: false,
    eliminatedRound: "",
    externalId: "",
  });

  useEffect(() => {
    fetch("/api/admin/teams")
      .then((res) => res.json())
      .then((payload) => setTeams(payload));
  }, []);

  async function handleCreate() {
    try {
      const response = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          team: {
            name: form.name,
            abbreviation: form.abbreviation,
            conference: form.conference,
            seed: form.seed ? Number(form.seed) : null,
            madePlayoffs: form.madePlayoffs,
            eliminatedRound: form.eliminatedRound || null,
            externalId: form.externalId || null,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to create team");

      setTeams((prev) => [...prev, data]);
      setForm({ name: "", abbreviation: "", conference: "AFC", seed: "", madePlayoffs: false, eliminatedRound: "", externalId: "" });
      toast.success("Team added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create team");
    }
  }

  async function handleUpdate(team: Team) {
    try {
      const response = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", team }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to update team");

      setTeams((prev) => prev.map((item) => (item.id === team.id ? data : item)));
      toast.success("Team updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function handleDelete(id: string) {
    try {
      const team = teams.find((item) => item.id === id);
      if (!team) return;
      const response = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", team }),
      });
      if (!response.ok) throw new Error("Failed to delete team");
      setTeams((prev) => prev.filter((item) => item.id !== id));
      toast.success("Team deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Admin</Badge>
        <h1 className="font-display text-4xl text-slate-900">Manage Teams</h1>
        <p className="text-slate-600">Set playoff seeds and elimination rounds.</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Add Team</CardTitle>
          <CardDescription>Insert a new NFL team.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Team name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          <Input placeholder="Abbrev" value={form.abbreviation} onChange={(event) => setForm((prev) => ({ ...prev, abbreviation: event.target.value }))} />
          <Select value={form.conference} onValueChange={(value) => setForm((prev) => ({ ...prev, conference: value as "AFC" | "NFC" }))}>
            <SelectTrigger>
              <SelectValue placeholder="Conference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AFC">AFC</SelectItem>
              <SelectItem value="NFC">NFC</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Seed" value={form.seed} onChange={(event) => setForm((prev) => ({ ...prev, seed: event.target.value }))} />
          <Input placeholder="Eliminated round" value={form.eliminatedRound} onChange={(event) => setForm((prev) => ({ ...prev, eliminatedRound: event.target.value }))} />
          <Input placeholder="External ID" value={form.externalId} onChange={(event) => setForm((prev) => ({ ...prev, externalId: event.target.value }))} />
          <Button onClick={handleCreate}>Add Team</Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>Edit seeds, playoff status, and elimination rounds.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Abbrev</TableHead>
                <TableHead>Conf</TableHead>
                <TableHead>Seed</TableHead>
                <TableHead>Playoffs</TableHead>
                <TableHead>Elim Round</TableHead>
                <TableHead>External ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <Input value={team.name} onChange={(event) => setTeams((prev) => prev.map((item) => (item.id === team.id ? { ...item, name: event.target.value } : item)))} />
                  </TableCell>
                  <TableCell>
                    <Input value={team.abbreviation} onChange={(event) => setTeams((prev) => prev.map((item) => (item.id === team.id ? { ...item, abbreviation: event.target.value } : item)))} />
                  </TableCell>
                  <TableCell>
                    <Select value={team.conference} onValueChange={(value) => setTeams((prev) => prev.map((item) => (item.id === team.id ? { ...item, conference: value as "AFC" | "NFC" } : item)))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Conference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AFC">AFC</SelectItem>
                        <SelectItem value="NFC">NFC</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input value={team.seed ?? ""} onChange={(event) => setTeams((prev) => prev.map((item) => (item.id === team.id ? { ...item, seed: event.target.value ? Number(event.target.value) : null } : item)))} />
                  </TableCell>
                  <TableCell>
                    <select
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      value={team.madePlayoffs ? "yes" : "no"}
                      onChange={(event) => setTeams((prev) => prev.map((item) => (item.id === team.id ? { ...item, madePlayoffs: event.target.value === "yes" } : item)))}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input value={team.eliminatedRound ?? ""} onChange={(event) => setTeams((prev) => prev.map((item) => (item.id === team.id ? { ...item, eliminatedRound: event.target.value } : item)))} />
                  </TableCell>
                  <TableCell>
                    <Input value={team.externalId ?? ""} onChange={(event) => setTeams((prev) => prev.map((item) => (item.id === team.id ? { ...item, externalId: event.target.value } : item)))} />
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" onClick={() => handleUpdate(team)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(team.id)}>Delete</Button>
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
