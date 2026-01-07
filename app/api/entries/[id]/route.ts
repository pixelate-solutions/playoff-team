import { NextResponse } from "next/server";
import { getEntryWithRoster } from "@/lib/entries";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getEntryWithRoster(id);
  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json(entry);
}
