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

  // Temporary one-shot DB migration endpoint — adds isBanned/banReason columns
  // Safe to call multiple times; remove after columns confirmed in DB
  app.get("/api/sys/add-ban-columns", async (_req, res) => {
    const database = await db.getDb();
    if (!database) return res.json({ ok: false, error: "DB not available" });
    const results: string[] = [];
    for (const stmt of [
      "ALTER TABLE users ADD COLUMN isBanned TINYINT(1) NOT NULL DEFAULT 0",
      "ALTER TABLE users ADD COLUMN banReason TEXT NULL",
    ]) {
      try {
        await database.execute(stmt as any);
        results.push(`OK: ${stmt}`);
      } catch (e: any) {
        results.push(`SKIP: ${String(e?.message ?? e).slice(0, 120)}`);
      }
    }
    res.json({ ok: true, results });
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
