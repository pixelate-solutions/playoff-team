import { NextResponse } from "next/server";
import { createAdminSession } from "@/lib/admin";
import { adminLoginSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const payload = adminLoginSchema.parse(await request.json());
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || payload.password !== adminPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
