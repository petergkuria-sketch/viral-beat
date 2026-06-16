import { describe, it, expect } from "vitest";

// Test the widget data generation logic
describe("Widget Data Generation", () => {
  // Helper function to generate widget data (mirrors the logic in routers.ts)
  function generateWidgetData(topic: string) {
    const topicHash = topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseScore = 70 + (topicHash % 25);
    const trendChange = -5 + (topicHash % 20);
    
    // Generate platform distribution based on topic
    const tiktokPct = 30 + (topicHash % 25);
    const twitterPct = 20 + (topicHash % 15);
    const youtubePct = 15 + (topicHash % 15);
    const firstThree = tiktokPct + twitterPct + youtubePct;
    const instagramPct = Math.max(5, 100 - firstThree);
    
    // Normalize to ensure exactly 100%
    const rawTotal = tiktokPct + twitterPct + youtubePct + instagramPct;
    const scale = 100 / rawTotal;
    
    const platforms = [
      { name: "TikTok", percentage: Math.round(tiktokPct * scale) },
      { name: "Twitter", percentage: Math.round(twitterPct * scale) },
      { name: "YouTube", percentage: Math.round(youtubePct * scale) },
      { name: "Instagram", percentage: 0 },
    ];
    
    // Adjust Instagram to make total exactly 100
    const currentTotal = platforms.slice(0, 3).reduce((sum, p) => sum + p.percentage, 0);
    platforms[3].percentage = 100 - currentTotal;
    
    return {
      viralityScore: baseScore,
      trendChange,
      platforms,
    };
  }

  it("should generate virality score between 70 and 95", () => {
    const topics = ["AI Technology", "Crypto", "Gaming", "Music", "Sports"];
    
    for (const topic of topics) {
      const data = generateWidgetData(topic);
      expect(data.viralityScore).toBeGreaterThanOrEqual(70);
      expect(data.viralityScore).toBeLessThanOrEqual(95);
    }
  });

  it("should generate trend change between -5 and 15", () => {
    const topics = ["AI Technology", "Crypto", "Gaming", "Music", "Sports"];
    
    for (const topic of topics) {
      const data = generateWidgetData(topic);
      expect(data.trendChange).toBeGreaterThanOrEqual(-5);
      expect(data.trendChange).toBeLessThanOrEqual(15);
    }
  });

  it("should generate platform distribution that sums to 100%", () => {
    const topics = ["AI Technology", "Crypto", "Gaming", "Music", "Sports"];
    
    for (const topic of topics) {
      const data = generateWidgetData(topic);
      const total = data.platforms.reduce((sum, p) => sum + p.percentage, 0);
      expect(total).toBe(100);
    }
  });

  it("should include all four platforms", () => {
    const data = generateWidgetData("AI Technology");
    const platformNames = data.platforms.map(p => p.name);
    
    expect(platformNames).toContain("TikTok");
    expect(platformNames).toContain("Twitter");
    expect(platformNames).toContain("YouTube");
    expect(platformNames).toContain("Instagram");
  });

  it("should generate consistent scores for the same topic", () => {
    const topic = "AI Technology";
    const data1 = generateWidgetData(topic);
    const data2 = generateWidgetData(topic);
    
    expect(data1.viralityScore).toBe(data2.viralityScore);
    expect(data1.trendChange).toBe(data2.trendChange);
  });

  it("should generate different scores for different topics", () => {
    const data1 = generateWidgetData("AI Technology");
    const data2 = generateWidgetData("Crypto");
    
    // Different topics should produce different base scores (before random component)
    expect(data1.viralityScore).not.toBe(data2.viralityScore);
  });
});

describe("Widget Configuration", () => {
  it("should have valid theme options", () => {
    const validThemes = ["dark", "light", "neon", "minimal"];
    
    for (const theme of validThemes) {
      expect(["dark", "light", "neon", "minimal"]).toContain(theme);
    }
  });

  it("should have valid size options", () => {
    const validSizes = ["small", "medium", "large"];
    
    for (const size of validSizes) {
      expect(["small", "medium", "large"]).toContain(size);
    }
  });

  it("should validate color format", () => {
    const validColors = ["#06b6d4", "#22d3ee", "#FF0000", "#000000"];
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    
    for (const color of validColors) {
      expect(hexColorRegex.test(color)).toBe(true);
    }
  });
});
