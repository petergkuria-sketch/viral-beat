import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("Developer Hub", () => {
  const caller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: { id: 1, role: "admin" } as any,
  });

  describe("Forum Threads", () => {
    it("should create a new thread", async () => {
      const thread = await caller.developerHub.createThread({
        title: "Test Feature Request",
        description: "This is a test feature request for the developer hub",
        category: "feature_request",
      });

      expect(thread).toBeDefined();
      expect(thread.title).toBe("Test Feature Request");
      expect(thread.category).toBe("feature_request");
    });

    it("should get all threads", async () => {
      const threads = await caller.developerHub.getThreads({});
      expect(Array.isArray(threads)).toBe(true);
    });

    it("should filter threads by category", async () => {
      const threads = await caller.developerHub.getThreads({
        category: "feature_request",
      });
      expect(Array.isArray(threads)).toBe(true);
    });

    it("should sort threads by votes", async () => {
      const threads = await caller.developerHub.getThreads({
        sortBy: "votes",
      });
      expect(Array.isArray(threads)).toBe(true);
    });
  });

  describe("Forum Voting", () => {
    it("should cast an upvote on a thread", async () => {
      // First create a thread
      const thread = await caller.developerHub.createThread({
        title: "Test Vote Thread",
        description: "Testing voting functionality",
        category: "discussion",
      });

      // Cast an upvote
      const result = await caller.developerHub.voteThread({
        threadId: thread.id,
        voteType: "up",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should get user's vote on a thread", async () => {
      // Create a thread
      const thread = await caller.developerHub.createThread({
        title: "Test User Vote",
        description: "Testing user vote retrieval",
        category: "question",
      });

      // Cast a vote
      await caller.developerHub.voteThread({
        threadId: thread.id,
        voteType: "up",
      });

      // Get user's vote
      const userVote = await caller.developerHub.getUserThreadVote({
        threadId: thread.id,
      });

      expect(userVote).toBeDefined();
      expect(userVote?.voteType).toBe("up");
    });
  });

  describe("Forum Posts", () => {
    it("should create a post in a thread", async () => {
      // Create a thread first
      const thread = await caller.developerHub.createThread({
        title: "Test Post Thread",
        description: "Testing post creation",
        category: "discussion",
      });

      // Create a post
      const post = await caller.developerHub.createPost({
        threadId: thread.id,
        content: "This is a test reply to the thread",
      });

      expect(post).toBeDefined();
      expect(post.content).toBe("This is a test reply to the thread");
      expect(post.threadId).toBe(thread.id);
    });

    it("should get posts by thread", async () => {
      // Create a thread
      const thread = await caller.developerHub.createThread({
        title: "Test Get Posts",
        description: "Testing post retrieval",
        category: "bug_report",
      });

      // Create a post
      await caller.developerHub.createPost({
        threadId: thread.id,
        content: "Test post content",
      });

      // Get posts
      const posts = await caller.developerHub.getPostsByThread({
        threadId: thread.id,
      });

      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBeGreaterThan(0);
    });
  });

  describe("Developer Agent", () => {
    it("should chat with the developer agent", async () => {
      const response = await caller.developerHub.chatWithAgent({
        message: "How do I implement a new feature in The Viral Beat?",
      });

      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
      expect(typeof response.message).toBe("string");
      expect(response.conversationHistory).toBeDefined();
      expect(Array.isArray(response.conversationHistory)).toBe(true);
    }, 30000); // 30 second timeout for LLM call

    it("should maintain conversation history", async () => {
      const firstResponse = await caller.developerHub.chatWithAgent({
        message: "What's the best way to add a new API endpoint?",
      });

      const secondResponse = await caller.developerHub.chatWithAgent({
        message: "Can you give me an example?",
        conversationHistory: firstResponse.conversationHistory,
      });

      expect(secondResponse.conversationHistory.length).toBeGreaterThan(
        firstResponse.conversationHistory.length
      );
    }, 60000); // 60 second timeout for multiple LLM calls
  });
});
