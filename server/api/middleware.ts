import type { Request, Response, NextFunction } from "express";
import { validateApiKey } from "./apiKeys";

export async function apiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const key =
    (req.headers["x-api-key"] as string) ||
    (req.query["api_key"] as string);

  if (!key) {
    res.status(401).json({
      error: "Missing API key. Pass it via the X-API-Key header or ?api_key= query param.",
    });
    return;
  }

  const result = await validateApiKey(key);
  if (!result.valid) {
    res.status(403).json({ error: result.reason });
    return;
  }

  next();
}
