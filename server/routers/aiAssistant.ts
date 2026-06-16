import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  aiAssistantProfiles, 
  assistantConversations, 
  contentAnalyses, 
  assistantTasks,
  creatorGoals 
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { randomBytes } from "crypto";

export const aiAssistantRouter = router({
  // Get or create AI assistant profile for current user
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [profile] = await db
      .select()
      .from(aiAssistantProfiles)
      .where(eq(aiAssistantProfiles.userId, ctx.user.id))
      .limit(1);

    if (!profile) {
      // Create default profile
      const [newProfile] = await db.insert(aiAssistantProfiles).values({
        userId: ctx.user.id,
        onboardingCompleted: false,
      });
      
      return db
        .select()
        .from(aiAssistantProfiles)
        .where(eq(aiAssistantProfiles.id, newProfile.insertId))
        .limit(1)
        .then((rows) => rows[0]);
    }

    return profile;
  }),

  // Update AI assistant profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        niche: z.string().optional(),
        primaryPlatform: z.enum(["youtube", "tiktok", "instagram", "twitter"]).optional(),
        audienceSize: z.number().optional(),
        averageViews: z.number().optional(),
        contentStyle: z.string().optional(), // JSON string
        goals: z.string().optional(), // JSON string
        challenges: z.string().optional(), // JSON string
        onboardingCompleted: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(aiAssistantProfiles)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(aiAssistantProfiles.userId, ctx.user.id));

      return { success: true };
    }),

  // Complete onboarding questionnaire
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        niche: z.string(),
        primaryPlatform: z.enum(["youtube", "tiktok", "instagram", "twitter"]),
        audienceSize: z.number(),
        averageViews: z.number(),
        contentTopics: z.array(z.string()),
        tone: z.string(),
        format: z.string(),
        goals: z.object({
          shortTerm: z.string(),
          longTerm: z.string(),
        }),
        challenges: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const contentStyle = JSON.stringify({
        tone: input.tone,
        format: input.format,
        topics: input.contentTopics,
      });

      const goals = JSON.stringify(input.goals);
      const challenges = JSON.stringify(input.challenges);

      // Check if profile exists
      const [existing] = await db
        .select()
        .from(aiAssistantProfiles)
        .where(eq(aiAssistantProfiles.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db
          .update(aiAssistantProfiles)
          .set({
            niche: input.niche,
            primaryPlatform: input.primaryPlatform,
            audienceSize: input.audienceSize,
            averageViews: input.averageViews,
            contentStyle,
            goals,
            challenges,
            onboardingCompleted: true,
            updatedAt: new Date(),
          })
          .where(eq(aiAssistantProfiles.userId, ctx.user.id));
      } else {
        await db.insert(aiAssistantProfiles).values({
          userId: ctx.user.id,
          niche: input.niche,
          primaryPlatform: input.primaryPlatform,
          audienceSize: input.audienceSize,
          averageViews: input.averageViews,
          contentStyle,
          goals,
          challenges,
          onboardingCompleted: true,
        });
      }

      return { success: true };
    }),

  // Send message to AI assistant
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        sessionId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const sessionId = input.sessionId || randomBytes(16).toString("hex");

      // Get user's AI assistant profile
      const [profile] = await db
        .select()
        .from(aiAssistantProfiles)
        .where(eq(aiAssistantProfiles.userId, ctx.user.id))
        .limit(1);

      // Get recent conversation history
      const history = await db
        .select()
        .from(assistantConversations)
        .where(
          and(
            eq(assistantConversations.userId, ctx.user.id),
            eq(assistantConversations.sessionId, sessionId)
          )
        )
        .orderBy(desc(assistantConversations.createdAt))
        .limit(10);

      // Save user message
      await db.insert(assistantConversations).values({
        userId: ctx.user.id,
        sessionId,
        role: "user",
        message: input.message,
      });

      // Build context for AI
      const systemPrompt = `You are ViralMind, an AI personal assistant specialized in helping content creators achieve viral success. 

Creator Profile:
- Name: ${ctx.user.name}
- Niche: ${profile?.niche || "Not specified"}
- Platform: ${profile?.primaryPlatform || "Not specified"}
- Audience Size: ${profile?.audienceSize || "Not specified"}
- Content Style: ${profile?.contentStyle || "Not specified"}
- Goals: ${profile?.goals || "Not specified"}
- Challenges: ${profile?.challenges || "Not specified"}

Your role is to:
1. Analyze content for virality potential
2. Recommend trending topics in their niche
3. Optimize titles, thumbnails, and hashtags
4. Suggest optimal posting times
5. Provide actionable growth strategies
6. Solve specific content creation problems

Be friendly, motivating, and provide specific, actionable advice. Use data and examples when possible.`;

      // Build conversation messages
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
        ...history.reverse().map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.message,
        })),
        { role: "user", content: input.message },
      ];

      // Call LLM
      const response = await invokeLLM({ messages });
      const messageContent = response.choices[0]?.message?.content;
      const assistantMessage = typeof messageContent === 'string' ? messageContent : "I'm sorry, I couldn't process that request.";

      // Save assistant response
      await db.insert(assistantConversations).values({
        userId: ctx.user.id,
        sessionId,
        role: "assistant",
        message: assistantMessage,
      });

      return {
        message: assistantMessage,
        sessionId,
      };
    }),

  // Get conversation history
  getConversations: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const conditions = [eq(assistantConversations.userId, ctx.user.id)];
      
      if (input.sessionId) {
        conditions.push(eq(assistantConversations.sessionId, input.sessionId));
      }

      return db
        .select()
        .from(assistantConversations)
        .where(and(...conditions))
        .orderBy(desc(assistantConversations.createdAt))
        .limit(input.limit);
    }),

  // Analyze content for virality
  analyzeContent: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        contentUrl: z.string().optional(),
        contentType: z.enum(["video", "image", "text", "audio"]),
        platform: z.enum(["youtube", "tiktok", "instagram", "twitter"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get user profile for context
      const [profile] = await db
        .select()
        .from(aiAssistantProfiles)
        .where(eq(aiAssistantProfiles.userId, ctx.user.id))
        .limit(1);

      // Analyze with AI
      const analysisPrompt = `Analyze this content for virality potential:

Title: ${input.title}
Description: ${input.description || "N/A"}
Type: ${input.contentType}
Platform: ${input.platform}
Creator Niche: ${profile?.niche || "General"}

Provide a detailed analysis in JSON format with:
1. viralityScore (0-10)
2. strengths (array of 3-5 key strengths)
3. weaknesses (array of 3-5 areas for improvement)
4. recommendations (array of 5-7 specific, actionable suggestions)
5. optimizedTitle (improved version of the title)
6. optimizedHashtags (array of 5-10 relevant hashtags)
7. predictedViews (estimated view count range)
8. predictedEngagement (estimated engagement rate %)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a viral content analysis expert." },
          { role: "user", content: analysisPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "content_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                viralityScore: { type: "number" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } },
                optimizedTitle: { type: "string" },
                optimizedHashtags: { type: "array", items: { type: "string" } },
                predictedViews: { type: "string" },
                predictedEngagement: { type: "string" },
              },
              required: [
                "viralityScore",
                "strengths",
                "weaknesses",
                "recommendations",
                "optimizedTitle",
                "optimizedHashtags",
                "predictedViews",
                "predictedEngagement",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const analysisContent = response.choices[0]?.message?.content;
      const analysis = JSON.parse(typeof analysisContent === 'string' ? analysisContent : "{}");

      // Save analysis to database
      await db.insert(contentAnalyses).values({
        userId: ctx.user.id,
        contentTitle: input.title,
        contentUrl: input.contentUrl,
        contentType: input.contentType,
        platform: input.platform,
        viralityScore: analysis.viralityScore.toString(),
        strengths: JSON.stringify(analysis.strengths),
        weaknesses: JSON.stringify(analysis.weaknesses),
        recommendations: JSON.stringify(analysis.recommendations),
        optimizedTitle: analysis.optimizedTitle,
        optimizedHashtags: JSON.stringify(analysis.optimizedHashtags),
        predictedPerformance: JSON.stringify({
          views: analysis.predictedViews,
          engagement: analysis.predictedEngagement,
        }),
        analysisType: "pre_publish",
      });

      return analysis;
    }),

  // Get content analysis history
  getAnalyses: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db
        .select()
        .from(contentAnalyses)
        .where(eq(contentAnalyses.userId, ctx.user.id))
        .orderBy(desc(contentAnalyses.createdAt))
        .limit(input.limit);
    }),

  // Create a goal
  createGoal: protectedProcedure
    .input(
      z.object({
        goalType: z.enum(["followers", "views", "engagement", "revenue", "custom"]),
        title: z.string(),
        description: z.string().optional(),
        targetValue: z.number(),
        deadline: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(creatorGoals).values({
        userId: ctx.user.id,
        goalType: input.goalType,
        title: input.title,
        description: input.description,
        targetValue: input.targetValue,
        deadline: input.deadline,
        currentValue: 0,
        status: "active",
      });

      return { success: true };
    }),

  // Get active goals
  getGoals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db
      .select()
      .from(creatorGoals)
      .where(
        and(
          eq(creatorGoals.userId, ctx.user.id),
          eq(creatorGoals.status, "active")
        )
      )
      .orderBy(desc(creatorGoals.createdAt));
  }),

  // Update goal progress
  updateGoalProgress: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        currentValue: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get goal
      const [goal] = await db
        .select()
        .from(creatorGoals)
        .where(
          and(
            eq(creatorGoals.id, input.goalId),
            eq(creatorGoals.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!goal) {
        throw new Error("Goal not found");
      }

      // Check if goal is completed
      const isCompleted = input.currentValue >= goal.targetValue;

      await db
        .update(creatorGoals)
        .set({
          currentValue: input.currentValue,
          status: isCompleted ? "completed" : "active",
          completedAt: isCompleted ? new Date() : null,
        })
        .where(eq(creatorGoals.id, input.goalId));

      return { success: true, completed: isCompleted };
    }),

  // Generate verification code for social media linking
  generateVerificationCode: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["youtube", "tiktok", "instagram", "twitter"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Generate 6-character alphanumeric code
      const code = randomBytes(3).toString('hex').toUpperCase();
      const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Update profile with verification code
      await db
        .update(aiAssistantProfiles)
        .set({
          verificationCode: code,
          verificationCodeExpiry: expiry,
        })
        .where(eq(aiAssistantProfiles.userId, ctx.user.id));

      return {
        code,
        expiresAt: expiry,
        platform: input.platform,
        instructions: `Post "ViralBeat Verification: ${code}" on your ${input.platform} profile or bio to verify ownership.`,
      };
    }),

  // Link social media handle
  linkSocialHandle: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["youtube", "tiktok", "instagram", "twitter"]),
        handle: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get profile
      const [profile] = await db
        .select()
        .from(aiAssistantProfiles)
        .where(eq(aiAssistantProfiles.userId, ctx.user.id))
        .limit(1);

      if (!profile) {
        throw new Error("Profile not found");
      }

      // Update handle based on platform
      const updateData: any = {};
      if (input.platform === "youtube") {
        updateData.youtubeHandle = input.handle;
      } else if (input.platform === "tiktok") {
        updateData.tiktokHandle = input.handle;
      } else if (input.platform === "instagram") {
        updateData.instagramHandle = input.handle;
      } else if (input.platform === "twitter") {
        updateData.twitterHandle = input.handle;
      }

      await db
        .update(aiAssistantProfiles)
        .set(updateData)
        .where(eq(aiAssistantProfiles.userId, ctx.user.id));

      return { success: true, message: `${input.platform} handle linked successfully` };
    }),

  // Verify social media handle (manual verification for now)
  verifySocialHandle: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["youtube", "tiktok", "instagram", "twitter"]),
        verificationCode: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get profile
      const [profile] = await db
        .select()
        .from(aiAssistantProfiles)
        .where(eq(aiAssistantProfiles.userId, ctx.user.id))
        .limit(1);

      if (!profile) {
        throw new Error("Profile not found");
      }

      // Check verification code
      if (
        !profile.verificationCode ||
        profile.verificationCode !== input.verificationCode
      ) {
        throw new Error("Invalid verification code");
      }

      // Check expiry
      if (
        !profile.verificationCodeExpiry ||
        profile.verificationCodeExpiry < new Date()
      ) {
        throw new Error("Verification code expired");
      }

      // Mark platform as verified
      const updateData: any = {
        verificationCode: null,
        verificationCodeExpiry: null,
      };

      if (input.platform === "youtube") {
        updateData.youtubeVerified = true;
      } else if (input.platform === "tiktok") {
        updateData.tiktokVerified = true;
      } else if (input.platform === "instagram") {
        updateData.instagramVerified = true;
      } else if (input.platform === "twitter") {
        updateData.twitterVerified = true;
      }

      await db
        .update(aiAssistantProfiles)
        .set(updateData)
        .where(eq(aiAssistantProfiles.userId, ctx.user.id));

      return {
        success: true,
        message: `${input.platform} account verified successfully`,
        verified: true,
      };
    }),

  // Get verification status for all platforms
  getVerificationStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [profile] = await db
      .select()
      .from(aiAssistantProfiles)
      .where(eq(aiAssistantProfiles.userId, ctx.user.id))
      .limit(1);

    if (!profile) {
      return {
        youtube: { handle: null, verified: false },
        tiktok: { handle: null, verified: false },
        instagram: { handle: null, verified: false },
        twitter: { handle: null, verified: false },
      };
    }

    return {
      youtube: {
        handle: profile.youtubeHandle,
        verified: profile.youtubeVerified,
      },
      tiktok: {
        handle: profile.tiktokHandle,
        verified: profile.tiktokVerified,
      },
      instagram: {
        handle: profile.instagramHandle,
        verified: profile.instagramVerified,
      },
      twitter: {
        handle: profile.twitterHandle,
        verified: profile.twitterVerified,
      },
    };
  }),

  // Sync social media stats for verified accounts
  syncSocialStats: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get profile
    const [profile] = await db
      .select()
      .from(aiAssistantProfiles)
      .where(eq(aiAssistantProfiles.userId, ctx.user.id))
      .limit(1);

    if (!profile) {
      throw new Error("Profile not found");
    }

    // Import social media API service
    const { syncCreatorStats, aggregateStats } = await import("../services/socialMediaApi");

    // Fetch stats from all verified platforms
    const stats = await syncCreatorStats(profile);
    const aggregate = aggregateStats(stats);

    // Update profile with aggregated stats
    await db
      .update(aiAssistantProfiles)
      .set({
        audienceSize: aggregate.totalFollowers,
        averageViews: aggregate.avgViews,
      })
      .where(eq(aiAssistantProfiles.userId, ctx.user.id));

    return {
      success: true,
      stats,
      aggregate,
      message: `Synced stats from ${aggregate.verifiedPlatforms} verified platform(s)`,
    };
  }),

  // Get synced social media stats
  getSocialStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [profile] = await db
      .select()
      .from(aiAssistantProfiles)
      .where(eq(aiAssistantProfiles.userId, ctx.user.id))
      .limit(1);

    if (!profile) {
      return null;
    }

    return {
      audienceSize: profile.audienceSize,
      averageViews: profile.averageViews,
      platforms: {
        youtube: {
          handle: profile.youtubeHandle,
          verified: profile.youtubeVerified,
        },
        tiktok: {
          handle: profile.tiktokHandle,
          verified: profile.tiktokVerified,
        },
        instagram: {
          handle: profile.instagramHandle,
          verified: profile.instagramVerified,
        },
        twitter: {
          handle: profile.twitterHandle,
          verified: profile.twitterVerified,
        },
      },
    };
  }),
});
