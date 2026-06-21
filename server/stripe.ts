import Stripe from "stripe";
import { Router, Request, Response } from "express";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ── Stripe client ─────────────────────────────────────────────────────────────
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-05-28.basil",
});

// ── Price IDs — set via Railway env vars ────────────────────────────────────
// STRIPE_PRICE_ANALYST = price_1...  ($19/month)
const PRICE_IDS: Record<string, string> = {
  analyst: process.env.STRIPE_PRICE_ANALYST || "",
};

// ── Checkout session ─────────────────────────────────────────────────────────
export async function createCheckoutSession({
  userId,
  userEmail,
  planId,
  successUrl,
  cancelUrl,
}: {
  userId: number;
  userEmail: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const priceId = PRICE_IDS[planId];
  if (!priceId) throw new Error(`No Stripe price configured for plan: ${planId}`);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId: String(userId), planId },
    subscription_data: {
      metadata: { userId: String(userId), planId },
    },
  });

  return session;
}

// ── Webhook handler ──────────────────────────────────────────────────────────
async function handleWebhookEvent(event: Stripe.Event) {
  const db = await getDb();
  if (!db) return;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = parseInt(session.metadata?.userId || "0");
      const planId = session.metadata?.planId;
      if (!userId || !planId) break;

      const tier = planId as "free" | "analyst" | "enterprise";
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // fallback; subscription events update this

      await db.update(users)
        .set({
          subscriptionTier: tier,
          stripeCustomerId: session.customer as string,
        })
        .where(eq(users.id, userId));

      console.log(`[Stripe] User ${userId} upgraded to ${tier}`);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = parseInt(sub.metadata?.userId || "0");
      if (!userId) break;

      const status = sub.status;
      const isActive = ["active", "trialing"].includes(status);
      const planId = (sub.metadata?.planId || "free") as "free" | "analyst" | "enterprise";

      await db.update(users)
        .set({
          subscriptionTier: isActive ? planId : "free",
          subscriptionExpiresAt: isActive
            ? new Date((sub as any).current_period_end * 1000)
            : null,
        })
        .where(eq(users.id, userId));

      console.log(`[Stripe] Subscription updated for user ${userId}: ${status}`);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = parseInt(sub.metadata?.userId || "0");
      if (!userId) break;

      await db.update(users)
        .set({ subscriptionTier: "free", subscriptionExpiresAt: null })
        .where(eq(users.id, userId));

      console.log(`[Stripe] Subscription cancelled for user ${userId}`);
      break;
    }
  }
}

// ── Express router ────────────────────────────────────────────────────────────
export function createStripeRouter(): Router {
  const router = Router();

  // Webhook — must use raw body, registered BEFORE json middleware
  router.post(
    "/webhook",
    // express.raw so Stripe signature verification works
    (req: Request, res: Response, next) => {
      if (req.headers["content-type"] === "application/json") {
        let data = "";
        req.setEncoding("utf8");
        req.on("data", chunk => { data += chunk; });
        req.on("end", () => {
          (req as any).rawBody = data;
          next();
        });
      } else {
        next();
      }
    },
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      const secret = process.env.STRIPE_WEBHOOK_SECRET || "";

      if (!secret) {
        res.status(400).json({ error: "Webhook secret not configured" });
        return;
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          (req as any).rawBody || JSON.stringify(req.body),
          sig,
          secret
        );
      } catch (err: any) {
        console.error("[Stripe] Webhook signature failed:", err.message);
        res.status(400).json({ error: `Webhook error: ${err.message}` });
        return;
      }

      try {
        await handleWebhookEvent(event);
        res.json({ received: true });
      } catch (err: any) {
        console.error("[Stripe] Webhook handler error:", err);
        res.status(500).json({ error: "Webhook handler failed" });
      }
    }
  );

  return router;
}
