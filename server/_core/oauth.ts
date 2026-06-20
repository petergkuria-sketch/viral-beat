import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, NextFunction, Request, Response } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

export function registerOAuthRoutes(app: Express) {
  if (!ENV.googleClientId || !ENV.googleClientSecret) {
    console.warn("[OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google auth disabled");
    // Serve a helpful error page so the button doesn't silently loop
    app.get("/api/auth/google", (_req: Request, res: Response) => {
      res.status(503).send("Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
    });
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: ENV.googleClientId,
        clientSecret: ENV.googleClientSecret,
        callbackURL: `${ENV.appBaseUrl}/api/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? null;
          const name = profile.displayName || email || profile.id;

          await db.upsertUser({
            openId: `google:${profile.id}`,
            name,
            email,
            loginMethod: "google",
            lastSignedIn: new Date(),
          });

          done(null, { openId: `google:${profile.id}`, name: name ?? "" });
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );

  app.use(passport.initialize());

  // Step 1 — redirect to Google
  app.get("/api/auth/google", passport.authenticate("google", { session: false }));

  // Step 2 — Google redirects back here
  // Use custom callback so passport errors redirect instead of Express 500
  app.get("/api/auth/google/callback", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("google", { session: false }, async (err: Error | null, user: { openId: string; name: string } | false) => {
      if (err) {
        const msg = err.message ?? String(err);
        console.error("[OAuth] Passport error:", msg);
        return res.redirect(`/?auth=error&reason=${encodeURIComponent(msg)}`);
      }
      if (!user) {
        console.warn("[OAuth] No user returned from Google strategy");
        return res.redirect("/?auth=failed");
      }
      try {
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.redirect(302, "/africa");
      } catch (sessionErr) {
        const msg = sessionErr instanceof Error ? sessionErr.message : String(sessionErr);
        console.error("[OAuth] Session token creation failed:", msg);
        res.redirect(`/?auth=error&reason=${encodeURIComponent(msg)}`);
      }
    })(req, res, next);
  });

  // Sign out
  app.get("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.redirect(302, "/");
  });
}
