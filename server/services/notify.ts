import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";

/** Resolve a user's email from their (stringified) user id. Null if none. */
export async function emailForUserId(db: any, id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  const n = Number(id);
  if (Number.isNaN(n)) return null;
  const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, n));
  return u?.email ?? null;
}
