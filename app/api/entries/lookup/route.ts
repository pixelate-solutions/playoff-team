import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { entryLookupSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const payload = entryLookupSchema.parse(await request.json());
    const entry = await db.query.entries.findFirst({
      where: eq(entries.email, payload.email),
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found for that email." }, { status: 404 });
    }

    return NextResponse.json({ id: entry.id, participantName: entry.participantName });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
