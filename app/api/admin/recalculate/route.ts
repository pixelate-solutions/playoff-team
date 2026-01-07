import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { recalculateAllEntryTotals } from "@/lib/recalculate";

export async function POST() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entryTotals = await recalculateAllEntryTotals();

  return NextResponse.json({ ok: true, totals: Object.fromEntries(entryTotals) });
}
