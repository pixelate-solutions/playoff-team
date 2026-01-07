import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const record = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  if (!record) {
    return fallback;
  }
  return record.value as T;
}

export async function setSetting<T>(key: string, value: T) {
  const existing = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  if (existing) {
    await db.update(settings).set({ value }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value });
  }
}
