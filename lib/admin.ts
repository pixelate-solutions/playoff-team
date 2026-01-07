import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { adminSessions } from "@/db/schema";

const SESSION_COOKIE = "admin_session";
const SESSION_DAYS = 7;
const isProduction = process.env.NODE_ENV === "production";

export async function createAdminSession() {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(adminSessions).values({ token, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const session = await db.query.adminSessions.findFirst({
    where: and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, new Date())),
  });

  return session ?? null;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.token, token));
  }
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}
