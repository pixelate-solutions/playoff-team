"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { entrySlotOrder, positionCounts, validateRoster } from "@/lib/roster";
import type { EntrySlot } from "@/lib/roster";

const slotPriority: Record<PlayerOption["position"], EntrySlot[]> = {
  QB: ["QB1", "QB2", "QB3", "QB4"],
  RB: ["RB1", "RB2", "RB3"],
  WR: ["WR1", "WR2", "WR3"],
  TE: ["TE"],
  K: ["K"],
  DST: ["DST"],
};

const tabs = ["QB", "RB", "WR", "TE", "FLEX", "DST", "K"] as const;

type PlayerOption = {
  id: string;
  name: string;
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST";
  nflTeamId: string;
  teamName: string;
  teamAbbreviation: string;
};

type TeamOption = {
  id: string;
  name: string;
  abbreviation: string;
  conference: "AFC" | "NFC";
  seed: number | null;
  madePlayoffs: boolean;
  eliminatedRound: string | null;
};

const emptyRoster = entrySlotOrder.reduce((acc, slot) => {
  acc[slot] = null;
  return acc;
}, {} as Record<EntrySlot, PlayerOption | null>);

export function CreateEntryClient({ players, teams }: { players: PlayerOption[]; teams: TeamOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [info, setInfo] = useState({ firstName: "", lastName: "", email: "" });
  const [infoError, setInfoError] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [roster, setRoster] = useState<Record<EntrySlot, PlayerOption | null>>(emptyRoster);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("QB");
  const [playerSearch, setPlayerSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const prevSelectedCount = useRef(0);

  const usedTeamIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(roster).forEach((player) => {
      if (player) ids.add(player.nflTeamId);
    });
    return ids;
  }, [roster]);

  const positionSummary = useMemo(() => {
    return Object.entries(roster).reduce(
      (acc, [slot, player]) => {
        if (!player) return acc;
        if (slot === "FLEX") return acc;
        if (slot.startsWith("QB")) acc.QB += 1;
        else if (slot.startsWith("RB")) acc.RB += 1;
        else if (slot.startsWith("WR")) acc.WR += 1;
        else if (slot === "TE") acc.TE += 1;
        else if (slot === "K") acc.K += 1;
        else if (slot === "DST") acc.DST += 1;
        return acc;
      },
      { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 }
    );
  }, [roster]);

  const flexCount = roster.FLEX ? 1 : 0;

  const selectedPlayers = useMemo(() => Object.values(roster).filter(Boolean) as PlayerOption[], [roster]);

  const rosterErrors = useMemo(() => {
    const rosterPlayers = selectedPlayers.map((player) => ({
      playerId: player.id,
      position: player.position,
      nflTeamId: player.nflTeamId,
    }));
    return validateRoster(rosterPlayers);
  }, [selectedPlayers]);

  useEffect(() => {
    if (step !== 2) {
      prevSelectedCount.current = selectedPlayers.length;
      return;
    }
    if (selectedPlayers.length === 14 && prevSelectedCount.current < 14) {
      setShowSubmitDialog(true);
    }
    prevSelectedCount.current = selectedPlayers.length;
  }, [selectedPlayers.length, step]);

  const isInfoValid = useMemo(() => {
    const firstName = info.firstName.trim();
    const lastName = info.lastName.trim();
    const email = info.email.trim();
    const emailValid = /\S+@\S+\.\S+/.test(email);
    return firstName.length >= 2 && lastName.length >= 2 && emailValid;
  }, [info]);

  async function handleContinueToRoster() {
    if (!isInfoValid) {
      setInfoError("Please enter a first name, last name, and a valid email.");
      return;
    }
    setInfoError("");
    setCheckingEmail(true);
    try {
      const response = await fetch("/api/entries/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: info.email.trim() }),
      });
      if (response.ok) {
        setInfoError("That email already has an entry. Use a different email.");
        return;
      }
      if (response.status !== 404) {
        const payload = await response.json().catch(() => ({}));
        setInfoError(payload.error ?? "Unable to verify email. Please try again.");
        return;
      }
      setStep(2);
    } catch {
      setInfoError("Unable to verify email. Please try again.");
    } finally {
      setCheckingEmail(false);
    }
  }

  const playersByTab = useMemo(() => {
    if (activeTab === "FLEX") {
      return players.filter((player) => ["RB", "WR", "TE"].includes(player.position));
    }
    return players.filter((player) => player.position === activeTab);
  }, [activeTab, players]);

  const groupedPlayers = useMemo(() => {
    const groups = new Map<string, PlayerOption[]>();
    playersByTab.forEach((player) => {
      const key = `${player.teamAbbreviation} - ${player.teamName}`;
      const list = groups.get(key) ?? [];
      list.push(player);
      groups.set(key, list);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [playersByTab]);

  const filteredGroupedPlayers = useMemo(() => {
    const query = playerSearch.trim().toLowerCase();
    if (!query) return groupedPlayers;
    return groupedPlayers
      .map(([teamLabel, teamPlayers]) => [
        teamLabel,
        teamPlayers.filter((player) => {
          const nameMatch = player.name.toLowerCase().includes(query);
          const teamMatch =
            player.teamAbbreviation.toLowerCase().includes(query) ||
            player.teamName.toLowerCase().includes(query);
          return nameMatch || teamMatch;
        }),
      ])
      .filter(([, teamPlayers]) => teamPlayers.length > 0);
  }, [groupedPlayers, playerSearch]);

  function handleAddPlayer(player: PlayerOption) {
    if (usedTeamIds.has(player.nflTeamId)) {
      toast.error("You already used that NFL team.");
      return;
    }

    const availableSlots = activeTab === "FLEX" ? (["FLEX"] as EntrySlot[]) : slotPriority[player.position];
    const openSlot = availableSlots.find((slot) => roster[slot] === null);

    if (!openSlot) {
      toast.error("No available roster slot for that position.");
      return;
    }

    setRoster((prev) => ({ ...prev, [openSlot]: player }));
  }

  function handleRemove(slot: EntrySlot) {
    setRoster((prev) => ({ ...prev, [slot]: null }));
  }

  async function handleSubmit() {
    const rosterItems = Object.entries(roster)
      .filter(([, value]) => value !== null)
      .map(([slot, value]) => ({
        slot: slot as EntrySlot,
        playerId: value!.id,
      }));

    if (!rosterErrors.valid) {
      toast.error(rosterErrors.errors.join(" "));
      return;
    }

    if (!info.firstName || !info.lastName || !info.email) {
      toast.error("Please complete all participant fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: info.firstName,
          lastName: info.lastName,
          email: info.email,
          roster: rosterItems,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Failed to create entry");
      }

      localStorage.setItem("entryId", result.id);
      toast.success("Entry submitted!");
      router.push(`/my-entry?entryId=${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container space-y-8">
      <div className="space-y-2">
        <Badge variant="secondary">Create Entry</Badge>
        <h1 className="font-display text-4xl text-slate-900">Draft Your 2026 Playoff Team</h1>
        <p className="text-slate-600">Two steps. One roster. Playoff survival starts now.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Step 1: Participant Info</CardTitle>
              <CardDescription>One entry per participant. Use a valid email.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder="First Name"
                value={info.firstName}
                onChange={(event) => {
                  setInfo((prev) => ({ ...prev, firstName: event.target.value }));
                  if (infoError) setInfoError("");
                }}
              />
              <Input
                placeholder="Last Name"
                value={info.lastName}
                onChange={(event) => {
                  setInfo((prev) => ({ ...prev, lastName: event.target.value }));
                  if (infoError) setInfoError("");
                }}
              />
              <Input
                placeholder="Email"
                type="email"
                value={info.email}
                onChange={(event) => {
                  setInfo((prev) => ({ ...prev, email: event.target.value }));
                  if (infoError) setInfoError("");
                }}
              />
              <Button onClick={handleContinueToRoster} disabled={step === 2 || checkingEmail}>
                {step === 2 ? "Roster unlocked" : checkingEmail ? "Checking..." : "Continue to Roster"}
              </Button>
              {infoError && <p className="text-xs text-red-600">{infoError}</p>}
            </CardContent>
          </Card>

          {step === 2 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Step 2: Draft Your Roster</CardTitle>
                <CardDescription>Select 14 players, one per NFL playoff team.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as (typeof tabs)[number])}>
                  <TabsList className="flex h-auto flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm">
                    {tabs.map((tab) => (
                      <TabsTrigger key={tab} value={tab}>
                        {tab}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="mt-4">
                    <Input
                      placeholder="Search players or teams..."
                      value={playerSearch}
                      onChange={(event) => setPlayerSearch(event.target.value)}
                    />
                  </div>
                  {tabs.map((tab) => (
                    <TabsContent key={tab} value={tab}>
                      <div className="space-y-6">
                        {filteredGroupedPlayers.map(([teamLabel, teamPlayers]) => (
                          <div key={teamLabel} className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{teamLabel}</div>
                            <div className="grid gap-4 md:grid-cols-2">
                              {teamPlayers.map((player) => {
                                const teamUsed = usedTeamIds.has(player.nflTeamId);
                                const selectedSlot = Object.entries(roster).find(
                                  ([, rosterPlayer]) => rosterPlayer?.id === player.id
                                )?.[0] as EntrySlot | undefined;
                                return (
                                <div
                                  key={player.id}
                                  className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${
                                    teamUsed && !selectedSlot ? "opacity-50 grayscale" : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-slate-900">{player.name}</p>
                                      <p className="text-xs text-slate-500">{player.teamAbbreviation}</p>
                                    </div>
                                    <Badge variant="outline">{player.position}</Badge>
                                  </div>
                                  <Button
                                    className="mt-4 w-full"
                                    variant={selectedSlot ? "destructive" : "secondary"}
                                    onClick={() => {
                                      if (selectedSlot) {
                                        handleRemove(selectedSlot);
                                        return;
                                      }
                                      handleAddPlayer(player);
                                    }}
                                    disabled={Boolean(teamUsed && !selectedSlot)}
                                  >
                                    {selectedSlot ? "Remove" : teamUsed ? "Team Used" : "Add Player"}
                                  </Button>
                                </div>
                              )})}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Roster Summary</CardTitle>
              <CardDescription>{selectedPlayers.length} of 14 players selected.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>QBs</span>
                  <span className="font-medium text-slate-900">{positionSummary.QB} / {positionCounts.QB}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>RBs</span>
                  <span className="font-medium text-slate-900">{positionSummary.RB} / {positionCounts.RB}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>WRs</span>
                  <span className="font-medium text-slate-900">{positionSummary.WR} / {positionCounts.WR}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>TEs</span>
                  <span className="font-medium text-slate-900">{positionSummary.TE} / {positionCounts.TE}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>FLEX</span>
                  <span className="font-medium text-slate-900">{flexCount} / {positionCounts.FLEX}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>DSTs</span>
                  <span className="font-medium text-slate-900">{positionSummary.DST} / {positionCounts.DST}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ks</span>
                  <span className="font-medium text-slate-900">{positionSummary.K} / {positionCounts.K}</span>
                </div>
              </div>
              <div className="space-y-2">
                {entrySlotOrder.map((slot) => {
                  const player = roster[slot];
                  return (
                    <div key={slot} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{slot}</p>
                        <p className="text-xs text-slate-500">{player ? `${player.name} - ${player.teamAbbreviation}` : "Open"}</p>
                      </div>
                      {player && (
                        <Button variant="ghost" size="sm" onClick={() => handleRemove(slot)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              {!rosterErrors.valid && selectedPlayers.length > 0 && (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                  {rosterErrors.errors[0]}
                </div>
              )}
              <Button className="w-full" onClick={handleSubmit} disabled={!rosterErrors.valid || isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Entry"}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Team Usage</CardTitle>
              <CardDescription>{usedTeamIds.size} of {teams.length} playoff teams used.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {teams.map((team) => (
                <Badge key={team.id} variant={usedTeamIds.has(team.id) ? "success" : "outline"}>
                  {team.abbreviation}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Roster Complete</DialogTitle>
            <DialogDescription className="pb-2">
              You&apos;ve selected 14 players for {info.firstName} {info.lastName}. Submit now or keep editing.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            {entrySlotOrder.map((slot) => {
              const player = roster[slot];
              return (
                <div key={slot} className="flex items-center justify-between gap-3 border-b border-slate-200 py-2 last:border-b-0">
                  <span className="text-xs font-semibold text-slate-500">{slot}</span>
                  <span className="text-right text-slate-700">
                    {player ? `${player.name} (${player.teamAbbreviation})` : "Open"}
                  </span>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Keep Editing
            </Button>
            <Button onClick={handleSubmit} disabled={!rosterErrors.valid || isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
