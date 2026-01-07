"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const rounds = ["Wildcard", "Divisional", "Conference", "SuperBowl"] as const;

export default function AdminSettingsPage() {
  const [entriesLocked, setEntriesLocked] = useState(false);
  const [currentRound, setCurrentRound] = useState<(typeof rounds)[number]>("Wildcard");
  const [seasonYear, setSeasonYear] = useState("2025");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setEntriesLocked(Boolean(data.entriesLocked));
        setCurrentRound(data.currentRound ?? "Wildcard");
        setSeasonYear(String(data.seasonYear ?? "2025"));
      });
  }, []);

  async function handleSave() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entriesLocked,
          currentRound,
          seasonYear: Number(seasonYear),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to save settings");
      toast.success("Settings updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecalculate() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/recalculate", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to recalculate");
      toast.success("Scores recalculated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Recalculate failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Admin</Badge>
        <h1 className="font-display text-4xl text-slate-900">Settings</h1>
        <p className="text-slate-600">Lock entries, set current round, and recalc scores.</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>League Settings</CardTitle>
          <CardDescription>Control roster lock and playoff timeline.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Entries Locked</label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={entriesLocked ? "yes" : "no"}
              onChange={(event) => setEntriesLocked(event.target.value === "yes")}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Current Round</label>
            <Select value={currentRound} onValueChange={(value) => setCurrentRound(value as (typeof rounds)[number])}>
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
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Season Year</label>
            <Input value={seasonYear} onChange={(event) => setSeasonYear(event.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSave} disabled={loading}>
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Score Operations</CardTitle>
          <CardDescription>Recalculate leaderboard totals on demand.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" onClick={handleRecalculate} disabled={loading}>
            Recalculate Scores
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
