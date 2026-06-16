import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import type { TrpcContext } from "../_core/trpc";

describe("Social Media Verification", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testUserId: number;

  beforeEach(async () => {
    // Create test user context
    const mockUser = {
      id: 999998,
      openId: "test-openid-social-verify",
      name: "Test Social Creator",
      email: "test@socialverify.com",
      role: "user" as const,
    };

    const mockContext: TrpcContext = {
      user: mockUser,
      req: {} as any,
      res: {} as any,
    };

    caller = appRouter.createCaller(mockContext);
    testUserId = mockUser.id;

    // Clean up test data
    const db = await getDb();
    if (db) {
      await db.execute(`DELETE FROM aiAssistantProfiles WHERE userId = ${testUserId}`);
    }
  });

  describe("Link Social Handle", () => {
    it("should link YouTube handle successfully", async () => {
      // First create profile
      await caller.aiAssistant.getProfile();

      const result = await caller.aiAssistant.linkSocialHandle({
        platform: "youtube",
        handle: "@testcreator",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("youtube");
    });

    it("should link multiple platform handles", async () => {
      await caller.aiAssistant.getProfile();

      await caller.aiAssistant.linkSocialHandle({
        platform: "youtube",
        handle: "@youtubecreator",
      });

      await caller.aiAssistant.linkSocialHandle({
        platform: "tiktok",
        handle: "@tiktokcreator",
      });

      const status = await caller.aiAssistant.getVerificationStatus();

      expect(status.youtube.handle).toBe("@youtubecreator");
      expect(status.tiktok.handle).toBe("@tiktokcreator");
    });
  });

  describe("Generate Verification Code", () => {
    it("should generate a 6-character verification code", async () => {
      await caller.aiAssistant.getProfile();

      const result = await caller.aiAssistant.generateVerificationCode({
        platform: "youtube",
      });

      expect(result.code).toBeDefined();
      expect(result.code.length).toBe(6);
      expect(result.platform).toBe("youtube");
      expect(result.instructions).toContain("ViralBeat Verification");
    });

    it("should set expiry time to 15 minutes", async () => {
      await caller.aiAssistant.getProfile();

      const before = new Date();
      const result = await caller.aiAssistant.generateVerificationCode({
        platform: "tiktok",
      });
      const after = new Date();

      const expiresAt = new Date(result.expiresAt);
      const expectedExpiry = new Date(before.getTime() + 15 * 60 * 1000);

      // Allow 1 second tolerance
      expect(Math.abs(expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
    });
  });

  describe("Verify Social Handle", () => {
    it("should verify handle with correct code", async () => {
      await caller.aiAssistant.getProfile();
      await caller.aiAssistant.linkSocialHandle({
        platform: "instagram",
        handle: "@instagramcreator",
      });

      const codeResult = await caller.aiAssistant.generateVerificationCode({
        platform: "instagram",
      });

      const verifyResult = await caller.aiAssistant.verifySocialHandle({
        platform: "instagram",
        verificationCode: codeResult.code,
      });

      expect(verifyResult.success).toBe(true);
      expect(verifyResult.verified).toBe(true);

      const status = await caller.aiAssistant.getVerificationStatus();
      expect(status.instagram.verified).toBe(true);
    });

    it("should reject invalid verification code", async () => {
      await caller.aiAssistant.getProfile();
      await caller.aiAssistant.linkSocialHandle({
        platform: "twitter",
        handle: "@twittercreator",
      });

      await caller.aiAssistant.generateVerificationCode({
        platform: "twitter",
      });

      await expect(
        caller.aiAssistant.verifySocialHandle({
          platform: "twitter",
          verificationCode: "WRONG1",
        })
      ).rejects.toThrow("Invalid verification code");
    });

    it("should reject expired verification code", async () => {
      await caller.aiAssistant.getProfile();
      await caller.aiAssistant.linkSocialHandle({
        platform: "youtube",
        handle: "@youtubecreator",
      });

      const codeResult = await caller.aiAssistant.generateVerificationCode({
        platform: "youtube",
      });

      // Manually expire the code by updating the database
      const db = await getDb();
      if (db) {
        await db.execute(
          `UPDATE aiAssistantProfiles SET verificationCodeExpiry = DATE_SUB(NOW(), INTERVAL 1 HOUR) WHERE userId = ${testUserId}`
        );
      }

      await expect(
        caller.aiAssistant.verifySocialHandle({
          platform: "youtube",
          verificationCode: codeResult.code,
        })
      ).rejects.toThrow("Verification code expired");
    });
  });

  describe("Get Verification Status", () => {
    it("should return empty status for new profile", async () => {
      await caller.aiAssistant.getProfile();

      const status = await caller.aiAssistant.getVerificationStatus();

      expect(status.youtube.handle).toBeNull();
      expect(status.youtube.verified).toBe(false);
      expect(status.tiktok.handle).toBeNull();
      expect(status.tiktok.verified).toBe(false);
      expect(status.instagram.handle).toBeNull();
      expect(status.instagram.verified).toBe(false);
      expect(status.twitter.handle).toBeNull();
      expect(status.twitter.verified).toBe(false);
    });

    it("should return linked but unverified handles", async () => {
      await caller.aiAssistant.getProfile();

      await caller.aiAssistant.linkSocialHandle({
        platform: "youtube",
        handle: "@myhandle",
      });

      const status = await caller.aiAssistant.getVerificationStatus();

      expect(status.youtube.handle).toBe("@myhandle");
      expect(status.youtube.verified).toBe(false);
    });

    it("should return verified status after verification", async () => {
      await caller.aiAssistant.getProfile();

      await caller.aiAssistant.linkSocialHandle({
        platform: "tiktok",
        handle: "@tiktokhandle",
      });

      const codeResult = await caller.aiAssistant.generateVerificationCode({
        platform: "tiktok",
      });

      await caller.aiAssistant.verifySocialHandle({
        platform: "tiktok",
        verificationCode: codeResult.code,
      });

      const status = await caller.aiAssistant.getVerificationStatus();

      expect(status.tiktok.handle).toBe("@tiktokhandle");
      expect(status.tiktok.verified).toBe(true);
    });
  });
});
