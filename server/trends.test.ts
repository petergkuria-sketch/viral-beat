import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the dataApi module
vi.mock("./_core/dataApi", () => ({
  callDataApi: vi.fn().mockImplementation((apiId: string) => {
    if (apiId === "Youtube/search") {
      return Promise.resolve({
        contents: [
          {
            type: "video",
            video: {
              videoId: "test-video-1",
              title: "Test YouTube Video",
              channelTitle: "Test Channel",
              viewCountText: "1.5M views",
              publishedTimeText: "2 days ago",
              lengthText: "10:30",
              thumbnails: [{ url: "https://example.com/thumb.jpg", width: 320, height: 180 }],
            },
          },
        ],
      });
    }
    if (apiId === "Tiktok/search_tiktok_video_general") {
      return Promise.resolve({
        data: [
          {
            aweme_id: "test-tiktok-1",
            desc: "Test TikTok Video Description",
            author: {
              nickname: "TikTok Creator",
              unique_id: "tiktokcreator",
            },
            statistics: {
              play_count: 500000,
              digg_count: 25000,
              comment_count: 1000,
              share_count: 500,
            },
            video: {
              cover: { url_list: ["https://example.com/tiktok-thumb.jpg"] },
              duration: 30,
            },
          },
        ],
      });
    }
    return Promise.resolve({});
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("trends.search", () => {
  it("returns combined YouTube and TikTok results for a search query", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trends.search({
      query: "AI technology",
      platform: "all",
    });

    // Check that we have results from both platforms
    expect(result.youtube).toBeDefined();
    expect(result.tiktok).toBeDefined();
    expect(result.youtube.length).toBeGreaterThan(0);
    expect(result.tiktok.length).toBeGreaterThan(0);

    // Check YouTube result structure
    const ytVideo = result.youtube[0];
    expect(ytVideo).toHaveProperty("id");
    expect(ytVideo).toHaveProperty("title");
    expect(ytVideo).toHaveProperty("channel");
    expect(ytVideo).toHaveProperty("platform", "youtube");

    // Check TikTok result structure
    const ttVideo = result.tiktok[0];
    expect(ttVideo).toHaveProperty("id");
    expect(ttVideo).toHaveProperty("title");
    expect(ttVideo).toHaveProperty("channel");
    expect(ttVideo).toHaveProperty("platform", "tiktok");

    // Check virality score is calculated
    expect(result.viralityScore).toBeGreaterThanOrEqual(0);
    expect(result.viralityScore).toBeLessThanOrEqual(10);

    // Check sentiment data exists
    expect(result.sentiment).toBeDefined();
    expect(result.sentiment.positive + result.sentiment.negative + result.sentiment.neutral).toBe(100);

    // Check trend data exists
    expect(result.trendData).toBeDefined();
    expect(result.trendData.length).toBe(7); // 7 days
  });

  it("returns only YouTube results when platform is youtube", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trends.search({
      query: "music",
      platform: "youtube",
    });

    expect(result.youtube.length).toBeGreaterThan(0);
    expect(result.tiktok.length).toBe(0);
  });

  it("returns only TikTok results when platform is tiktok", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trends.search({
      query: "dance",
      platform: "tiktok",
    });

    expect(result.youtube.length).toBe(0);
    expect(result.tiktok.length).toBeGreaterThan(0);
  });

  it("calculates top creators from results", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trends.search({
      query: "tech",
      platform: "all",
    });

    expect(result.topCreators).toBeDefined();
    expect(Array.isArray(result.topCreators)).toBe(true);
    
    if (result.topCreators.length > 0) {
      const creator = result.topCreators[0];
      expect(creator).toHaveProperty("name");
      expect(creator).toHaveProperty("platform");
      expect(creator).toHaveProperty("totalViews");
      expect(creator).toHaveProperty("rank");
    }
  });
});

describe("trends.getVideoDetails", () => {
  it("returns video details structure for YouTube", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trends.getVideoDetails({
      videoId: "test-video-id",
      platform: "youtube",
    });

    expect(result).toHaveProperty("id", "test-video-id");
    expect(result).toHaveProperty("platform", "youtube");
  });

  it("returns video details structure for TikTok", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trends.getVideoDetails({
      videoId: "test-tiktok-id",
      platform: "tiktok",
    });

    expect(result).toHaveProperty("id", "test-tiktok-id");
    expect(result).toHaveProperty("platform", "tiktok");
  });
});
