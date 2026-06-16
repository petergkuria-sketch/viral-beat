/**
 * Telegram Bot Service
 * Handles webhook processing, message routing, and bot commands
 */

import axios from "axios";
import { getDb } from "../db";
import { telegramConnections, telegramAlertLog, telegramAlertPreferences } from "../../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  text?: string;
  date: number;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

/**
 * Send a message to a Telegram chat
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options: {
    parse_mode?: "Markdown" | "HTML";
    reply_markup?: any;
  } = {}
): Promise<boolean> {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error("[Telegram] Bot token not configured");
      return false;
    }

    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text,
      ...options,
    });

    return response.data.ok;
  } catch (error) {
    console.error("[Telegram] Failed to send message:", error);
    return false;
  }
}

/**
 * Process incoming Telegram webhook update
 */
export async function processWebhookUpdate(update: TelegramUpdate): Promise<void> {
  try {
    if (!update.message) return;

    const message = update.message;
    const chatId = message.chat.id.toString();
    const text = message.text || "";

    // Check if user is connected
    const db = await getDb();
    if (!db) {
      console.error("[Telegram] Database unavailable");
      return;
    }

    const [connection] = await db
      .select()
      .from(telegramConnections)
      .where(eq(telegramConnections.chatId, chatId))
      .limit(1);

    if (!connection) {
      // New user - send welcome message
      await sendTelegramMessage(
        chatId,
        `🎯 *Welcome to Viral Beat!*\n\n` +
          `I'm your AI assistant for viral content creation.\n\n` +
          `To connect your account, please visit:\n` +
          `https://viralbeat.app/settings/telegram\n\n` +
          `Once connected, I'll send you:\n` +
          `• 📈 Proactive trend alerts\n` +
          `• 🌅 Daily briefings\n` +
          `• 💡 Content ideas\n` +
          `• 📊 Performance stats`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Update last interaction
    await db
      .update(telegramConnections)
      .set({ lastInteractionAt: new Date() })
      .where(eq(telegramConnections.id, connection.id));

    // Handle commands
    if (text.startsWith("/")) {
      await handleCommand(connection.userId, chatId, text);
    } else {
      // Forward to ViralMind chat
      await handleNaturalLanguage(connection.userId, chatId, text);
    }
  } catch (error) {
    console.error("[Telegram] Error processing update:", error);
  }
}

/**
 * Handle bot commands
 */
async function handleCommand(userId: number, chatId: string, command: string): Promise<void> {
  const parts = command.split(" ");
  const cmd = parts[0].toLowerCase();

  switch (cmd) {
    case "/start":
      await sendTelegramMessage(
        chatId,
        `👋 *Welcome back!*\n\n` +
          `Available commands:\n` +
          `/trends - Today's top trends\n` +
          `/ideas - Get 3 content ideas\n` +
          `/stats - Your performance\n` +
          `/settings - Alert preferences\n` +
          `/help - Show this message`,
        { parse_mode: "Markdown" }
      );
      break;

    case "/trends":
      await handleTrendsCommand(userId, chatId);
      break;

    case "/ideas":
      await handleIdeasCommand(userId, chatId);
      break;

    case "/stats":
      await handleStatsCommand(userId, chatId);
      break;

    case "/settings":
      await handleSettingsCommand(userId, chatId);
      break;

    case "/help":
      await sendTelegramMessage(
        chatId,
        `🤖 *Viral Beat Bot Help*\n\n` +
          `*Commands:*\n` +
          `/trends - View today's trending topics\n` +
          `/ideas - Generate content ideas\n` +
          `/stats - Check your performance\n` +
          `/settings - Manage alert preferences\n\n` +
          `*Natural Language:*\n` +
          `Just type your question and I'll help!\n` +
          `Example: "What's trending in tech today?"`,
        { parse_mode: "Markdown" }
      );
      break;

    default:
      await sendTelegramMessage(
        chatId,
        `❓ Unknown command. Type /help to see available commands.`
      );
  }
}

/**
 * Handle /trends command
 */
async function handleTrendsCommand(userId: number, chatId: string): Promise<void> {
  // TODO: Fetch trends from database
  await sendTelegramMessage(
    chatId,
    `📈 *Top Trends Today*\n\n` +
      `1. 🔥 AI Content Creation (+450%)\n` +
      `   Virality: 92/100\n\n` +
      `2. 🎮 Gaming Livestreams (+320%)\n` +
      `   Virality: 88/100\n\n` +
      `3. 🍕 Food Challenges (+280%)\n` +
      `   Virality: 85/100\n\n` +
      `View more at: https://viralbeat.app/trends`,
    { parse_mode: "Markdown" }
  );
}

/**
 * Handle /ideas command
 */
async function handleIdeasCommand(userId: number, chatId: string): Promise<void> {
  // TODO: Generate personalized ideas using ViralMind
  await sendTelegramMessage(
    chatId,
    `💡 *Content Ideas for You*\n\n` +
      `1. "How AI is Changing Content Creation"\n` +
      `   Hook: "I used AI for 30 days..."\n` +
      `   Platform: YouTube, TikTok\n\n` +
      `2. "Gaming Setup Tour 2026"\n` +
      `   Hook: "My $10K gaming setup reveal"\n` +
      `   Platform: YouTube\n\n` +
      `3. "24 Hour Food Challenge"\n` +
      `   Hook: "Eating only trending foods"\n` +
      `   Platform: TikTok, Instagram\n\n` +
      `Get detailed analysis at: https://viralbeat.app/viralmind`,
    { parse_mode: "Markdown" }
  );
}

/**
 * Handle /stats command
 */
async function handleStatsCommand(userId: number, chatId: string): Promise<void> {
  // TODO: Fetch user stats from database
  await sendTelegramMessage(
    chatId,
    `📊 *Your Performance*\n\n` +
      `🎯 VBT Balance: 1,250 tokens\n` +
      `📈 Content Submitted: 15\n` +
      `⭐ Avg Virality Score: 78/100\n` +
      `🏆 Rank: Top 25%\n\n` +
      `View detailed stats at: https://viralbeat.app/dashboard`,
    { parse_mode: "Markdown" }
  );
}

/**
 * Handle /settings command
 */
async function handleSettingsCommand(userId: number, chatId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    await sendTelegramMessage(chatId, "⚠️ Service temporarily unavailable. Please try again later.");
    return;
  }

  const [prefs] = await db
    .select()
    .from(telegramAlertPreferences)
    .where(eq(telegramAlertPreferences.userId, userId))
    .limit(1);

  if (!prefs) {
    await sendTelegramMessage(
      chatId,
      `⚙️ *Alert Settings*\n\n` +
        `Configure your preferences at:\n` +
        `https://viralbeat.app/settings/telegram`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  await sendTelegramMessage(
    chatId,
    `⚙️ *Your Alert Settings*\n\n` +
      `📢 Trend Alerts: ${prefs.enableTrendAlerts ? "✅ Enabled" : "❌ Disabled"}\n` +
      `🌅 Daily Briefing: ${prefs.enableDailyBriefing ? "✅ Enabled" : "❌ Disabled"}\n` +
      `📅 Weekly Summary: ${prefs.enableWeeklySummary ? "✅ Enabled" : "❌ Disabled"}\n` +
      `🎯 Min Virality: ${prefs.minViralityScore}/100\n` +
      `⏰ Briefing Time: ${prefs.briefingTime} ${prefs.timezone}\n\n` +
      `Change settings at:\n` +
      `https://viralbeat.app/settings/telegram`,
    { parse_mode: "Markdown" }
  );
}

/**
 * Handle natural language messages
 */
async function handleNaturalLanguage(userId: number, chatId: string, text: string): Promise<void> {
  // TODO: Forward to ViralMind chat endpoint
  await sendTelegramMessage(
    chatId,
    `🤖 I understand you said: "${text}"\n\n` +
      `Natural language processing is coming soon!\n` +
      `For now, try these commands:\n` +
      `/trends /ideas /stats /help`
  );
}

/**
 * Send proactive trend alert
 */
export async function sendTrendAlert(
  userId: number,
  trend: {
    topic: string;
    platform: string;
    viralityScore: number;
    growthRate: number;
  }
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Telegram] Database unavailable");
      return false;
    }

    const [connection] = await db
      .select()
      .from(telegramConnections)
      .where(eq(telegramConnections.userId, userId))
      .limit(1);

    if (!connection || !connection.isActive) {
      return false;
    }

    const [prefs] = await db
      .select()
      .from(telegramAlertPreferences)
      .where(eq(telegramAlertPreferences.userId, userId))
      .limit(1);

    if (!prefs || !prefs.enableTrendAlerts) {
      return false;
    }

    if (trend.viralityScore < prefs.minViralityScore) {
      return false;
    }

    // Check daily alert limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const alertsToday = await db
      .select()
      .from(telegramAlertLog)
      .where(
        and(
          eq(telegramAlertLog.userId, userId),
          eq(telegramAlertLog.alertType, "trend_alert"),
          gte(telegramAlertLog.sentAt, today)
        )
      );

    if (alertsToday.length >= prefs.maxAlertsPerDay) {
      return false;
    }

    const message =
      `🚨 *Viral Opportunity Detected!*\n\n` +
      `📌 Topic: ${trend.topic}\n` +
      `📱 Platform: ${trend.platform}\n` +
      `🔥 Virality: ${trend.viralityScore}/100\n` +
      `📈 Growth: +${trend.growthRate}%\n\n` +
      `Create content NOW to ride this wave!\n` +
      `View details: https://viralbeat.app/trends`;

    const sent = await sendTelegramMessage(connection.chatId, message, {
      parse_mode: "Markdown",
    });

    // Log the alert
    await db.insert(telegramAlertLog).values({
      userId,
      chatId: connection.chatId,
      alertType: "trend_alert",
      message,
      metadata: JSON.stringify(trend),
      deliveryStatus: sent ? "sent" : "failed",
    });

    return sent;
  } catch (error) {
    console.error("[Telegram] Failed to send trend alert:", error);
    return false;
  }
}

/**
 * Send daily briefing
 */
export async function sendDailyBriefing(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Telegram] Database unavailable");
      return false;
    }

    const [connection] = await db
      .select()
      .from(telegramConnections)
      .where(eq(telegramConnections.userId, userId))
      .limit(1);

    if (!connection || !connection.isActive) {
      return false;
    }

    const [prefs] = await db
      .select()
      .from(telegramAlertPreferences)
      .where(eq(telegramAlertPreferences.userId, userId))
      .limit(1);

    if (!prefs || !prefs.enableDailyBriefing) {
      return false;
    }

    // TODO: Generate personalized briefing
    const message =
      `🌅 *Good Morning!*\n\n` +
      `Here's your daily briefing:\n\n` +
      `📈 *Top 3 Trends for You:*\n` +
      `1. AI Content Creation (92/100)\n` +
      `2. Gaming Livestreams (88/100)\n` +
      `3. Food Challenges (85/100)\n\n` +
      `💰 *VBT Balance:* 1,250 tokens\n` +
      `📊 *Yesterday:* +50 tokens earned\n\n` +
      `🎯 *Goal Progress:*\n` +
      `Reach 10K followers: 65% complete\n\n` +
      `Have a viral day! 🚀`;

    const sent = await sendTelegramMessage(connection.chatId, message, {
      parse_mode: "Markdown",
    });

    // Log the briefing
    await db.insert(telegramAlertLog).values({
      userId,
      chatId: connection.chatId,
      alertType: "daily_briefing",
      message,
      deliveryStatus: sent ? "sent" : "failed",
    });

    return sent;
  } catch (error) {
    console.error("[Telegram] Failed to send daily briefing:", error);
    return false;
  }
}

/**
 * Set webhook URL for Telegram bot
 */
export async function setWebhook(webhookUrl: string): Promise<boolean> {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error("[Telegram] Bot token not configured");
      return false;
    }

    const response = await axios.post(`${TELEGRAM_API_URL}/setWebhook`, {
      url: webhookUrl,
    });

    console.log("[Telegram] Webhook set:", response.data);
    return response.data.ok;
  } catch (error) {
    console.error("[Telegram] Failed to set webhook:", error);
    return false;
  }
}

/**
 * Get bot info
 */
export async function getBotInfo(): Promise<any> {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return null;
    }

    const response = await axios.get(`${TELEGRAM_API_URL}/getMe`);
    return response.data.result;
  } catch (error) {
    console.error("[Telegram] Failed to get bot info:", error);
    return null;
  }
}
