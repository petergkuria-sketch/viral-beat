import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { accessRequests, users } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendEmail, appBaseUrl } from "../services/email";

export const accessRouter = router({
  /** Request access to a paid tier (price discovery). Stores + notifies admins. */
  request: publicProcedure
    .input(z.object({
      tier: z.enum(["bronze", "premium"]),
      email: z.string().email().max(200).optional(),
      message: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = input.email || (ctx as any).user?.email;
      if (!email) throw new TRPCError({ code: "BAD_REQUEST", message: "An email is required to request access." });

      await db.insert(accessRequests).values({
        userId: (ctx as any).user?.id != null ? String((ctx as any).user.id) : null,
        email,
        tier: input.tier,
        message: input.message,
        status: "new",
      });

      // Notify admins (best-effort).
      const admins = await db.select({ email: users.email }).from(users).where(eq(users.role, "admin"));
      const to = admins.map(a => a.email).filter((e): e is string => !!e);
      if (to.length) {
        await sendEmail({
          to: to.join(","),
          subject: `Access request: ${input.tier} — ${email}`,
          html: `<p>New <strong>${input.tier}</strong> access request.</p><p>From: ${email}</p>${input.message ? `<p>Message: ${input.message}</p>` : ""}<p><a href="${appBaseUrl()}/admin">Admin</a></p>`,
          text: `New ${input.tier} access request from ${email}.${input.message ? ` Message: ${input.message}` : ""}`,
        });
      }

      return { ok: true, message: "Thanks — we'll be in touch about access shortly." };
    }),

  /** Admin: all access requests (price-discovery data). */
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db.select().from(accessRequests).orderBy(desc(accessRequests.createdAt));
  }),
});
