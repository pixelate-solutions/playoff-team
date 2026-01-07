"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { entrySlotOrder, sortRosterBySlot } from "@/lib/roster";

interface EntryResponse {
  entry: {
    id: string;
    teamName: string;
    participantName: string;
    email: string;
    paid: boolean;
  };
  roster: {
    slot: string;
    playerId: string;
    playerName: string;
    position: string;
    teamAbbreviation: string;
  }[];
}

interface Player {
  id: string;
  name: string;
  position: string;
}

export default function AdminEntryDetailPage() {
  const params = useParams<{ id: string }>();
  const entryId = params.id;
  const [entry, setEntry] = useState<EntryResponse | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [slot, setSlot] = useState<string>(entrySlotOrder[0]);
  const [playerId, setPlayerId] = useState<string>("");

  useEffect(() => {
    if (!entryId) return;
    fetch(`/api/entries/${entryId}`)
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error ?? "Entry not found");
        setEntry(payload);
      })
      .catch(() => setEntry(null));
    fetch("/api/admin/players")
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data);
        if (data[0]) setPlayerId(data[0].id);
      });
  }, [entryId]);

  const playerMap = useMemo(() => {
    const map = new Map<string, Player>();
    players.forEach((player) => map.set(player.id, player));
    return map;
  }, [players]);

  async function togglePaid() {
    if (!entry) return;
    const response = await fetch("/api/admin/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "togglePaid", entryId, paid: !entry.entry.paid }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error ?? "Failed to update paid status");
      return;
    }
    setEntry((prev) => (prev ? { ...prev, entry: { ...prev.entry, paid: data.paid } } : prev));
    toast.success("Paid status updated.");
  }

  async function handleAdd() {
    const response = await fetch("/api/admin/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateRoster",
        entryId,
        rosterUpdate: { entryId, playerId, slot, action: "add" },
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error ?? "Failed to add player");
      return;
    }

    const player = playerMap.get(playerId);
    if (player && entry) {
      const filtered = entry.roster.filter((item) => item.slot !== slot);
      setEntry({
        ...entry,
        roster: [...filtered, { slot, playerId, playerName: player.name, position: player.position, teamAbbreviation: "" }],
      });
    }
    toast.success("Player added.");
  }

  async function handleRemove(playerIdToRemove: string, slotToRemove: string) {
    const response = await fetch("/api/admin/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateRoster",
        entryId,
        rosterUpdate: { entryId, playerId: playerIdToRemove, slot: slotToRemove, action: "remove" },
      }),
    });
    if (!response.ok) {
      const data = await response.json();
      toast.error(data.error ?? "Failed to remove player");
      return;
    }
    setEntry((prev) =>
      prev
        ? {
            ...prev,
            roster: prev.roster.filter((player) => player.playerId !== playerIdToRemove),
          }
        : prev
    );
    toast.success("Player removed.");
  }

  if (!entry) {
    return <p className="text-slate-600">Entry not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Admin</Badge>
        <h1 className="font-display text-4xl text-slate-900">{entry.entry.teamName}</h1>
        <p className="text-slate-600">{entry.entry.participantName} - {entry.entry.email}</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Entry Status</CardTitle>
          <CardDescription>Payment status and roster edits.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Badge variant={entry.entry.paid ? "success" : "outline"}>{entry.entry.paid ? "Paid" : "Unpaid"}</Badge>
          <Button onClick={togglePaid}>{entry.entry.paid ? "Mark Unpaid" : "Mark Paid"}</Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Roster</CardTitle>
          <CardDescription>Manage the roster until entries are locked.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select value={slot} onValueChange={setSlot}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Slot" />
              </SelectTrigger>
              <SelectContent>
                {entrySlotOrder.map((slotOption) => (
                  <SelectItem key={slotOption} value={slotOption}>
                    {slotOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={playerId} onValueChange={setPlayerId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Player" />
              </SelectTrigger>
              <SelectContent>
                {players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name} - {player.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd}>Add Player</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slot</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Pos</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortRosterBySlot(entry.roster).map((player) => (
                <TableRow key={player.playerId}>
                  <TableCell>{player.slot}</TableCell>
                  <TableCell>{player.playerName}</TableCell>
                  <TableCell>{player.position}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(player.playerId, player.slot)}>
                      Remove
                    </Button>
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
