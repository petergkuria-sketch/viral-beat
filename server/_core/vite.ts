import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { createServer as createViteServer } from "vite";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
const CLIENT_ROOT = path.resolve(PROJECT_ROOT, "client");

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    configFile: false,
    root: CLIENT_ROOT,
    appType: "custom",
    plugins: [
      (await import("@vitejs/plugin-react")).default(),
      (await import("@tailwindcss/vite")).default(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(CLIENT_ROOT, "src"),
        "@shared": path.resolve(PROJECT_ROOT, "shared"),
        "@assets": path.resolve(PROJECT_ROOT, "attached_assets"),
        // Hard-pin React to a single physical path to prevent duplicate instances
        "react": path.resolve(PROJECT_ROOT, "node_modules/react"),
        "react-dom": path.resolve(PROJECT_ROOT, "node_modules/react-dom"),
        "react-dom/client": path.resolve(PROJECT_ROOT, "node_modules/react-dom/client"),
      },
      dedupe: ["react", "react-dom", "@tanstack/react-query"],
    },
    envDir: PROJECT_ROOT,
    publicDir: path.resolve(CLIENT_ROOT, "public"),
    cacheDir: path.resolve(PROJECT_ROOT, "node_modules/.vite"),
    optimizeDeps: {
      // Force re-optimization on every server start so the browser always gets
      // a fresh dep hash, preventing stale cached chunks from breaking the app.
      force: true,
    },
    server: {
      middlewareMode: true,
      hmr: {
        server,
        clientPort: 443,
        protocol: "wss",
      },
      allowedHosts: true as const,
    },
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(CLIENT_ROOT, "index.html");

      // always reload the index.html file from disk in case it changes
      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(PROJECT_ROOT, "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
