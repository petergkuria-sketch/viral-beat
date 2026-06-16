import { int, mysqlTable, text, timestamp, varchar, mysqlEnum, boolean, bigint, json, decimal } from "drizzle-orm/mysql-core";

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
  category: mysqlEnum("category", ["general", "tech", "entertainment", "sports", "politics", "business"]).notNull(),
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
  contentType: mysqlEnum("contentType", ["video", "image", "text", "audio"]).notNull(),
  platform: mysqlEnum("platform", ["youtube", "tiktok", "instagram", "twitter"]).notNull(),
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
  analysisType: mysqlEnum("analysisType", ["pre_publish", "post_publish", "competitor"]).notNull(),
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
