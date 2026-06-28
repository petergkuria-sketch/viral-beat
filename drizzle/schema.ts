import { int, mysqlTable, text, longtext, timestamp, varchar, mysqlEnum, boolean, bigint, json, decimal, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Subscription tier — gates LLM features and API limits
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "analyst", "enterprise"]).default("free").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
  // Admin controls — columns added via migration, exist in DB
  isBanned: boolean("isBanned").default(false).notNull(),
  banReason: text("banReason"),
  // Privacy settings
  profileVisibility: mysqlEnum("profileVisibility", ["public", "private"]).default("public").notNull(),
  showStats: boolean("showStats").default(true).notNull(),
  showActivity: boolean("showActivity").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Favorites table - stores user's saved trends
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  platform: mysqlEnum("platform", ["all", "youtube", "tiktok", "twitter", "instagram"]).default("all").notNull(),
  viralityScore: varchar("viralityScore", { length: 10 }),
  thumbnail: text("thumbnail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Creators table - stores creator profiles and stats
 */
export const creators = mysqlTable("creators", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  handle: varchar("handle", { length: 255 }),
  platform: mysqlEnum("platform", ["youtube", "tiktok", "twitter", "instagram"]).notNull(),
  platformId: varchar("platformId", { length: 255 }),
  avatarUrl: text("avatarUrl"),
  subscriberCount: bigint("subscriberCount", { mode: "number" }),
  totalViews: bigint("totalViews", { mode: "number" }),
  videoCount: int("videoCount"),
  description: text("description"),
  country: varchar("country", { length: 100 }),
  joinedDate: varchar("joinedDate", { length: 100 }),
  badges: json("badges").$type<string[]>(),
  links: json("links").$type<{ title: string; url: string }[]>(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Creator = typeof creators.$inferSelect;
export type InsertCreator = typeof creators.$inferInsert;

/**
 * Creator stats history - for tracking performance over time
 */
export const creatorStats = mysqlTable("creatorStats", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  subscriberCount: bigint("subscriberCount", { mode: "number" }),
  totalViews: bigint("totalViews", { mode: "number" }),
  videoCount: int("videoCount"),
  avgViews: bigint("avgViews", { mode: "number" }),
  engagementRate: varchar("engagementRate", { length: 20 }),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type CreatorStats = typeof creatorStats.$inferSelect;
export type InsertCreatorStats = typeof creatorStats.$inferInsert;

/**
 * Sentiment analysis cache - stores analyzed sentiment for trends
 */
export const sentimentCache = mysqlTable("sentimentCache", {
  id: int("id").autoincrement().primaryKey(),
  topic: varchar("topic", { length: 255 }).notNull(),
  platform: mysqlEnum("platform", ["all", "youtube", "tiktok", "twitter", "instagram"]).default("all").notNull(),
  positive: int("positive").notNull(),
  negative: int("negative").notNull(),
  neutral: int("neutral").notNull(),
  emotions: json("emotions").$type<string[]>(),
  summary: text("summary"),
  analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
});

export type SentimentCache = typeof sentimentCache.$inferSelect;
export type InsertSentimentCache = typeof sentimentCache.$inferInsert;


/**
 * X Trends cache - stores fetched X/Twitter trends to reduce API calls
 */
export const xTrendsCache = mysqlTable("xTrendsCache", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 128 }).notNull(),
  trendsData: json("trendsData").$type<any[]>(),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
});

export type XTrendsCache = typeof xTrendsCache.$inferSelect;
export type InsertXTrendsCache = typeof xTrendsCache.$inferInsert;

/**
 * Beat Votes table - stores user votes on trends (upvote/downvote)
 */
export const beatVotes = mysqlTable("beatVotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  voteType: mysqlEnum("voteType", ["up", "down"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BeatVote = typeof beatVotes.$inferSelect;
export type InsertBeatVote = typeof beatVotes.$inferInsert;

/**
 * Forum Threads table - stores feature requests and discussions
 */
export const forumThreads = mysqlTable("forumThreads", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["feature_request", "bug_report", "discussion", "question"]).notNull(),
  authorId: int("authorId").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "completed", "closed"]).default("open").notNull(),
  upvotes: int("upvotes").default(0).notNull(),
  downvotes: int("downvotes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ForumThread = typeof forumThreads.$inferSelect;
export type InsertForumThread = typeof forumThreads.$inferInsert;

/**
 * Forum Posts table - stores comments and replies on threads
 */
export const forumPosts = mysqlTable("forumPosts", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull(),
  authorId: int("authorId").notNull(),
  content: text("content").notNull(),
  parentId: int("parentId"), // For nested replies
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = typeof forumPosts.$inferInsert;

/**
 * Forum Votes table - stores user votes on threads
 */
export const forumVotes = mysqlTable("forumVotes", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull(),
  userId: int("userId").notNull(),
  voteType: mysqlEnum("voteType", ["up", "down"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ForumVote = typeof forumVotes.$inferSelect;
export type InsertForumVote = typeof forumVotes.$inferInsert;

/**
 * Developer Agent Conversations table - stores AI chat history
 */
export const developerAgentConversations = mysqlTable("developerAgentConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  messages: json("messages").$type<Array<{ role: string; content: string; timestamp: string }>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeveloperAgentConversation = typeof developerAgentConversations.$inferSelect;
export type InsertDeveloperAgentConversation = typeof developerAgentConversations.$inferInsert;

/**
 * User Tokens table - stores token balances for each user
 */
export const userTokens = mysqlTable("userTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balance: int("balance").default(0).notNull(),
  totalEarned: int("totalEarned").default(0).notNull(),
  totalSpent: int("totalSpent").default(0).notNull(),
  lastLoginDate: varchar("lastLoginDate", { length: 10 }), // YYYY-MM-DD format for daily login tracking
  loginStreak: int("loginStreak").default(0).notNull(), // Consecutive days logged in
  lastStreakDate: varchar("lastStreakDate", { length: 10 }), // YYYY-MM-DD format for streak tracking
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserToken = typeof userTokens.$inferSelect;
export type InsertUserToken = typeof userTokens.$inferInsert;

/**
 * Token Transactions table - stores all token movements (earning and spending)
 */
export const tokenTransactions = mysqlTable("tokenTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(), // Positive for earning, negative for spending
  type: varchar("type", { length: 100 }).notNull(), // Flexible action type (earn_*, spend_*, refund)
  description: text("description").notNull(),
  referenceId: int("referenceId"), // ID of related entity (thread, post, etc.)
  referenceType: varchar("referenceType", { length: 50 }), // Type of reference (thread, post, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type InsertTokenTransaction = typeof tokenTransactions.$inferInsert;

/**
 * Token Earning Rules table - defines how tokens can be earned
 */
export const tokenEarningRules = mysqlTable("tokenEarningRules", {
  id: int("id").autoincrement().primaryKey(),
  actionType: varchar("actionType", { length: 100 }).notNull().unique(),
  tokenAmount: int("tokenAmount").notNull(),
  description: text("description").notNull(),
  verifiedCreatorMultiplier: decimal("verifiedCreatorMultiplier", { precision: 3, scale: 2 }).default("1.50").notNull(), // 1.5x for verified creators
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TokenEarningRule = typeof tokenEarningRules.$inferSelect;
export type InsertTokenEarningRule = typeof tokenEarningRules.$inferInsert;

/**
 * Marketplace Items table - stores purchasable premium features
 */
export const marketplaceItems = mysqlTable("marketplaceItems", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  cost: int("cost").notNull(), // Cost in VB Tokens
  category: mysqlEnum("category", ["analytics", "boost", "badge", "discount", "support"]).notNull(),
  duration: int("duration"), // Duration in days (null for permanent items)
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketplaceItem = typeof marketplaceItems.$inferSelect;
export type InsertMarketplaceItem = typeof marketplaceItems.$inferInsert;

/**
 * User Purchases table - tracks what users have purchased
 */
export const userPurchases = mysqlTable("userPurchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemId: int("itemId").notNull(),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Null for permanent purchases
  isActive: boolean("isActive").default(true).notNull(), // Can be deactivated manually
});

export type UserPurchase = typeof userPurchases.$inferSelect;
export type InsertUserPurchase = typeof userPurchases.$inferInsert;

/**
 * Creator Profiles table - stores creator verification status and tier
 */
export const creatorProfiles = mysqlTable("creatorProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  tier: mysqlEnum("tier", ["ai_assisted", "human_created", "verified_human", "premium_human"]).default("ai_assisted").notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["unverified", "pending", "verified", "rejected"]).default("unverified").notNull(),
  kycVerified: boolean("kycVerified").default(false).notNull(),
  portfolioUrl: text("portfolioUrl"),
  bio: text("bio"),
  totalContentSubmitted: int("totalContentSubmitted").default(0).notNull(),
  humanContentCount: int("humanContentCount").default(0).notNull(),
  aiContentCount: int("aiContentCount").default(0).notNull(),
  vouchCount: int("vouchCount").default(0).notNull(), // Number of vouches received
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type InsertCreatorProfile = typeof creatorProfiles.$inferInsert;

/**
 * Content Submissions table - tracks all content with AI usage disclosure
 */
export const contentSubmissions = mysqlTable("contentSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contentType: mysqlEnum("contentType", ["forum_thread", "forum_post", "article", "video_script", "social_post"]).notNull(),
  contentId: int("contentId"), // Reference to the actual content (e.g., thread ID)
  aiUsageLevel: mysqlEnum("aiUsageLevel", ["none", "minor", "moderate", "heavy", "full"]).notNull(),
  aiToolsUsed: text("aiToolsUsed"), // JSON array of AI tools used
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "flagged", "rejected"]).default("pending").notNull(),
  rewardTier: mysqlEnum("rewardTier", ["tier1", "tier2", "tier3", "tier4"]).notNull(),
  baseReward: int("baseReward").notNull(), // Base VBT amount (e.g., 20)
  multiplier: int("multiplier").notNull(), // e.g., 10, 20, 30, 50 (stored as 10x for precision)
  bonusReward: int("bonusReward").default(0).notNull(), // Bonus VBT (e.g., +10 for Best AI Use)
  totalVbtAwarded: int("totalVbtAwarded").notNull(), // Final amount awarded
  engagementScore: int("engagementScore").default(0).notNull(), // Likes, shares, comments
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContentSubmission = typeof contentSubmissions.$inferSelect;
export type InsertContentSubmission = typeof contentSubmissions.$inferInsert;

/**
 * Verification Vouches table - community vouching system
 */
export const verificationVouches = mysqlTable("verificationVouches", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(), // User being vouched for
  voucherId: int("voucherId").notNull(), // User providing the vouch
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  message: text("message"), // Optional message from voucher
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VerificationVouch = typeof verificationVouches.$inferSelect;
export type InsertVerificationVouch = typeof verificationVouches.$inferInsert;

/**
 * Content Analytics table - platform-wide content distribution stats
 */
export const contentAnalytics = mysqlTable("contentAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  totalSubmissions: int("totalSubmissions").default(0).notNull(),
  humanContent: int("humanContent").default(0).notNull(),
  aiContent: int("aiContent").default(0).notNull(),
  humanPercentage: int("humanPercentage").default(0).notNull(), // Stored as integer percentage (0-100)
  tier1Count: int("tier1Count").default(0).notNull(),
  tier2Count: int("tier2Count").default(0).notNull(),
  tier3Count: int("tier3Count").default(0).notNull(),
  tier4Count: int("tier4Count").default(0).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type ContentAnalytics = typeof contentAnalytics.$inferSelect;
export type InsertContentAnalytics = typeof contentAnalytics.$inferInsert;

/**
 * Viral Submissions table - Humans As Agents (HaA) crowdsourced viral content
 */
export const viralSubmissions = mysqlTable("viralSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contentUrl: text("contentUrl").notNull(),
  platform: mysqlEnum("platform", ["tiktok", "youtube", "twitter", "instagram", "facebook", "linkedin", "reddit", "other"]).notNull(),
  category: mysqlEnum("category", ["entertainment", "education", "news", "tech", "lifestyle", "business", "art", "music", "gaming", "sports", "other"]).notNull(),
  title: text("title"),
  description: text("description"),
  thumbnailUrl: text("thumbnailUrl"),
  submitterAnalysis: text("submitterAnalysis"), // Why submitter thinks it's viral
  viralityScore: int("viralityScore").default(0).notNull(), // 0-100 score
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "verified_viral", "spam"]).default("pending").notNull(),
  vbtAwarded: int("vbtAwarded").default(0).notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  verifiedAt: timestamp("verifiedAt"),
});

export type ViralSubmission = typeof viralSubmissions.$inferSelect;
export type InsertViralSubmission = typeof viralSubmissions.$inferInsert;

/**
 * Submission Metadata table - platform metrics for viral content
 */
export const submissionMetadata = mysqlTable("submissionMetadata", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  views: bigint("views", { mode: "number" }).default(0).notNull(),
  likes: int("likes").default(0).notNull(),
  shares: int("shares").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  growthRate: int("growthRate").default(0).notNull(), // Percentage growth in last 24h
  peakDate: timestamp("peakDate"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type SubmissionMetadata = typeof submissionMetadata.$inferSelect;
export type InsertSubmissionMetadata = typeof submissionMetadata.$inferInsert;

/**
 * Submission Votes table - community quality voting
 */
export const submissionVotes = mysqlTable("submissionVotes", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  userId: int("userId").notNull(),
  vote: mysqlEnum("vote", ["upvote", "downvote"]).notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubmissionVote = typeof submissionVotes.$inferSelect;
export type InsertSubmissionVote = typeof submissionVotes.$inferInsert;

/**
 * HaA Leaderboard table - top viral content contributors
 */
export const haaLeaderboard = mysqlTable("haaLeaderboard", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalSubmissions: int("totalSubmissions").default(0).notNull(),
  acceptedSubmissions: int("acceptedSubmissions").default(0).notNull(),
  rejectedSubmissions: int("rejectedSubmissions").default(0).notNull(),
  verifiedViralCount: int("verifiedViralCount").default(0).notNull(), // Submissions confirmed viral
  trendingDiscoveries: int("trendingDiscoveries").default(0).notNull(), // First to submit trending content
  totalVbtEarned: int("totalVbtEarned").default(0).notNull(),
  acceptanceRate: int("acceptanceRate").default(0).notNull(), // Percentage (0-100)
  rank: int("rank").default(0).notNull(),
  lastSubmissionAt: timestamp("lastSubmissionAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HaaLeaderboard = typeof haaLeaderboard.$inferSelect;
export type InsertHaaLeaderboard = typeof haaLeaderboard.$inferInsert;

/**
 * Token Stakes table - staking system
 */
export const tokenStakes = mysqlTable("tokenStakes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  duration: int("duration").notNull(), // Days: 30, 90, or 180
  apy: int("apy").notNull(), // Percentage: 5, 10, or 15
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  rewardsClaimed: int("rewardsClaimed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TokenStake = typeof tokenStakes.$inferSelect;
export type InsertTokenStake = typeof tokenStakes.$inferInsert;

/**
 * Token Listings table - P2P marketplace
 */
export const tokenListings = mysqlTable("tokenListings", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  amount: int("amount").notNull(),
  pricePerToken: decimal("pricePerToken", { precision: 10, scale: 2 }).notNull(), // USD price
  status: mysqlEnum("status", ["active", "sold", "cancelled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TokenListing = typeof tokenListings.$inferSelect;
export type InsertTokenListing = typeof tokenListings.$inferInsert;

/**
 * Token Trades table - P2P trade history
 */
export const tokenTrades = mysqlTable("tokenTrades", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  buyerId: int("buyerId").notNull(),
  sellerId: int("sellerId").notNull(),
  amount: int("amount").notNull(),
  pricePerToken: decimal("pricePerToken", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  platformFee: int("platformFee").notNull(), // 2% in VBT
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type TokenTrade = typeof tokenTrades.$inferSelect;
export type InsertTokenTrade = typeof tokenTrades.$inferInsert;

/**
 * Governance Proposals table - community voting
 */
export const governanceProposals = mysqlTable("governanceProposals", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: mysqlEnum("type", ["feature_request", "reward_rate_change", "policy_update", "other"]).notNull(),
  options: json("options").notNull(), // Array of voting options
  status: mysqlEnum("status", ["active", "approved", "rejected", "executed"]).default("active").notNull(),
  votingEndsAt: timestamp("votingEndsAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GovernanceProposal = typeof governanceProposals.$inferSelect;
export type InsertGovernanceProposal = typeof governanceProposals.$inferInsert;

/**
 * Governance Votes table - votes on proposals
 */
export const governanceVotes = mysqlTable("governanceVotes", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposalId").notNull(),
  voterId: int("voterId").notNull(),
  option: varchar("option", { length: 255 }).notNull(),
  tokenWeight: int("tokenWeight").notNull(), // 1 VBT = 1 vote
  votedAt: timestamp("votedAt").defaultNow().notNull(),
});

export type GovernanceVote = typeof governanceVotes.$inferSelect;
export type InsertGovernanceVote = typeof governanceVotes.$inferInsert;

/**
 * Token Supply Events table - track minting/burning
 */
export const tokenSupplyEvents = mysqlTable("tokenSupplyEvents", {
  id: int("id").autoincrement().primaryKey(),
  eventType: mysqlEnum("eventType", ["mint", "burn"]).notNull(),
  amount: int("amount").notNull(),
  source: varchar("source", { length: 255 }).notNull(), // "welcome_bonus", "forum_post", "ai_agent_spend", etc.
  userId: int("userId"),
  description: text("description"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type TokenSupplyEvent = typeof tokenSupplyEvents.$inferSelect;
export type InsertTokenSupplyEvent = typeof tokenSupplyEvents.$inferInsert;

/**
 * Token Migrations table - track internal VBT to blockchain VBT migrations
 */
export const tokenMigrations = mysqlTable("tokenMigrations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(), // Amount of VBT to migrate
  txHash: varchar("txHash", { length: 255 }), // Blockchain transaction hash
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "refunded"]).default("pending").notNull(),
  walletAddress: varchar("walletAddress", { length: 255 }).notNull(), // Destination wallet address
  errorMessage: text("errorMessage"), // Error message if migration failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type TokenMigration = typeof tokenMigrations.$inferSelect;
export type InsertTokenMigration = typeof tokenMigrations.$inferInsert;

/**
 * AI Assistant Profiles table - stores detailed creator information for ViralMind personalization
 */
export const aiAssistantProfiles = mysqlTable("aiAssistantProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // Creator identity
  niche: varchar("niche", { length: 100 }), // e.g., "tech reviews", "cooking", "gaming"
  primaryPlatform: mysqlEnum("primaryPlatform", ["youtube", "tiktok", "instagram", "twitter"]),
  audienceSize: int("audienceSize"), // Total followers/subscribers
  averageViews: int("averageViews"),
  // Social media handles for verification
  youtubeHandle: varchar("youtubeHandle", { length: 100 }),
  tiktokHandle: varchar("tiktokHandle", { length: 100 }),
  instagramHandle: varchar("instagramHandle", { length: 100 }),
  twitterHandle: varchar("twitterHandle", { length: 100 }),
  // Verification status for each platform
  youtubeVerified: boolean("youtubeVerified").default(false).notNull(),
  tiktokVerified: boolean("tiktokVerified").default(false).notNull(),
  instagramVerified: boolean("instagramVerified").default(false).notNull(),
  twitterVerified: boolean("twitterVerified").default(false).notNull(),
  // Verification codes (temporary tokens for account linking)
  verificationCode: varchar("verificationCode", { length: 20 }),
  verificationCodeExpiry: timestamp("verificationCodeExpiry"),
  // Content style
  contentStyle: text("contentStyle"), // JSON: {tone: "casual", format: "short-form", topics: []}
  goals: text("goals"), // JSON: {shortTerm: "", longTerm: "", metrics: {}}
  challenges: text("challenges"), // JSON: ["low engagement", "inconsistent posting"]
  // AI learning data
  successPatterns: text("successPatterns"), // JSON: patterns learned from successful content
  preferredHashtags: text("preferredHashtags"), // JSON: array of frequently used hashtags
  optimalPostingTimes: text("optimalPostingTimes"), // JSON: {platform: {day: hour}}
  // Metadata
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  lastAnalyzedAt: timestamp("lastAnalyzedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiAssistantProfile = typeof aiAssistantProfiles.$inferSelect;
export type InsertAiAssistantProfile = typeof aiAssistantProfiles.$inferInsert;

/**
 * AI Assistant Conversations table - stores chat history with ViralMind
 */
export const assistantConversations = mysqlTable("assistantConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(), // Group messages by session
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON: {action: "analyze_content", contentId: 123, result: {}}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AssistantConversation = typeof assistantConversations.$inferSelect;
export type InsertAssistantConversation = typeof assistantConversations.$inferInsert;

/**
 * Content Analysis table - stores AI analysis results for creator content
 */
export const contentAnalyses = mysqlTable("contentAnalyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contentTitle: varchar("contentTitle", { length: 500 }).notNull(),
  contentUrl: text("contentUrl"),
  contentType: mysqlEnum("contentType", ["video", "image", "text", "audio", "research"]).notNull(),
  platform: mysqlEnum("platform", ["youtube", "tiktok", "instagram", "twitter", "journal"]).notNull(),
  // Analysis results
  viralityScore: decimal("viralityScore", { precision: 3, scale: 1 }), // 0.0 to 10.0
  strengths: text("strengths"), // JSON: array of identified strengths
  weaknesses: text("weaknesses"), // JSON: array of areas for improvement
  recommendations: text("recommendations"), // JSON: array of actionable suggestions
  predictedPerformance: text("predictedPerformance"), // JSON: {views: 10000, engagement: 5%}
  optimizedTitle: text("optimizedTitle"),
  optimizedHashtags: text("optimizedHashtags"), // JSON: array
  optimalPostTime: timestamp("optimalPostTime"),
  // Metadata
  analysisType: mysqlEnum("analysisType", ["pre_publish", "post_publish", "competitor", "game_theory"]).notNull(),
  actualPerformance: text("actualPerformance"), // JSON: filled after content is published
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContentAnalysis = typeof contentAnalyses.$inferSelect;
export type InsertContentAnalysis = typeof contentAnalyses.$inferInsert;

/**
 * Assistant Tasks table - tracks ongoing and completed tasks by the AI assistant
 */
export const assistantTasks = mysqlTable("assistantTasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskType: mysqlEnum("taskType", [
    "analyze_content",
    "find_trends",
    "optimize_post",
    "competitor_analysis",
    "content_calendar",
    "performance_report"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).default("pending").notNull(),
  input: text("input"), // JSON: task-specific input data
  output: text("output"), // JSON: task results
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type AssistantTask = typeof assistantTasks.$inferSelect;
export type InsertAssistantTask = typeof assistantTasks.$inferInsert;

/**
 * Creator Goals table - tracks creator goals and progress
 */
export const creatorGoals = mysqlTable("creatorGoals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  goalType: mysqlEnum("goalType", ["followers", "views", "engagement", "revenue", "custom"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetValue: int("targetValue").notNull(),
  currentValue: int("currentValue").default(0).notNull(),
  deadline: timestamp("deadline"),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  milestones: text("milestones"), // JSON: array of milestone checkpoints
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type CreatorGoal = typeof creatorGoals.$inferSelect;
export type InsertCreatorGoal = typeof creatorGoals.$inferInsert;

/**
 * Newsletter Subscriptions table - manages user newsletter subscriptions
 */
export const newsletterSubscriptions = mysqlTable("newsletterSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  frequency: mysqlEnum("frequency", ["weekly", "biweekly", "monthly"]).default("weekly").notNull(),
  nichePreferences: text("nichePreferences"), // JSON: array of preferred niches
  platformPreferences: text("platformPreferences"), // JSON: array of preferred platforms
  isActive: boolean("isActive").default(true).notNull(),
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribedAt"),
  unsubscribeToken: varchar("unsubscribeToken", { length: 255 }).unique(), // For one-click unsubscribe
});

export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type InsertNewsletterSubscription = typeof newsletterSubscriptions.$inferInsert;

/**
 * Newsletter Editions table - stores generated newsletter editions
 */
export const newsletterEditions = mysqlTable("newsletterEditions", {
  id: int("id").autoincrement().primaryKey(),
  editionNumber: int("editionNumber").notNull().unique(),
  weekStartDate: timestamp("weekStartDate").notNull(),
  weekEndDate: timestamp("weekEndDate").notNull(),
  generationStatus: mysqlEnum("generationStatus", ["pending", "generating", "completed", "failed"]).default("pending").notNull(),
  generatedAt: timestamp("generatedAt"),
  errorMessage: text("errorMessage"),
  metadata: text("metadata"), // JSON: generation metadata (AI model used, generation time, etc.)
});

export type NewsletterEdition = typeof newsletterEditions.$inferSelect;
export type InsertNewsletterEdition = typeof newsletterEditions.$inferInsert;

/**
 * Newsletter Content table - stores content sections for each edition
 */
export const newsletterContent = mysqlTable("newsletterContent", {
  id: int("id").autoincrement().primaryKey(),
  editionId: int("editionId").notNull(),
  contentType: mysqlEnum("contentType", [
    "past_week_highlights",
    "top_creators_spotlight",
    "week_ahead_projections",
    "trending_topics",
    "viral_content",
    "personalized_tips"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(), // HTML or Markdown content
  data: text("data"), // JSON: structured data (stats, metrics, etc.)
  personalizationMetadata: text("personalizationMetadata"), // JSON: niche, platform, etc.
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsletterContent = typeof newsletterContent.$inferSelect;
export type InsertNewsletterContent = typeof newsletterContent.$inferInsert;

/**
 * Newsletter Deliveries table - tracks delivery status for each user
 */
export const newsletterDeliveries = mysqlTable("newsletterDeliveries", {
  id: int("id").autoincrement().primaryKey(),
  editionId: int("editionId").notNull(),
  userId: int("userId").notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["pending", "sent", "failed", "bounced", "opened", "clicked"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
});

export type NewsletterDelivery = typeof newsletterDeliveries.$inferSelect;
export type InsertNewsletterDelivery = typeof newsletterDeliveries.$inferInsert;

/**
 * Telegram Connections table - stores user Telegram chat IDs
 */
export const telegramConnections = mysqlTable("telegramConnections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // One Telegram connection per user
  chatId: varchar("chatId", { length: 255 }).notNull().unique(), // Telegram chat ID
  username: varchar("username", { length: 255 }), // Telegram username (optional)
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  lastInteractionAt: timestamp("lastInteractionAt"),
});

export type TelegramConnection = typeof telegramConnections.$inferSelect;
export type InsertTelegramConnection = typeof telegramConnections.$inferInsert;

/**
 * Telegram Alert Preferences table - user preferences for proactive alerts
 */
export const telegramAlertPreferences = mysqlTable("telegramAlertPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  enableTrendAlerts: boolean("enableTrendAlerts").default(true).notNull(),
  enableDailyBriefing: boolean("enableDailyBriefing").default(true).notNull(),
  enableWeeklySummary: boolean("enableWeeklySummary").default(true).notNull(),
  maxAlertsPerDay: int("maxAlertsPerDay").default(5).notNull(),
  minViralityScore: int("minViralityScore").default(70).notNull(), // Only alert if virality >= this
  briefingTime: varchar("briefingTime", { length: 5 }).default("08:00").notNull(), // HH:MM format
  timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TelegramAlertPreference = typeof telegramAlertPreferences.$inferSelect;
export type InsertTelegramAlertPreference = typeof telegramAlertPreferences.$inferInsert;

/**
 * Telegram Alert Log table - tracks all alerts sent to users
 */
export const telegramAlertLog = mysqlTable("telegramAlertLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  chatId: varchar("chatId", { length: 255 }).notNull(),
  alertType: mysqlEnum("alertType", [
    "trend_alert",
    "daily_briefing",
    "weekly_summary",
    "viral_opportunity",
    "goal_reminder",
    "token_earned"
  ]).notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON: trend details, virality score, etc.
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["sent", "failed"]).default("sent").notNull(),
  errorMessage: text("errorMessage"),
});

export type TelegramAlertLog = typeof telegramAlertLog.$inferSelect;
export type InsertTelegramAlertLog = typeof telegramAlertLog.$inferInsert;

/**
 * Push Subscriptions table - stores Web Push API subscriptions for native-style notifications
 */
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: varchar("auth", { length: 255 }).notNull(),
  userAgent: varchar("userAgent", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;


// ============================================================
// KENYA INTELLIGENCE MODULE - Political Sentiment Tracker
// ============================================================

/**
 * Political figures being tracked (legacy - for backward compatibility)
 */
export const politicalFigures = mysqlTable("political_figures", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  party: varchar("party", { length: 255 }),
  imageUrl: text("imageUrl"),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PoliticalFigure = typeof politicalFigures.$inferSelect;
export type InsertPoliticalFigure = typeof politicalFigures.$inferInsert;

/**
 * Executive Branch Members (President, DP, Cabinet Secretaries)
 */
export const executiveMembers = mysqlTable("executive_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  position: mysqlEnum("position", ["president", "deputy_president", "prime_cabinet_secretary", "cabinet_secretary", "attorney_general", "secretary_cabinet"]).notNull(),
  ministry: varchar("ministry", { length: 255 }),
  party: varchar("party", { length: 100 }),
  county: varchar("county", { length: 100 }),
  imageUrl: text("imageUrl"),
  bio: text("bio"),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
  appointedAt: timestamp("appointedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ExecutiveMember = typeof executiveMembers.$inferSelect;
export type InsertExecutiveMember = typeof executiveMembers.$inferInsert;

/**
 * National Assembly Members (290 Constituency MPs + 47 Women Reps + 12 Nominated)
 */
export const parliamentMembers = mysqlTable("parliament_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 100 }),
  memberType: mysqlEnum("memberType", ["constituency", "women_rep", "nominated"]).notNull(),
  constituency: varchar("constituency", { length: 255 }),
  county: varchar("county", { length: 100 }).notNull(),
  party: varchar("party", { length: 100 }),
  coalition: varchar("coalition", { length: 100 }),
  imageUrl: text("imageUrl"),
  bio: text("bio"),
  committees: json("committees"),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
  electedAt: timestamp("electedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ParliamentMember = typeof parliamentMembers.$inferSelect;
export type InsertParliamentMember = typeof parliamentMembers.$inferInsert;

/**
 * Senate Members (47 Elected + 16 Women + 2 Youth + 2 PWD)
 */
export const senateMembers = mysqlTable("senate_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 100 }),
  memberType: mysqlEnum("memberType", ["elected", "women_nominated", "youth", "pwd"]).notNull(),
  county: varchar("county", { length: 100 }).notNull(),
  party: varchar("party", { length: 100 }),
  coalition: varchar("coalition", { length: 100 }),
  imageUrl: text("imageUrl"),
  bio: text("bio"),
  committees: json("committees"),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
  electedAt: timestamp("electedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SenateMember = typeof senateMembers.$inferSelect;
export type InsertSenateMember = typeof senateMembers.$inferInsert;

/**
 * Political Parties
 */
export const politicalParties = mysqlTable("political_parties", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  abbreviation: varchar("abbreviation", { length: 20 }),
  coalition: varchar("coalition", { length: 100 }),
  leader: varchar("leader", { length: 255 }),
  logoUrl: text("logoUrl"),
  color: varchar("color", { length: 20 }),
  memberCount: int("memberCount"),
  foundedYear: int("foundedYear"),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PoliticalParty = typeof politicalParties.$inferSelect;
export type InsertPoliticalParty = typeof politicalParties.$inferInsert;

/**
 * Election Phases for sentiment tracking
 */
export const electionPhases = mysqlTable("election_phases", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phaseType: mysqlEnum("phaseType", ["pre_election", "campaign", "local_mobilization", "election_day", "post_election"]).notNull(),
  description: text("description"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ElectionPhase = typeof electionPhases.$inferSelect;
export type InsertElectionPhase = typeof electionPhases.$inferInsert;

/**
 * Phase-specific sentiment records
 */
export const phaseSentiments = mysqlTable("phase_sentiments", {
  id: int("id").autoincrement().primaryKey(),
  phaseId: int("phaseId").notNull(),
  actorType: mysqlEnum("actorType", ["executive", "parliament", "senate", "party", "county"]).notNull(),
  actorId: int("actorId").notNull(),
  sentimentScore: decimal("sentimentScore", { precision: 5, scale: 2 }).notNull(),
  positiveCount: int("positiveCount").default(0).notNull(),
  negativeCount: int("negativeCount").default(0).notNull(),
  neutralCount: int("neutralCount").default(0).notNull(),
  supportLevel: decimal("supportLevel", { precision: 5, scale: 2 }),
  engagementCount: int("engagementCount").default(0),
  source: varchar("source", { length: 100 }),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PhaseSentiment = typeof phaseSentiments.$inferSelect;
export type InsertPhaseSentiment = typeof phaseSentiments.$inferInsert;

/**
 * Regional Support Mapping (Balkanization tracking)
 */
export const regionalSupport = mysqlTable("regional_support", {
  id: int("id").autoincrement().primaryKey(),
  phaseId: int("phaseId"),
  county: varchar("county", { length: 100 }).notNull(),
  constituency: varchar("constituency", { length: 255 }),
  region: varchar("region", { length: 100 }),
  dominantParty: varchar("dominantParty", { length: 100 }),
  dominantCoalition: varchar("dominantCoalition", { length: 100 }),
  supportScore: decimal("supportScore", { precision: 5, scale: 2 }),
  voterTurnoutEstimate: decimal("voterTurnoutEstimate", { precision: 5, scale: 2 }),
  hateSpeechIntensity: mysqlEnum("hateSpeechIntensity", ["low", "medium", "high", "critical"]).default("low"),
  mobilizationLevel: mysqlEnum("mobilizationLevel", ["dormant", "emerging", "active", "intense"]).default("dormant"),
  keyIssues: json("keyIssues"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RegionalSupport = typeof regionalSupport.$inferSelect;
export type InsertRegionalSupport = typeof regionalSupport.$inferInsert;

/**
 * Sentiment records for political figures
 */
export const sentimentRecords = mysqlTable("sentiment_records", {
  id: int("id").autoincrement().primaryKey(),
  figureId: int("figureId").notNull(),
  sentimentScore: decimal("sentimentScore", { precision: 5, scale: 2 }).notNull(),
  positiveCount: int("positiveCount").default(0).notNull(),
  negativeCount: int("negativeCount").default(0).notNull(),
  neutralCount: int("neutralCount").default(0).notNull(),
  source: varchar("source", { length: 100 }),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SentimentRecord = typeof sentimentRecords.$inferSelect;
export type InsertSentimentRecord = typeof sentimentRecords.$inferInsert;

/**
 * Hate speech analysis records (ICC Rabat Plan threshold test)
 */
export const hateSpeechAnalyses = mysqlTable("hate_speech_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  inputText: text("inputText").notNull(),
  speakerInfo: varchar("speakerInfo", { length: 255 }),
  contextInfo: varchar("contextInfo", { length: 255 }),
  totalScore: int("totalScore").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["Low", "Moderate", "High", "Critical"]).notNull(),
  contextScore: int("contextScore").notNull(),
  speakerScore: int("speakerScore").notNull(),
  intentScore: int("intentScore").notNull(),
  contentScore: int("contentScore").notNull(),
  extentScore: int("extentScore").notNull(),
  likelihoodScore: int("likelihoodScore").notNull(),
  detectedTerms: json("detectedTerms"),
  languageAnalysis: json("languageAnalysis"),
  verdict: text("verdict"),
  actorType: mysqlEnum("actorType", ["executive", "parliament", "senate", "party", "other"]),
  actorId: int("actorId"),
  phaseId: int("phaseId"),
  county: varchar("county", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type HateSpeechAnalysis = typeof hateSpeechAnalyses.$inferSelect;
export type InsertHateSpeechAnalysis = typeof hateSpeechAnalyses.$inferInsert;

/**
 * County-level sentiment data (47 counties)
 */
export const countySentiments = mysqlTable("county_sentiments", {
  id: int("id").autoincrement().primaryKey(),
  countyName: varchar("countyName", { length: 100 }).notNull(),
  countyCode: int("countyCode"),
  sentimentScore: decimal("sentimentScore", { precision: 5, scale: 2 }).notNull(),
  hateSpeechCount: int("hateSpeechCount").default(0).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("low").notNull(),
  population: int("population"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CountySentiment = typeof countySentiments.$inferSelect;
export type InsertCountySentiment = typeof countySentiments.$inferInsert;

/**
 * Kenya news articles and social media posts being analyzed
 * (renamed from contentSources to avoid conflict with Viral Beat tables)
 */
export const kenyaContentSources = mysqlTable("kenya_content_sources", {
  id: int("id").autoincrement().primaryKey(),
  sourceType: mysqlEnum("sourceType", ["news", "twitter", "facebook", "manual"]).notNull(),
  title: varchar("title", { length: 500 }),
  content: text("content").notNull(),
  url: text("url"),
  author: varchar("author", { length: 255 }),
  publishedAt: timestamp("publishedAt"),
  sentimentScore: decimal("sentimentScore", { precision: 5, scale: 2 }),
  hateSpeechRisk: mysqlEnum("hateSpeechRisk", ["Low", "Moderate", "High", "Critical"]),
  relatedFigureId: int("relatedFigureId"),
  relatedCounty: varchar("relatedCounty", { length: 100 }),
  actorType: mysqlEnum("actorType", ["executive", "parliament", "senate", "party", "other"]),
  actorId: int("actorId"),
  phaseId: int("phaseId"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KenyaContentSource = typeof kenyaContentSources.$inferSelect;
export type InsertKenyaContentSource = typeof kenyaContentSources.$inferInsert;

/**
 * Constituencies (290 constituencies mapped to counties)
 */
export const constituencies = mysqlTable("constituencies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  county: varchar("county", { length: 100 }).notNull(),
  region: varchar("region", { length: 100 }),
  registeredVoters: int("registeredVoters"),
  currentMpId: int("currentMpId"),
  dominantParty: varchar("dominantParty", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Constituency = typeof constituencies.$inferSelect;
export type InsertConstituency = typeof constituencies.$inferInsert;

/**
 * Public API keys for third-party developer access.
 */
export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: int("userId").notNull(),
  scopes: json("scopes").$type<string[]>().notNull().default(["trends", "kenya", "ai"]),
  requestsToday: int("requestsToday").notNull().default(0),
  requestsTotal: int("requestsTotal").notNull().default(0),
  dailyLimit: int("dailyLimit").notNull().default(1000),
  lastUsedAt: timestamp("lastUsedAt"),
  resetAt: timestamp("resetAt").defaultNow().notNull(),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * User country profile — stores geo-detected default country and manual override.
 */
export const userCountryProfiles = mysqlTable("user_country_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  defaultCountryCode: varchar("defaultCountryCode", { length: 2 }).notNull(),
  detectedCountryCode: varchar("detectedCountryCode", { length: 2 }),
  detectionMethod: mysqlEnum("detectionMethod", ["ip", "browser", "manual"]).default("browser"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserCountryProfile = typeof userCountryProfiles.$inferSelect;
export type InsertUserCountryProfile = typeof userCountryProfiles.$inferInsert;

/**
 * Africa-wide region sentiment snapshots (one row per country per day).
 */
export const africaRegionSentiments = mysqlTable("africa_region_sentiments", {
  id: int("id").autoincrement().primaryKey(),
  countryCode: varchar("countryCode", { length: 2 }).notNull(),
  region: varchar("region", { length: 50 }).notNull(),
  sentimentScore: decimal("sentimentScore", { precision: 5, scale: 2 }).notNull(),
  stabilityScore: decimal("stabilityScore", { precision: 5, scale: 2 }),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("low").notNull(),
  summary: text("summary"),
  keyThemes: json("keyThemes").$type<string[]>(),
  sourcedFrom: varchar("sourcedFrom", { length: 50 }).default("ai"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});
export type AfricaRegionSentiment = typeof africaRegionSentiments.$inferSelect;
export type InsertAfricaRegionSentiment = typeof africaRegionSentiments.$inferInsert;

/**
 * Africa-wide content sources (news articles, social posts) per country.
 */
export const africaContentSources = mysqlTable("africa_content_sources", {
  id: int("id").autoincrement().primaryKey(),
  countryCode: varchar("countryCode", { length: 2 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["news", "rss", "twitter", "manual"]).notNull(),
  title: varchar("title", { length: 500 }),
  content: text("content").notNull(),
  url: text("url"),
  author: varchar("author", { length: 255 }),
  publishedAt: timestamp("publishedAt"),
  sentimentScore: decimal("sentimentScore", { precision: 5, scale: 2 }),
  riskLevel: mysqlEnum("riskLevel", ["Low", "Moderate", "High", "Critical"]),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AfricaContentSource = typeof africaContentSources.$inferSelect;
export type InsertAfricaContentSource = typeof africaContentSources.$inferInsert;

/**
 * LLM response cache — prevents redundant AI calls.
 * Key: "router:operation:params" e.g. "africa:brief:KE".
 * TTL enforced by expiresAt.
 */
export const llmCache = mysqlTable("llmCache", {
  id: int("id").autoincrement().primaryKey(),
  cacheKey: varchar("cacheKey", { length: 128 }).notNull().unique(),
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  model: varchar("model", { length: 64 }).notNull().default("claude-opus-4-8"),
  inputTokens: int("inputTokens").default(0),
  outputTokens: int("outputTokens").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
}, table => ({
  keyIdx: index("llmCache_key_idx").on(table.cacheKey),
  expiryIdx: index("llmCache_expiry_idx").on(table.expiresAt),
}));
export type LlmCache = typeof llmCache.$inferSelect;
export type InsertLlmCache = typeof llmCache.$inferInsert;

/**
 * Subscription events — audit log for tier changes.
 */
export const subscriptionEvents = mysqlTable("subscriptionEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  event: mysqlEnum("event", ["upgraded", "downgraded", "renewed", "cancelled", "trial_started"]).notNull(),
  fromTier: mysqlEnum("fromTier", ["free", "analyst", "enterprise"]),
  toTier: mysqlEnum("toTier", ["free", "analyst", "enterprise"]).notNull(),
  stripeEventId: varchar("stripeEventId", { length: 128 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SubscriptionEvent = typeof subscriptionEvents.$inferSelect;
export type InsertSubscriptionEvent = typeof subscriptionEvents.$inferInsert;

// ── Signal Ratings ────────────────────────────────────────────────────────────
export const signalRatings = mysqlTable("signalRatings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  messageId: varchar("messageId", { length: 128 }).notNull(),
  topic: varchar("topic", { length: 512 }).notNull(),
  geoLayer: varchar("geoLayer", { length: 32 }).notNull(),
  geoScope: varchar("geoScope", { length: 64 }).notNull(),
  pestelCategory: varchar("pestelCategory", { length: 32 }).notNull(),
  rating: int("rating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userMsg: index("idx_signal_ratings_user_msg").on(t.userId, t.messageId),
  pestel: index("idx_signal_ratings_pestel").on(t.pestelCategory),
}));

export type SignalRating = typeof signalRatings.$inferSelect;
export type InsertSignalRating = typeof signalRatings.$inferInsert;

// ── AfricaScanner Agent ───────────────────────────────────────────────────────

/**
 * One row per agent execution cycle.
 * Tracks what was fetched, how many signals produced, and any errors.
 */
export const agentRuns = mysqlTable("agentRuns", {
  id: int("id").autoincrement().primaryKey(),
  runId: varchar("runId", { length: 36 }).notNull().unique(),           // UUID
  trigger: mysqlEnum("trigger", ["scheduled", "webhook", "manual", "rating_alert"]).notNull().default("scheduled"),
  status: mysqlEnum("status", ["running", "completed", "failed", "partial"]).notNull().default("running"),
  countriesProcessed: int("countriesProcessed").default(0),
  signalsIngested: int("signalsIngested").default(0),
  breakingFlagged: int("breakingFlagged").default(0),
  verdictChanges: int("verdictChanges").default(0),
  errorLog: text("errorLog"),
  durationMs: int("durationMs"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, t => ({
  statusIdx: index("agentRuns_status_idx").on(t.status),
  startedIdx: index("agentRuns_started_idx").on(t.startedAt),
}));
export type AgentRun = typeof agentRuns.$inferSelect;
export type InsertAgentRun = typeof agentRuns.$inferInsert;

/**
 * Processed intelligence signal — one row per unique event/artefact.
 * Written by the agent after classify + deduplicate + score steps.
 */
export const scannerSignals = mysqlTable("scannerSignals", {
  id: int("id").autoincrement().primaryKey(),
  signalId: varchar("signalId", { length: 64 }).notNull().unique(),     // semantic hash
  runId: varchar("runId", { length: 36 }),                              // FK → agentRuns.runId
  countryCode: varchar("countryCode", { length: 3 }).notNull(),         // ISO 3166-1 alpha-3
  dim: mysqlEnum("dim", ["P","E","S","T","En","L","IR"]).notNull(),      // PESTEL + IR
  severity: mysqlEnum("severity", ["normal","alert","breaking"]).notNull().default("normal"),
  headline: varchar("headline", { length: 600 }).notNull(),
  body: text("body"),
  deltaScore: decimal("deltaScore", { precision: 5, scale: 2 }).default("0"),  // impact on composite
  deltaDir: mysqlEnum("deltaDir", ["up","down","neutral"]).default("neutral"),
  verdictBefore: varchar("verdictBefore", { length: 20 }),
  verdictAfter: varchar("verdictAfter", { length: 20 }),
  source: varchar("source", { length: 255 }).notNull(),
  sourceUrl: text("sourceUrl"),
  sourceType: mysqlEnum("sourceType", ["rating_agency","ifi","press","government","field","rss"]).notNull(),
  publishedAt: timestamp("publishedAt"),
  ingestedAt: timestamp("ingestedAt").defaultNow().notNull(),
}, t => ({
  countryIdx: index("scannerSignals_country_idx").on(t.countryCode),
  severityIdx: index("scannerSignals_severity_idx").on(t.severity),
  dimIdx:      index("scannerSignals_dim_idx").on(t.dim),
  ingestedIdx: index("scannerSignals_ingested_idx").on(t.ingestedAt),
}));
export type ScannerSignal = typeof scannerSignals.$inferSelect;
export type InsertScannerSignal = typeof scannerSignals.$inferInsert;

/**
 * Ticker items — what the IntelligenceTicker component renders.
 * Agent writes here after severity classification; dismissed after 72h.
 */
export const tickerItems = mysqlTable("tickerItems", {
  id: int("id").autoincrement().primaryKey(),
  signalId: varchar("signalId", { length: 64 }).notNull(),              // FK → scannerSignals
  countryCode: varchar("countryCode", { length: 3 }).notNull(),
  countryFlag: varchar("countryFlag", { length: 8 }).notNull(),
  countryName: varchar("countryName", { length: 100 }).notNull(),
  severity: mysqlEnum("severity", ["normal","breaking"]).notNull().default("normal"),
  headline: varchar("headline", { length: 300 }).notNull(),
  deltaLabel: varchar("deltaLabel", { length: 80 }),                    // "▲ +6 pts" or "Monitor → Go-Market"
  deltaDir: mysqlEnum("deltaDir", ["up","down"]),
  verdictKey: varchar("verdictKey", { length: 20 }),
  verdictLabel: varchar("verdictLabel", { length: 30 }),
  source: varchar("source", { length: 120 }).notNull(),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expiresAt").notNull(),                          // auto-expire after 72h
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, t => ({
  activeIdx:   index("tickerItems_active_idx").on(t.active),
  expiresIdx:  index("tickerItems_expires_idx").on(t.expiresAt),
  severityIdx: index("tickerItems_severity_idx").on(t.severity),
}));
export type TickerItem = typeof tickerItems.$inferSelect;
export type InsertTickerItem = typeof tickerItems.$inferInsert;

// ── Report Archive ────────────────────────────────────────────────────────────

/**
 * Master record for every report generated on VB.
 * Covers document-upload analyses, signal briefs, Go/No-Go entries,
 * and automated agent reports. Access is gated by visibility tier.
 */
export const reportArchive = mysqlTable("reportArchive", {
  id:             int("id").autoincrement().primaryKey(),
  reportId:       varchar("reportId", { length: 36 }).notNull().unique(),   // UUID
  authorId:       int("authorId"),                                           // FK → users.id (null = agent-generated)
  sessionId:      varchar("sessionId", { length: 64 }),                     // chat session that produced it
  reportType:     mysqlEnum("reportType", [
    "document_analysis",   // uploaded doc → AI brief
    "signal_brief",        // PESTEL signal analysis
    "go_no_go",            // country entry verdict
    "agent_report",        // AfricaScanner automated
    "custom",
  ]).notNull(),

  // Content
  title:          varchar("title", { length: 300 }).notNull(),
  bodyMd:         text("bodyMd").notNull(),                                  // full markdown
  summaryText:    varchar("summaryText", { length: 500 }),                   // ≤500-char abstract
  sourceDocName:  varchar("sourceDocName", { length: 255 }),                 // original upload filename
  wordCount:      int("wordCount").default(0),

  // Classification
  countryCodes:   json("countryCodes").$type<string[]>().default([]),        // ISO3 codes
  pestelDims:     json("pestelDims").$type<string[]>().default([]),          // P/E/S/T/En/L/IR
  sector:         varchar("sector", { length: 100 }),
  verdictKey:     varchar("verdictKey", { length: 20 }),                     // go-market|monitor|caution|no-go
  signalIds:      json("signalIds").$type<string[]>().default([]),           // FK → scannerSignals.signalId

  // Access control
  visibility:     mysqlEnum("visibility", ["public","free","premium","private"]).notNull().default("private"),
  isArchived:     boolean("isArchived").notNull().default(false),
  archivedAt:     timestamp("archivedAt"),
  expiresAt:      timestamp("expiresAt"),                                    // null = never expires

  // Engagement
  viewCount:      int("viewCount").notNull().default(0),
  downloadCount:  int("downloadCount").notNull().default(0),
  saveCount:      int("saveCount").notNull().default(0),
  citedByCount:   int("citedByCount").notNull().default(0),
  qualityScore:   decimal("qualityScore", { precision: 4, scale: 3 }).default("0"), // 0–1, updated by memory pipeline

  // Memory flags
  usedForMemory:  boolean("usedForMemory").notNull().default(false),
  memoryWeight:   decimal("memoryWeight", { precision: 4, scale: 3 }).default("0"), // 0–1
  vectorEmbedded: boolean("vectorEmbedded").notNull().default(false),
  embeddingId:    varchar("embeddingId", { length: 64 }),                   // ref to vector store
  lastIndexedAt:  timestamp("lastIndexedAt"),

  // Contributor reward
  contributorTier: varchar("contributorTier", { length: 30 }),              // observer|analyst|correspondent
  vbtEarned:      int("vbtEarned").notNull().default(0),
  licenseType:    mysqlEnum("licenseType", ["cc_by","cc_by_nc","proprietary","vb_standard"]).default("vb_standard"),
  citationKey:    varchar("citationKey", { length: 100 }),                  // VB-KEN-2026-001 style

  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
}, t => ({
  authorIdx:      index("reportArchive_author_idx").on(t.authorId),
  typeIdx:        index("reportArchive_type_idx").on(t.reportType),
  visibilityIdx:  index("reportArchive_visibility_idx").on(t.visibility, t.isArchived),
  qualityIdx:     index("reportArchive_quality_idx").on(t.qualityScore),
  createdIdx:     index("reportArchive_created_idx").on(t.createdAt),
  verdictIdx:     index("reportArchive_verdict_idx").on(t.verdictKey),
}));
export type ReportArchive = typeof reportArchive.$inferSelect;
export type InsertReportArchive = typeof reportArchive.$inferInsert;

/**
 * Tracks who has saved / bookmarked a report.
 */
export const reportSaves = mysqlTable("reportSaves", {
  id:        int("id").autoincrement().primaryKey(),
  userId:    int("userId").notNull(),
  reportId:  varchar("reportId", { length: 36 }).notNull(),
  savedAt:   timestamp("savedAt").defaultNow().notNull(),
}, t => ({
  unique:    index("reportSaves_unique_idx").on(t.userId, t.reportId),
}));
export type ReportSave = typeof reportSaves.$inferSelect;

/**
 * Named entities extracted from archived reports — feeds the country knowledge graph.
 * One row per entity mention per report.
 */
export const reportEntities = mysqlTable("reportEntities", {
  id:          int("id").autoincrement().primaryKey(),
  reportId:    varchar("reportId", { length: 36 }).notNull(),
  countryCode: varchar("countryCode", { length: 3 }),
  entityType:  mysqlEnum("entityType", [
    "person",       // political figure, executive
    "organisation", // ministry, party, firm, IFI
    "policy",       // law, regulation, programme
    "event",        // election, protest, summit
    "place",        // city, region, border zone
  ]).notNull(),
  entityName:  varchar("entityName", { length: 200 }).notNull(),
  pestelDim:   mysqlEnum("pestelDim", ["P","E","S","T","En","L","IR"]),
  sentiment:   mysqlEnum("sentiment", ["positive","negative","neutral"]),
  confidence:  decimal("confidence", { precision: 4, scale: 3 }).default("0"),
  extractedAt: timestamp("extractedAt").defaultNow().notNull(),
}, t => ({
  reportIdx:  index("reportEntities_report_idx").on(t.reportId),
  entityIdx:  index("reportEntities_entity_idx").on(t.entityName),
  countryIdx: index("reportEntities_country_idx").on(t.countryCode, t.entityType),
}));
export type ReportEntity = typeof reportEntities.$inferSelect;
export type InsertReportEntity = typeof reportEntities.$inferInsert;

/**
 * Memory context log — records when archived reports were injected into a session.
 * Used to avoid re-injecting the same context and to audit memory influence.
 */
export const memoryInjections = mysqlTable("memoryInjections", {
  id:          int("id").autoincrement().primaryKey(),
  sessionId:   varchar("sessionId", { length: 64 }).notNull(),
  reportId:    varchar("reportId", { length: 36 }).notNull(),
  countryCode: varchar("countryCode", { length: 3 }),
  similarity:  decimal("similarity", { precision: 5, scale: 4 }),           // cosine score 0–1
  injectedAt:  timestamp("injectedAt").defaultNow().notNull(),
}, t => ({
  sessionIdx: index("memoryInjections_session_idx").on(t.sessionId),
  reportIdx:  index("memoryInjections_report_idx").on(t.reportId),
}));
export type MemoryInjection = typeof memoryInjections.$inferSelect;
export type InsertMemoryInjection = typeof memoryInjections.$inferInsert;

// ── Signal Watchlists ─────────────────────────────────────────────────────────

/**
 * User-defined standing watches on country/PESTEL/sector combinations.
 * Agent checks these on each scanner cycle and logs matches.
 */
export const signalWatchlists = mysqlTable("signalWatchlists", {
  id:                int("id").autoincrement().primaryKey(),
  watchId:           varchar("watchId", { length: 36 }).notNull().unique(),  // UUID
  userId:            int("userId").notNull(),
  label:             varchar("label", { length: 200 }).notNull(),            // user-defined name
  countryCodes:      json("countryCodes").$type<string[]>().default([]),     // ISO3 codes, empty = all
  pestelDims:        json("pestelDims").$type<string[]>().default([]),       // P/E/S/T/En/L/IR
  sector:            varchar("sector", { length: 100 }),                     // optional sector filter
  keywords:          json("keywords").$type<string[]>().default([]),         // headline keyword match
  thresholdSeverity: mysqlEnum("thresholdSeverity", ["normal","alert","breaking"]).notNull().default("alert"),
  isActive:          boolean("isActive").notNull().default(true),
  triggerCount:      int("triggerCount").notNull().default(0),
  lastTriggeredAt:   timestamp("lastTriggeredAt"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
}, t => ({
  userIdx:    index("signalWatchlists_user_idx").on(t.userId),
  activeIdx:  index("signalWatchlists_active_idx").on(t.isActive),
}));
export type SignalWatchlist = typeof signalWatchlists.$inferSelect;
export type InsertSignalWatchlist = typeof signalWatchlists.$inferInsert;

// ── GIaaS: Green Investment as a Service ────────────────────────────────────

export const greenProjects = mysqlTable("greenProjects", {
  id:                   int("id").autoincrement().primaryKey(),
  projectId:            varchar("projectId", { length: 36 }).notNull().unique(),
  title:                varchar("title", { length: 255 }).notNull(),
  developer:            varchar("developer", { length: 255 }).notNull(),
  sector:               mysqlEnum("sector", ["renewable_energy", "reit", "agriculture"]).notNull(),
  countryCode:          varchar("countryCode", { length: 3 }).notNull(),  // ISO3
  countryName:          varchar("countryName", { length: 100 }).notNull(),
  description:          text("description").notNull(),
  claimedCo2Reduction:  decimal("claimedCo2Reduction", { precision: 12, scale: 2 }), // tonnes CO2
  claimedJobsCreated:   int("claimedJobsCreated"),
  claimedCapacityMw:    decimal("claimedCapacityMw", { precision: 10, scale: 2 }),   // MW for energy
  budget:               decimal("budget", { precision: 15, scale: 2 }),               // USD
  startDate:            varchar("startDate", { length: 10 }),
  endDate:              varchar("endDate", { length: 10 }),
  certifications:       json("certifications").$type<string[]>().default([]),
  sectorMetrics:        json("sectorMetrics").$type<Record<string, string | number>>().default({}),
  status:               mysqlEnum("status", ["pending", "active", "validated", "flagged"]).notNull().default("pending"),
  giaasScore:           decimal("giaasScore", { precision: 5, scale: 2 }),
  politicalRiskScore:   decimal("politicalRiskScore", { precision: 5, scale: 2 }),
  submittedBy:          int("submittedBy"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, t => ({
  countryIdx: index("greenProjects_country_idx").on(t.countryCode),
  sectorIdx:  index("greenProjects_sector_idx").on(t.sector),
  statusIdx:  index("greenProjects_status_idx").on(t.status),
}));
export type GreenProject = typeof greenProjects.$inferSelect;
export type InsertGreenProject = typeof greenProjects.$inferInsert;

export const greenSubmissions = mysqlTable("greenSubmissions", {
  id:               int("id").autoincrement().primaryKey(),
  submissionId:     varchar("submissionId", { length: 36 }).notNull().unique(),
  projectId:        varchar("projectId", { length: 36 }).notNull(),
  userId:           int("userId").notNull(),
  observationType:  mysqlEnum("observationType", ["site_visit", "photo", "community_report", "sensor"]).notNull(),
  content:          text("content").notNull(),
  photoUrls:        json("photoUrls").$type<string[]>().default([]),
  geoLat:           decimal("geoLat", { precision: 10, scale: 7 }),
  geoLng:           decimal("geoLng", { precision: 10, scale: 7 }),
  confirms:         boolean("confirms").notNull(),  // true=supports claims, false=disputes
  confidenceLevel:  mysqlEnum("confidenceLevel", ["low", "medium", "high"]).notNull().default("medium"),
  status:           mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
  qualityScore:     decimal("qualityScore", { precision: 3, scale: 2 }),
  vbtRewarded:      int("vbtRewarded").default(0),
  rewardedAt:       timestamp("rewardedAt"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
}, t => ({
  projectIdx: index("greenSubmissions_project_idx").on(t.projectId),
  userIdx:    index("greenSubmissions_user_idx").on(t.userId),
  statusIdx:  index("greenSubmissions_status_idx").on(t.status),
}));
export type GreenSubmission = typeof greenSubmissions.$inferSelect;
export type InsertGreenSubmission = typeof greenSubmissions.$inferInsert;

export const greenValidations = mysqlTable("greenValidations", {
  id:               int("id").autoincrement().primaryKey(),
  validationId:     varchar("validationId", { length: 36 }).notNull().unique(),
  projectId:        varchar("projectId", { length: 36 }).notNull(),
  runAt:            timestamp("runAt").defaultNow().notNull(),
  citizenDataPoints: int("citizenDataPoints").notNull().default(0),
  confirmsCount:    int("confirmsCount").notNull().default(0),
  disputesCount:    int("disputesCount").notNull().default(0),
  divergenceScore:  decimal("divergenceScore", { precision: 5, scale: 2 }),  // 0-100, higher = greenwashing risk
  confidenceScore:  decimal("confidenceScore", { precision: 5, scale: 2 }),  // 0-100
  verdict:          mysqlEnum("verdict", ["verified", "inconclusive", "flagged", "greenwashing"]).notNull(),
  verdictSummary:   text("verdictSummary"),
  giaasScore:       decimal("giaasScore", { precision: 5, scale: 2 }),
  claimsAnalysis:   json("claimsAnalysis").$type<Record<string, any>>().default({}),
  triggeredAlert:   boolean("triggeredAlert").default(false),
  triggeredBy:      int("triggeredBy"),
}, t => ({
  projectIdx: index("greenValidations_project_idx").on(t.projectId),
}));
export type GreenValidation = typeof greenValidations.$inferSelect;
export type InsertGreenValidation = typeof greenValidations.$inferInsert;

export const giaasDataFeeds = mysqlTable("giaasDataFeeds", {
  id:               int("id").autoincrement().primaryKey(),
  feedId:           varchar("feedId", { length: 36 }).notNull().unique(),
  submittedBy:      int("submittedBy"),                                        // null = anonymous
  feedType:         mysqlEnum("feedType", ["url", "document_url", "text"]).notNull(),
  url:              text("url"),                                                // public web URL
  documentUrl:      text("documentUrl"),                                        // PDF / GDocs / public doc link
  textContent:      text("textContent"),                                        // pasted text
  title:            varchar("title", { length: 255 }),
  description:      varchar("description", { length: 500 }),
  countryHints:     json("countryHints").$type<string[]>().default([]),         // ISO3 codes this data relates to
  sectorHints:      json("sectorHints").$type<string[]>().default([]),          // renewable_energy|reit|agriculture
  status:           mysqlEnum("status", ["pending", "ingested", "failed"]).notNull().default("pending"),
  ingestedAt:       timestamp("ingestedAt"),
  projectsCreated:  int("projectsCreated").default(0),
  errorMessage:     text("errorMessage"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
}, t => ({
  statusIdx: index("giaasDataFeeds_status_idx").on(t.status),
  userIdx:   index("giaasDataFeeds_user_idx").on(t.submittedBy),
}));
export type GiaasDataFeed = typeof giaasDataFeeds.$inferSelect;
export type InsertGiaasDataFeed = typeof giaasDataFeeds.$inferInsert;

/**
 * Intelligence Bulletins — monthly Africa Intelligence newsletter archive
 */
export const intelligenceBulletins = mysqlTable("intelligenceBulletins", {
  id:           int("id").autoincrement().primaryKey(),
  slug:         varchar("slug", { length: 128 }).notNull().unique(), // e.g. "2026-07"
  issueNumber:  int("issueNumber").notNull(),
  title:        varchar("title", { length: 512 }).notNull(),
  summary:      text("summary").notNull(),           // 1-2 sentence teaser shown on archive page
  htmlContent:  longtext("htmlContent").notNull(),   // full rendered HTML for the issue viewer
  sections:     json("sections").notNull(),          // structured JSON: leadStory, signals[], verdictShifts[], fieldObservations[], giaasSpotlight
  coverCountries: json("coverCountries"),            // string[] iso3 codes featured this issue
  stats: json("stats"),                              // { breakingShifts, greenProjects, fieldSignals, verdictsChanged }
  status:       mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  publishedAt:  timestamp("publishedAt"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, t => ({
  statusIdx:    index("bulletins_status_idx").on(t.status),
  publishedIdx: index("bulletins_published_idx").on(t.publishedAt),
}));
export type IntelligenceBulletin = typeof intelligenceBulletins.$inferSelect;
export type InsertIntelligenceBulletin = typeof intelligenceBulletins.$inferInsert;

/**
 * Agent Memory — persistent key/value store for Claude agent context.
 * Stores facts, summaries, decisions, and session context across runs.
 */
export const agentMemory = mysqlTable("agentMemory", {
  id:         int("id").autoincrement().primaryKey(),
  key:        varchar("key", { length: 255 }).notNull().unique(),
  value:      longtext("value").notNull(),
  category:   varchar("category", { length: 64 }).notNull().default("general"),
  tags:       json("tags"),                          // string[] for flexible search
  metadata:   json("metadata"),                      // arbitrary extra context
  source:     varchar("source", { length: 128 }),    // which agent/session wrote it
  expiresAt:  timestamp("expiresAt"),                // null = permanent
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
  updatedAt:  timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, t => ({
  categoryIdx: index("agentMemory_category_idx").on(t.category),
  expiresIdx:  index("agentMemory_expires_idx").on(t.expiresAt),
}));
export type AgentMemory = typeof agentMemory.$inferSelect;
export type InsertAgentMemory = typeof agentMemory.$inferInsert;

/**
 * OSS (One-Stop-Shop) contributions — community-sourced investment-facilitation
 * data submitted by contributors for countries missing or needing updated OSS
 * records (e.g. Uganda's UFZEPA). Reviewed before promotion into OSS_DATA.
 */
export const ossSubmissions = mysqlTable("ossSubmissions", {
  id:           int("id").autoincrement().primaryKey(),
  countryCode:  varchar("countryCode", { length: 3 }).notNull(),   // ISO3
  countryName:  varchar("countryName", { length: 100 }).notNull(),
  kind:         mysqlEnum("kind", ["new", "update"]).notNull().default("new"),
  name:         varchar("name", { length: 200 }).notNull(),        // OSS / agency name
  acronym:      varchar("acronym", { length: 40 }),
  mandate:      text("mandate"),
  location:     varchar("location", { length: 255 }),
  website:      varchar("website", { length: 255 }),
  operatingHours: varchar("operatingHours", { length: 120 }),
  legalBasis:   varchar("legalBasis", { length: 255 }),
  established:   int("established"),
  services:     json("services"),                                  // string[] of offered services
  offers:       json("offers"),                                    // string[] of incentives
  linkedZones:  json("linkedZones"),                               // string[] of free zones / SEZs
  sourceUrl:    varchar("sourceUrl", { length: 500 }),             // evidence link
  notes:        text("notes"),
  contributorId:   varchar("contributorId", { length: 128 }),      // user id (nullable for anon)
  contributorName: varchar("contributorName", { length: 160 }),
  contributorEmail: varchar("contributorEmail", { length: 200 }),
  status:       mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
  reviewNote:   text("reviewNote"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, t => ({
  countryIdx: index("ossSubmissions_country_idx").on(t.countryCode),
  statusIdx:  index("ossSubmissions_status_idx").on(t.status),
}));
export type OssSubmission = typeof ossSubmissions.$inferSelect;
export type InsertOssSubmission = typeof ossSubmissions.$inferInsert;

/**
 * SME Exchange listings — Phase 1 "IPO" onboarding. SMEs submit a business
 * profile and self-assessed readiness; reviewed before appearing on the
 * Open Innovation / Capital-Ready boards. ERS gate = 61.
 */
export const smeListings = mysqlTable("smeListings", {
  id:           int("id").autoincrement().primaryKey(),
  name:         varchar("name", { length: 200 }).notNull(),
  sector:       varchar("sector", { length: 100 }).notNull(),
  countryCode:  varchar("countryCode", { length: 3 }).notNull(),
  countryName:  varchar("countryName", { length: 100 }).notNull(),
  location:     varchar("location", { length: 255 }),
  website:      varchar("website", { length: 255 }),
  foundedYear:  int("foundedYear"),
  ownership:    varchar("ownership", { length: 120 }),
  employees:    varchar("employees", { length: 60 }),
  summary:      text("summary"),
  products:     text("products"),
  // self-assessed ERS pillars (0–100), composite stored in `ers`
  governance:   int("governance").default(0),
  financial:    int("financial").default(0),
  innovation:   int("innovation").default(0),
  market:       int("market").default(0),
  ers:          int("ers").default(0),
  statusTags:   json("statusTags"),       // string[] — Seeking capital, Open to collaboration, Open to exit
  certifications: json("certifications"),  // string[]
  exportMarkets:  json("exportMarkets"),   // string[]
  awards:         json("awards"),          // string[]
  contactName:  varchar("contactName", { length: 160 }),
  contactEmail: varchar("contactEmail", { length: 200 }),
  contactPhone: varchar("contactPhone", { length: 60 }),
  contributorId: varchar("contributorId", { length: 128 }),
  status:       mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
  reviewNote:   text("reviewNote"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, t => ({
  countryIdx: index("smeListings_country_idx").on(t.countryCode),
  statusIdx:  index("smeListings_status_idx").on(t.status),
}));
export type SmeListing = typeof smeListings.$inferSelect;
export type InsertSmeListing = typeof smeListings.$inferInsert;
