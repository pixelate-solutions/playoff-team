"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { entrySlotOrder, sortRosterBySlot } from "@/lib/roster";
import { Input } from "@/components/ui/input";

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
  nflTeamId: string;
}

interface Team {
  id: string;
  abbreviation: string;
}

const selectStyles =
  "h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer relative z-10";

export default function AdminEntryDetailPage() {
  const params = useParams<{ id: string }>();
  const entryId = params.id;
  const [entry, setEntry] = useState<EntryResponse | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [slot, setSlot] = useState<string>(entrySlotOrder[0]);
  const [playerId, setPlayerId] = useState<string>("");
  const [playerQuery, setPlayerQuery] = useState("");

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
      });
    fetch("/api/admin/teams")
      .then((res) => res.json())
      .then((data) => {
        setTeams(data);
      });
  }, [entryId]);

  const playerMap = useMemo(() => {
    const map = new Map<string, Player>();
    players.forEach((player) => map.set(player.id, player));
    return map;
  }, [players]);

  const teamMap = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((team) => map.set(team.id, team.abbreviation));
    return map;
  }, [teams]);

  const filteredPlayers = useMemo(() => {
    const term = playerQuery.trim().toLowerCase();
    if (!term) return [];
    return players
      .filter((player) => player.name.toLowerCase().includes(term))
      .slice(0, 12);
  }, [players, playerQuery]);

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
    if (!playerId) {
      toast.error("Select a player first.");
      return;
    }
    if (entry?.roster.some((item) => item.playerId === playerId)) {
      toast.error("That player is already on this roster.");
      return;
    }
    if (entry?.roster.some((item) => item.slot === slot)) {
      toast.error("That slot is already filled. Remove or change it first.");
      return;
    }
    const selectedPlayer = playerMap.get(playerId);
    const selectedTeamAbbr = selectedPlayer ? teamMap.get(selectedPlayer.nflTeamId) : undefined;
    if (!selectedTeamAbbr) {
      toast.error("Missing team for selected player.");
      return;
    }
    if (entry?.roster.some((item) => item.teamAbbreviation === selectedTeamAbbr)) {
      toast.error(`A player from ${selectedTeamAbbr} is already on this roster.`);
      return;
    }
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

    if (selectedPlayer && entry) {
      const filtered = entry.roster.filter((item) => item.slot !== slot && item.playerId !== playerId);
      setEntry({
        ...entry,
        roster: [
          ...filtered,
          {
            slot,
            playerId,
            playerName: selectedPlayer.name,
            position: selectedPlayer.position,
            teamAbbreviation: selectedTeamAbbr,
          },
        ],
      });
    }
    setPlayerQuery("");
    setPlayerId("");
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
            <select
              className={`${selectStyles} w-40`}
              value={slot}
              onChange={(event) => setSlot(event.target.value)}
            >
              {entrySlotOrder.map((slotOption) => (
                <option key={slotOption} value={slotOption}>
                  {slotOption}
                </option>
              ))}
            </select>
            <div className="min-w-[16rem] flex-1">
              <Input
                placeholder="Search players..."
                value={playerQuery}
                onChange={(event) => {
                  setPlayerQuery(event.target.value);
                  setPlayerId("");
                }}
              />
              {playerQuery && !playerId && (
                <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white/90 p-2 text-sm shadow-sm">
                  {filteredPlayers.length ? (
                    filteredPlayers.map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
                        onClick={() => {
                          setPlayerId(player.id);
                          setPlayerQuery(`${player.name} (${player.position})`);
                        }}
                      >
                        <span>{player.name}</span>
                        <span className="text-xs text-slate-500">{player.position}</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-slate-400">No matches</p>
                  )}
                </div>
              )}
              {playerId && (
                <p className="mt-2 text-xs text-slate-500">
                  Selected: {playerMap.get(playerId)?.name ?? "Player"}
                </p>
              )}
            </div>
            <Button onClick={handleAdd}>Add Player</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slot</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Pos</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortRosterBySlot(entry.roster).map((player) => (
                <TableRow key={player.playerId}>
                  <TableCell>{player.slot}</TableCell>
                  <TableCell>{player.playerName}</TableCell>
                  <TableCell>{player.teamAbbreviation}</TableCell>
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
