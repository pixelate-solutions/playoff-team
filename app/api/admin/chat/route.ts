import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { chatMessages } from "@/db/schema";

const payloadSchema = z.object({
  action: z.enum(["delete", "clear"]),
  messageId: z.string().uuid().optional(),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = payloadSchema.parse(await request.json());

    if (payload.action === "clear") {
      await db.delete(chatMessages);
      return NextResponse.json({ ok: true });
    }

    if (!payload.messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    await db.delete(chatMessages).where(eq(chatMessages.id, payload.messageId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
