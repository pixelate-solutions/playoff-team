import { z } from "zod";

export const positionCounts = {
  QB: 4,
  RB: 3,
  WR: 3,
  TE: 1,
  K: 1,
  DST: 1,
  FLEX: 1,
} as const;

export const entrySlotOrder = [
  "QB1",
  "QB2",
  "QB3",
  "QB4",
  "RB1",
  "RB2",
  "RB3",
  "WR1",
  "WR2",
  "WR3",
  "FLEX",
  "TE",
  "K",
  "DST",
] as const;

const slotOrderIndex = new Map(entrySlotOrder.map((slot, index) => [slot, index]));

export const entrySlotSchema = z.enum(entrySlotOrder);

export type EntrySlot = z.infer<typeof entrySlotSchema>;

export type RosterPlayer = {
  playerId: string;
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST";
  nflTeamId: string;
  slot?: EntrySlot;
};

const flexPositions = new Set(["RB", "WR", "TE"]);

export function validateRoster(players: RosterPlayer[]) {
  const errors: string[] = [];

  if (players.length !== 14) {
    errors.push("Roster must include exactly 14 players.");
  }

  const seenPlayers = new Set<string>();
  for (const player of players) {
    if (seenPlayers.has(player.playerId)) {
      errors.push("Roster cannot contain duplicate players.");
      break;
    }
    seenPlayers.add(player.playerId);
  }

  const seenTeams = new Set<string>();
  for (const player of players) {
    if (seenTeams.has(player.nflTeamId)) {
      errors.push("Only one player per NFL playoff team is allowed.");
      break;
    }
    seenTeams.add(player.nflTeamId);
  }

  const counts = players.reduce(
    (acc, player) => {
      acc[player.position] += 1;
      return acc;
    },
    { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 }
  );

  if (counts.QB !== positionCounts.QB) {
    errors.push("Exactly 4 quarterbacks are required.");
  }
  if (counts.RB < positionCounts.RB) {
    errors.push("At least 3 running backs are required.");
  }
  if (counts.WR < positionCounts.WR) {
    errors.push("At least 3 wide receivers are required.");
  }
  if (counts.TE < positionCounts.TE) {
    errors.push("At least 1 tight end is required.");
  }
  if (counts.K !== positionCounts.K) {
    errors.push("Exactly 1 kicker is required.");
  }
  if (counts.DST !== positionCounts.DST) {
    errors.push("Exactly 1 defense is required.");
  }

  const flexEligible = players.filter((player) => flexPositions.has(player.position)).length;
  if (flexEligible < positionCounts.RB + positionCounts.WR + positionCounts.TE + positionCounts.FLEX) {
    errors.push("Flex slot must be filled by an RB, WR, or TE.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function buildSlots(players: RosterPlayer[]) {
  const slots: Record<EntrySlot, RosterPlayer | null> = {
    QB1: null,
    QB2: null,
    QB3: null,
    QB4: null,
    RB1: null,
    RB2: null,
    RB3: null,
    WR1: null,
    WR2: null,
    WR3: null,
    FLEX: null,
    TE: null,
    K: null,
    DST: null,
  };

  for (const player of players) {
    if (!player.slot) continue;
    slots[player.slot] = player;
  }

  return slots;
}

export function sortRosterBySlot<T extends { slot?: string }>(roster: T[]) {
  return [...roster].sort((a, b) => {
    const aIndex = slotOrderIndex.get(a.slot as EntrySlot) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = slotOrderIndex.get(b.slot as EntrySlot) ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
}
