import webpush from "web-push";
import { getDb } from "../db";
import { pushSubscriptions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { ENV } from "../_core/env";

// Initialize web-push with VAPID keys
function initWebPush() {
  if (ENV.vapidPublicKey && ENV.vapidPrivateKey) {
    webpush.setVapidDetails(
      "mailto:alerts@viralbeat.app",
      ENV.vapidPublicKey,
      ENV.vapidPrivateKey
    );
  }
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushToUser(
  userId: number,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  initWebPush();

  const db = await getDb();
  if (!db) return { sent: 0, failed: 0 };

  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.isActive, true)
      )
    );

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/icons/icon-192x192.png",
        badge: payload.badge || "/icons/icon-72x72.png",
        url: payload.url || "/dashboard",
        tag: payload.tag || "viral-beat-alert",
        data: payload.data || {},
        timestamp: Date.now(),
      });

      await webpush.sendNotification(pushSub, notificationPayload);
      sent++;
    } catch (err: unknown) {
      failed++;
      // If subscription is expired/invalid, mark it inactive
      if (
        err &&
        typeof err === "object" &&
        "statusCode" in err &&
        (err.statusCode === 404 || err.statusCode === 410)
      ) {
        await db
          .update(pushSubscriptions)
          .set({ isActive: false })
          .where(eq(pushSubscriptions.id, sub.id));
      }
      console.error(`[PushNotifications] Failed to send to sub ${sub.id}:`, err);
    }
  }

  return { sent, failed };
}

/**
 * Send a trend alert push notification
 */
export async function sendTrendAlert(
  userId: number,
  trend: {
    topic: string;
    platform: string;
    predictedViralScore: number;
    peakTime: string;
  }
): Promise<void> {
  await sendPushToUser(userId, {
    title: `🔥 Viral Trend Alert: ${trend.topic}`,
    body: `${trend.topic} is predicted to go viral on ${trend.platform} in ${trend.peakTime}. Score: ${trend.predictedViralScore}/100`,
    icon: "/icons/icon-192x192.png",
    url: "/dashboard",
    tag: `trend-${trend.platform}-${Date.now()}`,
    data: { type: "trend_alert", trend },
  });
}

/**
 * Send a daily briefing push notification
 */
export async function sendDailyBriefing(
  userId: number,
  briefing: {
    trendCount: number;
    topTrend: string;
    contentIdeas: number;
  }
): Promise<void> {
  await sendPushToUser(userId, {
    title: "📊 Your Daily Viral Beat Briefing",
    body: `${briefing.trendCount} trends match your niche today. Top: "${briefing.topTrend}". ${briefing.contentIdeas} content ideas ready.`,
    icon: "/icons/icon-192x192.png",
    url: "/viralmind",
    tag: "daily-briefing",
    data: { type: "daily_briefing", briefing },
  });
}

/**
 * Send a signal watchlist trigger notification
 */
export async function sendWatchlistAlert(
  userId: number,
  watchlist: {
    label: string;
    watchId: string;
  },
  signal: {
    countryCode: string;
    countryName: string;
    headline: string;
    severity: string;
    dim: string;
  }
): Promise<void> {
  const severityPrefix = signal.severity === "breaking" ? "🚨 BREAKING" : signal.severity === "alert" ? "⚠️ Alert" : "📡 Signal";
  await sendPushToUser(userId, {
    title: `${severityPrefix}: ${watchlist.label}`,
    body: `${signal.countryName} · ${signal.headline}`,
    icon: "/icons/icon-192x192.png",
    url: `/scanner/${signal.countryCode}`,
    tag: `watchlist-${watchlist.watchId}`,
    data: { type: "watchlist_trigger", watchId: watchlist.watchId, countryCode: signal.countryCode, signal },
  });
}

/**
 * Send a ViralMind AI message notification
 */
export async function sendViralMindAlert(
  userId: number,
  message: string,
  url = "/viralmind"
): Promise<void> {
  await sendPushToUser(userId, {
    title: "🤖 ViralMind has an insight for you",
    body: message,
    icon: "/icons/icon-192x192.png",
    url,
    tag: "viralmind-alert",
    data: { type: "viralmind_alert" },
  });
}
