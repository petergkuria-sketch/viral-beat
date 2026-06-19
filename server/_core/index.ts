import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeWebSocket } from "./websocket";
import { generalApiLimiter, authenticatedApiLimiter } from "./rateLimit";
import swaggerUi from "swagger-ui-express";
import v1Router from "../api/v1";
import { openapiSpec } from "../api/openapi";
import { startMigrationService } from "../migrationService";
import { sdk } from "./sdk";
import * as db from "../db";
import { ENV } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Trust proxy for accurate IP detection behind reverse proxies
  app.set('trust proxy', 1);
  
  // Initialize WebSocket server
  initializeWebSocket(server);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Apply rate limiting to all API routes
  app.use("/api", generalApiLimiter);
  app.use("/api", authenticatedApiLimiter);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Temporary debug endpoint — remove after auth is confirmed working
  app.get("/api/debug/session", async (req, res) => {
    const { parse } = await import("cookie");
    const { jwtVerify } = await import("jose");
    const cookies = parse(req.headers.cookie || "");
    const raw = cookies["app_session_id"];
    if (!raw) return res.json({ cookie: null });
    const secretKey = new TextEncoder().encode(ENV.cookieSecret || "");
    try {
      const { payload } = await jwtVerify(raw, secretKey, { algorithms: ["HS256"] });
      const { openId, appId, name } = payload as any;
      const user = await db.getUserByOpenId(openId);
      return res.json({ openId, appId, name, userInDb: !!user, userEmail: (user as any)?.email, secretLength: (ENV.cookieSecret || "").length });
    } catch (e: any) {
      return res.json({ cookie: "present", jwtError: e.message, secretLength: (ENV.cookieSecret || "").length, cookiePrefix: raw.substring(0, 20) });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Public REST API v1 + Swagger docs
  app.use("/api/v1", v1Router);
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec as any, {
    customSiteTitle: "Viral Beat API Docs",
    swaggerOptions: { persistAuthorization: true },
  }));
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Start migration monitoring service
    startMigrationService();

    // Pre-warm Vite dep optimization so the first browser load is instant
    // (Vite in middleware mode does lazy dep bundling on first request)
    if (process.env.NODE_ENV === "development") {
      setTimeout(() => {
        import("http").then(({ default: http }) => {
          http.get(`http://localhost:${port}/`, () => {
            console.log("[Vite] Dep optimization pre-warmed");
          }).on("error", () => {});
        });
      }, 2000);
    }
  });
}

startServer().catch(console.error);
