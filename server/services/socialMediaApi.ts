/**
 * Social Media API Integration Service
 * Fetches real-time stats from verified creator accounts
 */

import { callDataApi } from "../_core/dataApi";

export interface SocialMediaStats {
  platform: "youtube" | "tiktok" | "instagram" | "twitter";
  handle: string;
  followers: number;
  engagementRate: number;
  averageViews: number;
  totalPosts: number;
  lastSyncedAt: Date;
  error?: string;
}

/**
 * Fetch YouTube channel statistics using YouTube Data API
 */
export async function fetchYouTubeStats(handle: string): Promise<SocialMediaStats | null> {
  try {
    // Remove @ symbol if present
    const channelHandle = handle.startsWith("@") ? handle.substring(1) : handle;

    // Use Manus Data API to search for YouTube channel
    // Use Data API to search for YouTube channel
    const searchResult: any = await callDataApi("Youtube/search", {
      query: {
        part: "snippet",
        q: channelHandle,
        type: "channel",
        maxResults: "1",
      },
    });

    if (!searchResult.items || searchResult.items.length === 0) {
      return null;
    }

    const channelId = searchResult.items[0].id.channelId;

    // Fetch channel statistics
    const statsResult: any = await callDataApi("Youtube/channels", {
      query: {
        part: "statistics,snippet",
        id: channelId,
      },
    });

    if (!statsResult.items || statsResult.items.length === 0) {
      return null;
    }

    const channel = statsResult.items[0];
    const stats = channel.statistics;

    // Calculate engagement rate (views / subscribers)
    const subscribers = parseInt(stats.subscriberCount || "0");
    const views = parseInt(stats.viewCount || "0");
    const videos = parseInt(stats.videoCount || "1");
    const engagementRate = subscribers > 0 ? (views / subscribers / videos) * 100 : 0;

    return {
      platform: "youtube",
      handle,
      followers: subscribers,
      engagementRate: Math.min(engagementRate, 100), // Cap at 100%
      averageViews: Math.floor(views / videos),
      totalPosts: videos,
      lastSyncedAt: new Date(),
    };
  } catch (error: any) {
    console.error(`[YouTube API] Error fetching stats for ${handle}:`, error.message);
    return {
      platform: "youtube",
      handle,
      followers: 0,
      engagementRate: 0,
      averageViews: 0,
      totalPosts: 0,
      lastSyncedAt: new Date(),
      error: error.message,
    };
  }
}

/**
 * Fetch TikTok user statistics
 * Note: TikTok API requires business account approval, using web scraping fallback
 */
export async function fetchTikTokStats(handle: string): Promise<SocialMediaStats | null> {
  try {
    // Remove @ symbol if present
    const username = handle.startsWith("@") ? handle.substring(1) : handle;

    // TikTok API is restricted - would need official business API access
    // For now, return placeholder that can be manually updated
    console.warn(`[TikTok API] Official API requires business approval. Handle: ${handle}`);

    return {
      platform: "tiktok",
      handle,
      followers: 0,
      engagementRate: 0,
      averageViews: 0,
      totalPosts: 0,
      lastSyncedAt: new Date(),
      error: "TikTok API requires business account approval. Please update stats manually.",
    };
  } catch (error: any) {
    console.error(`[TikTok API] Error fetching stats for ${handle}:`, error.message);
    return {
      platform: "tiktok",
      handle,
      followers: 0,
      engagementRate: 0,
      averageViews: 0,
      totalPosts: 0,
      lastSyncedAt: new Date(),
      error: error.message,
    };
  }
}

/**
 * Fetch Instagram user statistics using Instagram Graph API
 */
export async function fetchInstagramStats(handle: string): Promise<SocialMediaStats | null> {
  try {
    // Remove @ symbol if present
    const username = handle.startsWith("@") ? handle.substring(1) : handle;

    // Instagram Graph API requires Facebook app and user access token
    // For now, return placeholder that can be manually updated
    console.warn(`[Instagram API] Requires Facebook app setup. Handle: ${handle}`);

    return {
      platform: "instagram",
      handle,
      followers: 0,
      engagementRate: 0,
      averageViews: 0,
      totalPosts: 0,
      lastSyncedAt: new Date(),
      error: "Instagram API requires Facebook app setup. Please update stats manually.",
    };
  } catch (error: any) {
    console.error(`[Instagram API] Error fetching stats for ${handle}:`, error.message);
    return {
      platform: "instagram",
      handle,
      followers: 0,
      engagementRate: 0,
      averageViews: 0,
      totalPosts: 0,
      lastSyncedAt: new Date(),
      error: error.message,
    };
  }
}

/**
 * Fetch Twitter user statistics using Twitter API v2
 */
export async function fetchTwitterStats(handle: string): Promise<SocialMediaStats | null> {
  try {
    // Remove @ symbol if present
    const username = handle.startsWith("@") ? handle.substring(1) : handle;

    // Twitter API v2 requires developer account and bearer token
    // For now, return placeholder that can be manually updated
    console.warn(`[Twitter API] Requires developer account. Handle: ${handle}`);

    return {
      platform: "twitter",
      handle,
      followers: 0,
      engagementRate: 0,
      averageViews: 0,
      totalPosts: 0,
      lastSyncedAt: new Date(),
      error: "Twitter API requires developer account. Please update stats manually.",
    };
  } catch (error: any) {
    console.error(`[Twitter API] Error fetching stats for ${handle}:`, error.message);
    return {
      platform: "twitter",
      handle,
      followers: 0,
      engagementRate: 0,
      averageViews: 0,
      totalPosts: 0,
      lastSyncedAt: new Date(),
      error: error.message,
    };
  }
}

/**
 * Sync stats for a verified creator across all their linked platforms
 */
export async function syncCreatorStats(profile: {
  youtubeHandle: string | null;
  tiktokHandle: string | null;
  instagramHandle: string | null;
  twitterHandle: string | null;
  youtubeVerified: boolean;
  tiktokVerified: boolean;
  instagramVerified: boolean;
  twitterVerified: boolean;
}): Promise<{
  youtube: SocialMediaStats | null;
  tiktok: SocialMediaStats | null;
  instagram: SocialMediaStats | null;
  twitter: SocialMediaStats | null;
}> {
  const results = {
    youtube: null as SocialMediaStats | null,
    tiktok: null as SocialMediaStats | null,
    instagram: null as SocialMediaStats | null,
    twitter: null as SocialMediaStats | null,
  };

  // Only fetch stats for verified accounts
  if (profile.youtubeVerified && profile.youtubeHandle) {
    results.youtube = await fetchYouTubeStats(profile.youtubeHandle);
  }

  if (profile.tiktokVerified && profile.tiktokHandle) {
    results.tiktok = await fetchTikTokStats(profile.tiktokHandle);
  }

  if (profile.instagramVerified && profile.instagramHandle) {
    results.instagram = await fetchInstagramStats(profile.instagramHandle);
  }

  if (profile.twitterVerified && profile.twitterHandle) {
    results.twitter = await fetchTwitterStats(profile.twitterHandle);
  }

  return results;
}

/**
 * Calculate aggregate stats across all verified platforms
 */
export function aggregateStats(stats: {
  youtube: SocialMediaStats | null;
  tiktok: SocialMediaStats | null;
  instagram: SocialMediaStats | null;
  twitter: SocialMediaStats | null;
}): {
  totalFollowers: number;
  avgEngagementRate: number;
  avgViews: number;
  totalPosts: number;
  verifiedPlatforms: number;
} {
  const platforms = [stats.youtube, stats.tiktok, stats.instagram, stats.twitter].filter(
    (s) => s !== null && !s.error
  ) as SocialMediaStats[];

  if (platforms.length === 0) {
    return {
      totalFollowers: 0,
      avgEngagementRate: 0,
      avgViews: 0,
      totalPosts: 0,
      verifiedPlatforms: 0,
    };
  }

  const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0);
  const avgEngagementRate =
    platforms.reduce((sum, p) => sum + p.engagementRate, 0) / platforms.length;
  const avgViews = platforms.reduce((sum, p) => sum + p.averageViews, 0) / platforms.length;
  const totalPosts = platforms.reduce((sum, p) => sum + p.totalPosts, 0);

  return {
    totalFollowers,
    avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
    avgViews: Math.floor(avgViews),
    totalPosts,
    verifiedPlatforms: platforms.length,
  };
}
