"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminLogoutButton } from "@/components/admin/logout-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sortRosterBySlot } from "@/lib/roster";

const rounds = ["Wildcard", "Divisional", "Conference", "SuperBowl"] as const;
const modes = ["playoff", "regular"] as const;
const weeks = Array.from({ length: 18 }, (_, index) => index + 1);
const selectStyles =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900";
const weekToggleBase =
  "rounded-full border px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-900";
const weekToggleActive = "border-slate-900 bg-slate-900 text-white";
const weekToggleInactive = "border-slate-200 bg-white text-slate-700 hover:border-slate-400";
const selectAllButton =
  "rounded-full border border-emerald-500 bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500";
const deselectAllButton =
  "rounded-full border border-rose-500 bg-rose-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500";

type RosterRow = {
  slot: string;
  playerId: string;
  playerName: string;
  position: string;
  teamAbbreviation: string;
  totalPoints: number;
  overridePoints: string | number | null;
};

type AdminEntry = {
  entryId: string;
  teamName: string;
  participantName: string;
  email: string;
  totalPoints: number;
  paid: boolean;
  roster: RosterRow[];
};

export function AdminScoreboardClient({
  entries,
  initialRound,
}: {
  entries: AdminEntry[];
  initialRound: (typeof rounds)[number];
}) {
  const router = useRouter();
  const [selectedRounds, setSelectedRounds] = useState<(typeof rounds)[number][]>([initialRound]);
  const [mode, setMode] = useState<(typeof modes)[number]>("playoff");
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([1]);
  const [search, setSearch] = useState("");
  const [overrideValues, setOverrideValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    entries.forEach((entry) => {
      entry.roster.forEach((player) => {
        if (player.overridePoints !== null && player.overridePoints !== undefined) {
          map[player.playerId] = String(player.overridePoints);
        }
      });
    });
    return map;
  });
  const [loading, setLoading] = useState(false);

  const entryCount = entries.length;
  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return entries;
    }

    return entries.filter((entry) => {
      const basicMatch = [entry.teamName, entry.participantName, entry.email].some((value) =>
        value.toLowerCase().includes(term)
      );
      if (basicMatch) {
        return true;
      }
      return entry.roster.some((player) => player.playerName.toLowerCase().includes(term));
    });
  }, [entries, search]);
  const filteredCount = filteredEntries.length;
  const seasonYear = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    return month >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  }, []);

  async function handleOverrideSave(playerId: string) {
    const raw = overrideValues[playerId];
    const value = raw === undefined || raw === "" ? null : Number(raw);

    if (value !== null && Number.isNaN(value)) {
      toast.error("Override points must be a number.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/players/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, playoffOverridePoints: value }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to update override");

      await fetch("/api/admin/recalculate", { method: "POST" });
      toast.success("Override saved and scores recalculated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchStats() {
    if (mode === "regular" && selectedWeeks.length === 0) {
      toast.error("Select at least one week to fetch.");
      return;
    }
    if (mode === "playoff" && selectedRounds.length === 0) {
      toast.error("Select at least one round to fetch.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/admin/fetch-playoff-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonYear,
          mode,
          rounds: mode === "playoff" ? selectedRounds : undefined,
          weeks: mode === "regular" ? selectedWeeks : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.message ?? payload.error ?? "Failed to fetch stats");
      }

      toast.success(`Imported ${payload.importedCount} stat lines from ESPN.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleWeek(week: number) {
    setSelectedWeeks((prev) => {
      if (prev.includes(week)) {
        return prev.filter((value) => value !== week);
      }
      return [...prev, week].sort((a, b) => a - b);
    });
  }

  function toggleRound(round: (typeof rounds)[number]) {
    setSelectedRounds((prev) => {
      if (prev.includes(round)) {
        return prev.filter((value) => value !== round);
      }
      return [...prev, round].sort((a, b) => rounds.indexOf(a) - rounds.indexOf(b));
    });
  }

  function selectAllRounds() {
    setSelectedRounds([...rounds]);
  }

  function deselectAllRounds() {
    setSelectedRounds([]);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary">Admin</Badge>
          <h1 className="font-display text-4xl text-slate-900">Commissioner Scoreboard</h1>
          <p className="text-slate-600">Edit player overrides and trigger external stat imports.</p>
        </div>
        <AdminLogoutButton />
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Search Entries</CardTitle>
          <CardDescription>Find teams by name, email, participant, or player.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search team, participant, email, or player"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <p className="text-xs text-slate-500">
            Showing {filteredCount} of {entryCount} entries
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Fetch ESPN Stats</CardTitle>
            <CardDescription>Pull stats for a playoff round and recalculate totals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                Season: {seasonYear}-{String(seasonYear + 1).slice(-2)}
              </div>
              <select
                className={selectStyles}
                value={mode}
                onChange={(event) => setMode(event.target.value as (typeof modes)[number])}
              >
                {modes.map((modeOption) => (
                  <option key={modeOption} value={modeOption}>
                    {modeOption === "playoff" ? "Playoffs" : "Regular Season"}
                  </option>
                ))}
              </select>
            </div>
            {mode === "playoff" ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className={selectAllButton} onClick={selectAllRounds}>
                    Select all
                  </button>
                  <button type="button" className={deselectAllButton} onClick={deselectAllRounds}>
                    Deselect all
                  </button>
                  {rounds.map((roundOption) => {
                    const isSelected = selectedRounds.includes(roundOption);
                    return (
                      <button
                        key={roundOption}
                        type="button"
                        className={`${weekToggleBase} ${isSelected ? weekToggleActive : weekToggleInactive}`}
                        onClick={() => toggleRound(roundOption)}
                      >
                        {roundOption}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500">
                  Selected rounds: {selectedRounds.length ? selectedRounds.join(", ") : "None"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className={selectAllButton} onClick={() => setSelectedWeeks(weeks)}>
                    Select all
                  </button>
                  <button type="button" className={deselectAllButton} onClick={() => setSelectedWeeks([])}>
                    Deselect all
                  </button>
                  {weeks.map((week) => {
                    const isSelected = selectedWeeks.includes(week);
                    return (
                      <button
                        key={week}
                        type="button"
                        className={`${weekToggleBase} ${isSelected ? weekToggleActive : weekToggleInactive}`}
                        onClick={() => toggleWeek(week)}
                      >
                        Week {week}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500">
                  Selected weeks: {selectedWeeks.length ? selectedWeeks.join(", ") : "None"}
                </p>
              </div>
            )}
            <Button onClick={handleFetchStats} disabled={loading}>
              {loading ? "Updating..." : "Fetch from ESPN & Recalculate"}
            </Button>
            <p className="text-xs text-slate-500">
              Fetching overwrites existing stats so only the selected weeks or rounds remain.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {filteredEntries.map((entry) => (
          <Card key={entry.entryId} className="glass-card">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>{entry.teamName}</CardTitle>
                <CardDescription>{entry.participantName}</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={entry.paid ? "success" : "outline"}>{entry.paid ? "Paid" : "Unpaid"}</Badge>
                <span className="text-sm text-slate-500">Total</span>
                <span className="text-2xl font-display text-slate-900">{entry.totalPoints.toFixed(2)}</span>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/entries/${entry.entryId}`}>Edit Roster</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slot</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Pos</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Override</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {sortRosterBySlot(entry.roster).map((player) => (
                  <TableRow key={player.playerId}>
                      <TableCell>{player.slot}</TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{player.playerName}</div>
                        <div className="text-xs text-slate-500">{player.teamAbbreviation}</div>
                      </TableCell>
                      <TableCell>{player.position}</TableCell>
                      <TableCell>{player.totalPoints.toFixed(2)}</TableCell>
                      <TableCell>
                        <Input
                          value={overrideValues[player.playerId] ?? ""}
                          onChange={(event) =>
                            setOverrideValues((prev) => ({
                              ...prev,
                              [player.playerId]: event.target.value,
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => handleOverrideSave(player.playerId)} disabled={loading}>
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
