const playoffOrder = ["Wildcard", "Divisional", "Conference", "SuperBowl"] as const;

function parseWeek(label: string): number | null {
  const match = label.match(/week\s*(\d+)/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function sortRoundLabels(labels: string[]): string[] {
  const unique = Array.from(new Set(labels));
  return unique.sort((a, b) => {
    const weekA = parseWeek(a);
    const weekB = parseWeek(b);
    const isWeekA = weekA !== null;
    const isWeekB = weekB !== null;

    if (isWeekA && isWeekB) {
      return weekA! - weekB!;
    }
    if (isWeekA && !isWeekB) return -1;
    if (!isWeekA && isWeekB) return 1;

    const playoffA = playoffOrder.indexOf(a as (typeof playoffOrder)[number]);
    const playoffB = playoffOrder.indexOf(b as (typeof playoffOrder)[number]);
    if (playoffA !== -1 || playoffB !== -1) {
      if (playoffA === -1) return 1;
      if (playoffB === -1) return -1;
      return playoffA - playoffB;
    }

    return a.localeCompare(b);
  });
}

export function formatRoundLabelShort(label: string): string {
  const week = parseWeek(label);
  if (week !== null) return `WK${week}`;
  return label.slice(0, 3).toUpperCase();
}
