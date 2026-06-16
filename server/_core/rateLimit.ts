import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Rate limiting middleware to prevent API abuse
 * 
 * Different limits for different user types:
 * - Authenticated users: Higher limits
 * - Unauthenticated users: Lower limits
 * - AI Agents: Strictest limits (expensive LLM calls)
 */

// General API rate limit (for public endpoints)
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for authenticated users with higher limits
  skip: (req: Request) => {
    // If user is authenticated, use authenticated limiter instead
    return !!(req as any).user;
  },
});

// Authenticated user rate limit (higher limits)
export const authenticatedApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Authenticated users get 500 requests per 15 minutes
  message: {
    error: "Too many requests, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Only apply to authenticated users
  skip: (req: Request) => {
    return !(req as any).user;
  },
});

// AI Agents rate limit (strictest - expensive LLM calls)
export const aiAgentsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit to 50 AI agent requests per hour
  message: {
    error: "AI Agent usage limit reached. Please try again later.",
    retryAfter: "1 hour",
    suggestion: "AI agents use expensive resources. Consider upgrading for higher limits."
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise IP
    const user = (req as any).user;
    if (user) return `user-${user.id}`;
    // Use ipKeyGenerator helper for proper IPv6 handling
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return ipKeyGenerator(ip);
  },
});

// Data API rate limit (for external data fetching)
export const dataApiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit to 30 data API requests per 5 minutes
  message: {
    error: "Data API usage limit reached. Please try again later.",
    retryAfter: "5 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    if (user) return `user-${user.id}`;
    // Use ipKeyGenerator helper for proper IPv6 handling
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return ipKeyGenerator(ip);
  },
});

// Vote rate limit (prevent vote manipulation)
export const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit to 10 votes per minute
  message: {
    error: "Too many votes. Please slow down.",
    retryAfter: "1 minute"
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    if (user) return `user-${user.id}`;
    // Use ipKeyGenerator helper for proper IPv6 handling
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return ipKeyGenerator(ip);
  },
});
