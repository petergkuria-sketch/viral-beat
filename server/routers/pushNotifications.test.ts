/**
 * Push Notifications Router Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { pushNotificationsRouter } from "./pushNotifications";

// Mock the database
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
}));

// Mock push notification service
vi.mock("../services/pushNotifications", () => ({
  sendPushToUser: vi.fn().mockResolvedValue({ sent: 1, failed: 0 }),
}));

const mockUser = {
  id: 1,
  username: "testcreator",
  email: "test@example.com",
  role: "user" as const,
  displayName: "Test Creator",
  avatarUrl: null,
  bio: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("pushNotificationsRouter", () => {
  describe("getStatus", () => {
    it("returns subscribed: false when no active subscriptions", async () => {
      const caller = pushNotificationsRouter.createCaller({ user: mockUser });
      const result = await caller.getStatus();
      expect(result.subscribed).toBe(false);
    });
  });

  describe("subscribe", () => {
    it("accepts a valid push subscription", async () => {
      const caller = pushNotificationsRouter.createCaller({ user: mockUser });
      const result = await caller.subscribe({
        endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
        p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlTiESgX776I0w6HsPnlKkKGcPluyWRKqXVD0Yeeg",
        auth: "tBHItJI5svbpez7KI4CCXg",
        userAgent: "Mozilla/5.0 (Test)",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid endpoint URL", async () => {
      const caller = pushNotificationsRouter.createCaller({ user: mockUser });
      await expect(
        caller.subscribe({
          endpoint: "not-a-url",
          p256dh: "test-key",
          auth: "test-auth",
        })
      ).rejects.toThrow();
    });
  });

  describe("unsubscribe", () => {
    it("successfully unsubscribes from an endpoint", async () => {
      const caller = pushNotificationsRouter.createCaller({ user: mockUser });
      const result = await caller.unsubscribe({
        endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("sendTest", () => {
    it("throws when no active subscriptions exist", async () => {
      const caller = pushNotificationsRouter.createCaller({ user: mockUser });
      // Mock sendPushToUser to return 0 sent
      const { sendPushToUser } = await import("../services/pushNotifications");
      vi.mocked(sendPushToUser).mockResolvedValueOnce({ sent: 0, failed: 0 });

      await expect(caller.sendTest()).rejects.toThrow("No active push subscriptions");
    });

    it("sends test notification successfully when subscription exists", async () => {
      const caller = pushNotificationsRouter.createCaller({ user: mockUser });
      const { sendPushToUser } = await import("../services/pushNotifications");
      vi.mocked(sendPushToUser).mockResolvedValueOnce({ sent: 1, failed: 0 });

      const result = await caller.sendTest();
      expect(result.success).toBe(true);
      expect(result.sent).toBe(1);
    });
  });
});
