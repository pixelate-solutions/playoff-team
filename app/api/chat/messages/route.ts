import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, entries } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { chatMessageSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "200");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 200;

  const messages = await db
    .select({
      id: chatMessages.id,
      entryId: chatMessages.entryId,
      senderName: chatMessages.senderName,
      senderEmail: chatMessages.senderEmail,
      message: chatMessages.message,
      createdAt: chatMessages.createdAt,
      participantName: entries.participantName,
      email: entries.email,
    })
    .from(chatMessages)
    .leftJoin(entries, eq(chatMessages.entryId, entries.id))
    .orderBy(asc(chatMessages.createdAt))
    .limit(limit);

  const normalized = messages.map((row) => ({
    id: row.id,
    entryId: row.entryId,
    message: row.message,
    createdAt: row.createdAt,
    participantName: row.senderName ?? row.participantName ?? "Unknown",
    email: row.senderEmail ?? row.email ?? "",
  }));

  return NextResponse.json(normalized);
}

export async function POST(request: NextRequest) {
  try {
    const payload = chatMessageSchema.parse(await request.json());
    const trimmedMessage = payload.message.trim();

    if (payload.entryId) {
      const entry = await db.query.entries.findFirst({
        where: eq(entries.id, payload.entryId),
      });
      if (!entry) {
        return NextResponse.json({ error: "Entry not found." }, { status: 404 });
      }

      const [message] = await db
        .insert(chatMessages)
        .values({
          entryId: payload.entryId,
          message: trimmedMessage,
          senderName: entry.participantName,
          senderEmail: entry.email,
        })
        .returning({
          id: chatMessages.id,
          entryId: chatMessages.entryId,
          message: chatMessages.message,
          createdAt: chatMessages.createdAt,
          senderName: chatMessages.senderName,
          senderEmail: chatMessages.senderEmail,
        });

      return NextResponse.json({
        id: message.id,
        entryId: message.entryId,
        message: message.message,
        createdAt: message.createdAt,
        participantName: message.senderName ?? entry.participantName,
        email: message.senderEmail ?? entry.email,
      });
    }

    const adminSession = await requireAdmin();
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [message] = await db
      .insert(chatMessages)
      .values({
        entryId: null,
        message: trimmedMessage,
        senderName: "Admin",
        senderEmail: null,
      })
      .returning({
        id: chatMessages.id,
        entryId: chatMessages.entryId,
        message: chatMessages.message,
        createdAt: chatMessages.createdAt,
        senderName: chatMessages.senderName,
        senderEmail: chatMessages.senderEmail,
      });

    return NextResponse.json({
      id: message.id,
      entryId: message.entryId,
      message: message.message,
      createdAt: message.createdAt,
      participantName: message.senderName ?? "Admin",
      email: message.senderEmail ?? "",
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
