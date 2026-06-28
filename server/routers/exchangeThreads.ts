import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { smeListings, exchangeIntros, exchangeMessages } from "../../drizzle/schema";
import { eq, desc, or, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Investor↔SME safe contact. Communication is platform-mediated: no email/phone
// is exchanged. Investor expresses interest → SME accepts → thread opens.

export const exchangeThreadsRouter = router({
  /** Investor expresses interest in a listing (creates intro + first message). */
  expressInterest: protectedProcedure
    .input(z.object({
      listingId: z.number().int(),
      investorOrg: z.string().max(200).optional(),
      investorType: z.enum(["dfi", "pe_vc", "angel", "strategic", "other"]).default("other"),
      intent: z.enum(["collaboration", "supply_chain", "capital"]),
      message: z.string().min(10).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [listing] = await db.select().from(smeListings).where(eq(smeListings.id, input.listingId));
      if (!listing || listing.status !== "approved") throw new TRPCError({ code: "NOT_FOUND", message: "Listing not available" });

      const uid = String(ctx.user.id);
      if (listing.contributorId === uid) throw new TRPCError({ code: "BAD_REQUEST", message: "You can't express interest in your own listing" });

      // One active intro per investor + listing.
      const existing = await db.select().from(exchangeIntros)
        .where(and(eq(exchangeIntros.listingId, input.listingId), eq(exchangeIntros.investorId, uid)));
      const active = existing.find(i => i.status !== "declined");
      if (active) throw new TRPCError({ code: "BAD_REQUEST", message: "You already have an open conversation for this listing." });

      await db.insert(exchangeIntros).values({
        listingId: input.listingId,
        investorId: uid,
        investorName: (ctx.user as any).name ?? null,
        investorOrg: input.investorOrg,
        investorType: input.investorType,
        intent: input.intent,
        status: "pending",
      });
      const [created] = await db.select().from(exchangeIntros)
        .where(and(eq(exchangeIntros.listingId, input.listingId), eq(exchangeIntros.investorId, uid)))
        .orderBy(desc(exchangeIntros.id));
      await db.insert(exchangeMessages).values({
        introId: created.id, senderId: uid, senderRole: "investor", body: input.message,
      });
      return { ok: true, introId: created.id };
    }),

  /** All threads the caller participates in (as investor or as SME owner). */
  myThreads: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const uid = String(ctx.user.id);

    const myListings = await db.select().from(smeListings).where(eq(smeListings.contributorId, uid));
    const myListingIds = myListings.map(l => l.id);

    const intros = await db.select().from(exchangeIntros).where(
      myListingIds.length
        ? or(eq(exchangeIntros.investorId, uid), inArray(exchangeIntros.listingId, myListingIds))
        : eq(exchangeIntros.investorId, uid)
    ).orderBy(desc(exchangeIntros.updatedAt));

    const listingById = new Map(myListings.map(l => [l.id, l]));
    // also fetch listing names for investor-side threads
    const needed = intros.map(i => i.listingId).filter(id => !listingById.has(id));
    if (needed.length) {
      const extra = await db.select().from(smeListings).where(inArray(smeListings.id, needed));
      extra.forEach(l => listingById.set(l.id, l));
    }

    return intros.map(i => {
      const role: "investor" | "sme" = i.investorId === uid ? "investor" : "sme";
      const listing = listingById.get(i.listingId);
      return {
        introId: i.id,
        listingId: i.listingId,
        listingName: listing?.name ?? "Listing",
        role,
        counterparty: role === "investor" ? (listing?.name ?? "SME") : (i.investorOrg || i.investorName || "Investor"),
        intent: i.intent,
        status: i.status,
        updatedAt: i.updatedAt,
      };
    });
  }),

  /** Full thread (intro + messages) — participant-scoped. */
  getThread: protectedProcedure
    .input(z.object({ introId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const uid = String(ctx.user.id);

      const [intro] = await db.select().from(exchangeIntros).where(eq(exchangeIntros.id, input.introId));
      if (!intro) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
      const [listing] = await db.select().from(smeListings).where(eq(smeListings.id, intro.listingId));

      const isInvestor = intro.investorId === uid;
      const isOwner = listing?.contributorId === uid;
      if (!isInvestor && !isOwner) throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });

      const role: "investor" | "sme" = isInvestor ? "investor" : "sme";
      const messages = await db.select().from(exchangeMessages)
        .where(eq(exchangeMessages.introId, intro.id)).orderBy(exchangeMessages.createdAt);

      return {
        introId: intro.id,
        listingId: intro.listingId,
        listingName: listing?.name ?? "Listing",
        investorOrg: intro.investorOrg,
        investorName: intro.investorName,
        investorType: intro.investorType,
        intent: intro.intent,
        status: intro.status,
        myRole: role,
        canPost: intro.status === "accepted",
        canRespond: role === "sme" && intro.status === "pending",
        messages: messages.map(m => ({ id: m.id, role: m.senderRole, body: m.body, mine: m.senderId === uid, createdAt: m.createdAt })),
      };
    }),

  /** SME owner accepts/declines a pending intro. */
  respond: protectedProcedure
    .input(z.object({ introId: z.number().int(), action: z.enum(["accept", "decline"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const uid = String(ctx.user.id);
      const [intro] = await db.select().from(exchangeIntros).where(eq(exchangeIntros.id, input.introId));
      if (!intro) throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
      const [listing] = await db.select().from(smeListings).where(eq(smeListings.id, intro.listingId));
      if (listing?.contributorId !== uid) throw new TRPCError({ code: "FORBIDDEN", message: "Only the SME owner can respond" });
      if (intro.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: `Already ${intro.status}` });

      await db.update(exchangeIntros).set({ status: input.action === "accept" ? "accepted" : "declined" }).where(eq(exchangeIntros.id, intro.id));
      if (input.action === "accept") {
        await db.insert(exchangeMessages).values({
          introId: intro.id, senderId: uid, senderRole: "sme",
          body: "Thanks for your interest — happy to connect. How can we help?",
        });
      }
      return { ok: true };
    }),

  /** Post a message in an accepted thread — participant-scoped. */
  postMessage: protectedProcedure
    .input(z.object({ introId: z.number().int(), body: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const uid = String(ctx.user.id);
      const [intro] = await db.select().from(exchangeIntros).where(eq(exchangeIntros.id, input.introId));
      if (!intro) throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
      if (intro.status !== "accepted") throw new TRPCError({ code: "BAD_REQUEST", message: "This conversation isn't open." });
      const [listing] = await db.select().from(smeListings).where(eq(smeListings.id, intro.listingId));
      const isInvestor = intro.investorId === uid;
      const isOwner = listing?.contributorId === uid;
      if (!isInvestor && !isOwner) throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });

      await db.insert(exchangeMessages).values({
        introId: intro.id, senderId: uid, senderRole: isInvestor ? "investor" : "sme", body: input.body,
      });
      await db.update(exchangeIntros).set({ updatedAt: new Date() }).where(eq(exchangeIntros.id, intro.id));
      return { ok: true };
    }),
});
