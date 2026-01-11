"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type BreakdownItem = {
  label: string;
  stat: number;
  points: number;
  unit?: string;
};

type GameBreakdown = {
  gameId: string;
  round: string;
  seasonType: "regular" | "post";
  week: number | null;
  kickoffAt: string;
  final: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  totalPoints: number;
  breakdown: BreakdownItem[];
  isManualOverride: boolean;
};

type PlayerBreakdownResponse = {
  player: {
    id: string;
    name: string;
    position: string;
    teamAbbr: string;
    playoffOverridePoints: string | number | null;
  };
  games: GameBreakdown[];
};

export function PlayerScoreDialog({
  entryId,
  playerId,
  playerName,
  children,
}: {
  entryId: string;
  playerId: string;
  playerName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<PlayerBreakdownResponse | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetch(`/api/entries/${entryId}/player-stats?playerId=${playerId}`)
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to load player stats.");
        }
        return response.json();
      })
      .then((data: PlayerBreakdownResponse) => {
        if (!isMounted) return;
        setPayload(data);
        setSelectedGameId(data.games[0]?.gameId ?? null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load player stats.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [entryId, open, playerId]);

  const selectedGame = useMemo(() => {
    if (!payload || !selectedGameId) return null;
    return payload.games.find((game) => game.gameId === selectedGameId) ?? null;
  }, [payload, selectedGameId]);

  const overrideValue =
    payload?.player.playoffOverridePoints !== null && payload?.player.playoffOverridePoints !== undefined
      ? Number(payload.player.playoffOverridePoints)
      : null;

  const formatGameTitle = (game: GameBreakdown) => {
    const label = game.seasonType === "regular" && game.week ? `Week ${game.week}` : game.round;
    if (game.homeTeamAbbr && game.awayTeamAbbr) {
      return `${label} - ${game.awayTeamAbbr} @ ${game.homeTeamAbbr}`;
    }
    return label;
  };

  const formatGameMeta = (game: GameBreakdown) => {
    if (game.final && game.homeTeamAbbr && game.awayTeamAbbr) {
      const homeScore = game.homeScore ?? "-";
      const awayScore = game.awayScore ?? "-";
      return `${game.awayTeamAbbr} ${awayScore} @ ${game.homeTeamAbbr} ${homeScore}`;
    }
    const kickoff = new Date(game.kickoffAt);
    if (Number.isNaN(kickoff.getTime())) {
      return "Kickoff time unavailable";
    }
    return kickoff.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatBreakdownLabel = (item: BreakdownItem) => {
    const unit = item.unit ? ` ${item.unit}` : "";
    return `${item.label} (${item.stat}${unit})`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{playerName} scoring</DialogTitle>
          <DialogDescription className="mb-1">Per-game scoring totals and breakdowns.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {overrideValue !== null && !Number.isNaN(overrideValue) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Playoff override set to {overrideValue.toFixed(2)} points. Game stats are shown for reference.
            </div>
          )}
          {loading && <p className="text-sm text-slate-500">Loading player stats...</p>}
          {!loading && error && <p className="text-sm text-rose-600">{error}</p>}
          {!loading && !error && payload && payload.games.length === 0 && (
            <p className="text-sm text-slate-500">No stats yet for this player.</p>
          )}
          {!loading && !error && payload && payload.games.length > 0 && (
            <div className="grid gap-4 md:grid-cols-[1.1fr_1.4fr]">
              <div className="space-y-2">
                {payload.games.map((game) => {
                  const isActive = game.gameId === selectedGameId;
                  return (
                    <button
                      key={game.gameId}
                      type="button"
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                      onClick={() => setSelectedGameId(game.gameId)}
                    >
                      <div className="font-semibold">{formatGameTitle(game)}</div>
                      <div className={isActive ? "text-xs text-slate-200" : "text-xs text-slate-500"}>
                        {formatGameMeta(game)}
                      </div>
                      <div className={isActive ? "text-xs text-slate-200" : "text-xs text-slate-500"}>
                        Total: {game.totalPoints.toFixed(2)}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                {selectedGame ? (
                  <>
                    <div className="flex items-center justify-between text-sm text-slate-600 rounded-sm bg-gray-200 p-1 px-4">
                      <span>{formatGameTitle(selectedGame)}</span>
                      <span className="font-semibold text-slate-900">{selectedGame.totalPoints.toFixed(2)}</span>
                    </div>
                    <div className="h-px w-full bg-slate-200" />
                    {selectedGame.isManualOverride && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        Manual override applied for this game.
                      </div>
                    )}
                    <div className="space-y-2 text-sm text-slate-600">
                      {selectedGame.breakdown.length ? (
                        selectedGame.breakdown.map((item) => (
                          <div key={`${item.label}-${item.stat}`} className="flex items-center justify-between">
                            <span>{formatBreakdownLabel(item)}</span>
                            <span className="font-medium text-slate-900">{item.points.toFixed(2)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">No scored stats for this game.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Select a game to view the breakdown.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
