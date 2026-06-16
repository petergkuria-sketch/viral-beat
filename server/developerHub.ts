import { getDb } from "./db";
import { forumThreads, forumPosts, forumVotes, developerAgentConversations, users } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { awardTokens } from "./routers/tokens";

// ============ FORUM THREADS ============

export async function createThread(data: {
  title: string;
  description: string;
  category: "feature_request" | "bug_report" | "discussion" | "question";
  authorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result: any = await db.insert(forumThreads).values(data);
  const threadId = Number(result.insertId || 0);
  
  // Fetch and return the created thread
  const [thread] = await db.select().from(forumThreads).where(eq(forumThreads.id, threadId));
  
  // Award tokens for creating a thread
  try {
    await awardTokens(
      data.authorId,
      50,
      "earn_thread_creation",
      `Created thread: ${data.title}`,
      threadId,
      "thread"
    );
  } catch (error) {
    console.error("Failed to award tokens for thread creation:", error);
  }
  
  return thread;
}

export async function getThreads(filters?: {
  category?: string;
  status?: string;
  sortBy?: "votes" | "recent";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const baseQuery = db
    .select({
      id: forumThreads.id,
      title: forumThreads.title,
      description: forumThreads.description,
      category: forumThreads.category,
      status: forumThreads.status,
      upvotes: forumThreads.upvotes,
      downvotes: forumThreads.downvotes,
      createdAt: forumThreads.createdAt,
      updatedAt: forumThreads.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(forumThreads)
    .leftJoin(users, eq(forumThreads.authorId, users.id));

  // Apply filters and sorting
  if (filters?.category && filters?.status) {
    if (filters.sortBy === "votes") {
      return await baseQuery
        .where(sql`${forumThreads.category} = ${filters.category} AND ${forumThreads.status} = ${filters.status}`)
        .orderBy(desc(sql`${forumThreads.upvotes} - ${forumThreads.downvotes}`));
    } else {
      return await baseQuery
        .where(sql`${forumThreads.category} = ${filters.category} AND ${forumThreads.status} = ${filters.status}`)
        .orderBy(desc(forumThreads.createdAt));
    }
  } else if (filters?.category) {
    if (filters.sortBy === "votes") {
      return await baseQuery
        .where(eq(forumThreads.category, filters.category as any))
        .orderBy(desc(sql`${forumThreads.upvotes} - ${forumThreads.downvotes}`));
    } else {
      return await baseQuery
        .where(eq(forumThreads.category, filters.category as any))
        .orderBy(desc(forumThreads.createdAt));
    }
  } else if (filters?.status) {
    if (filters.sortBy === "votes") {
      return await baseQuery
        .where(eq(forumThreads.status, filters.status as any))
        .orderBy(desc(sql`${forumThreads.upvotes} - ${forumThreads.downvotes}`));
    } else {
      return await baseQuery
        .where(eq(forumThreads.status, filters.status as any))
        .orderBy(desc(forumThreads.createdAt));
    }
  } else {
    if (filters?.sortBy === "votes") {
      return await baseQuery.orderBy(desc(sql`${forumThreads.upvotes} - ${forumThreads.downvotes}`));
    } else {
      return await baseQuery.orderBy(desc(forumThreads.createdAt));
    }
  }
}

export async function getThreadById(threadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [thread] = await db
    .select({
      id: forumThreads.id,
      title: forumThreads.title,
      description: forumThreads.description,
      category: forumThreads.category,
      status: forumThreads.status,
      upvotes: forumThreads.upvotes,
      downvotes: forumThreads.downvotes,
      createdAt: forumThreads.createdAt,
      updatedAt: forumThreads.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(forumThreads)
    .leftJoin(users, eq(forumThreads.authorId, users.id))
    .where(eq(forumThreads.id, threadId));

  return thread;
}

export async function updateThreadStatus(threadId: number, status: "open" | "in_progress" | "completed" | "closed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(forumThreads)
    .set({ status, updatedAt: new Date() })
    .where(eq(forumThreads.id, threadId));
}

// ============ FORUM POSTS ============

export async function createPost(data: {
  threadId: number;
  authorId: number;
  content: string;
  parentId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result: any = await db.insert(forumPosts).values(data);
  const postId = Number(result.insertId || 0);
  
  // Fetch and return the created post
  const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, postId));
  
  // Award tokens for creating a post/reply
  try {
    await awardTokens(
      data.authorId,
      20,
      "earn_post_reply",
      "Posted a reply in Developer Hub",
      postId,
      "post"
    );
  } catch (error) {
    console.error("Failed to award tokens for post creation:", error);
  }
  
  return post;
}

export async function getPostsByThread(threadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      id: forumPosts.id,
      threadId: forumPosts.threadId,
      content: forumPosts.content,
      parentId: forumPosts.parentId,
      createdAt: forumPosts.createdAt,
      updatedAt: forumPosts.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(forumPosts)
    .leftJoin(users, eq(forumPosts.authorId, users.id))
    .where(eq(forumPosts.threadId, threadId))
    .orderBy(forumPosts.createdAt);
}

// ============ FORUM VOTES ============

export async function castThreadVote(data: {
  threadId: number;
  userId: number;
  voteType: "up" | "down";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already voted
  const [existingVote] = await db
    .select()
    .from(forumVotes)
    .where(
      sql`${forumVotes.threadId} = ${data.threadId} AND ${forumVotes.userId} = ${data.userId}`
    );

  if (existingVote) {
    // If same vote type, remove vote (toggle)
    if (existingVote.voteType === data.voteType) {
      await db
        .delete(forumVotes)
        .where(eq(forumVotes.id, existingVote.id));

      // Update thread vote count
      if (data.voteType === "up") {
        await db
          .update(forumThreads)
          .set({ upvotes: sql`${forumThreads.upvotes} - 1` })
          .where(eq(forumThreads.id, data.threadId));
      } else {
        await db
          .update(forumThreads)
          .set({ downvotes: sql`${forumThreads.downvotes} - 1` })
          .where(eq(forumThreads.id, data.threadId));
      }

      return { action: "removed" };
    } else {
      // Change vote type
      await db
        .update(forumVotes)
        .set({ voteType: data.voteType, updatedAt: new Date() })
        .where(eq(forumVotes.id, existingVote.id));

      // Update thread vote counts
      if (data.voteType === "up") {
        await db
          .update(forumThreads)
          .set({
            upvotes: sql`${forumThreads.upvotes} + 1`,
            downvotes: sql`${forumThreads.downvotes} - 1`,
          })
          .where(eq(forumThreads.id, data.threadId));
      } else {
        await db
          .update(forumThreads)
          .set({
            upvotes: sql`${forumThreads.upvotes} - 1`,
            downvotes: sql`${forumThreads.downvotes} + 1`,
          })
          .where(eq(forumThreads.id, data.threadId));
      }

      return { action: "changed" };
    }
  } else {
    // New vote
    await db.insert(forumVotes).values(data);

    // Update thread vote count
    if (data.voteType === "up") {
      await db
        .update(forumThreads)
        .set({ upvotes: sql`${forumThreads.upvotes} + 1` })
        .where(eq(forumThreads.id, data.threadId));
    } else {
      await db
        .update(forumThreads)
        .set({ downvotes: sql`${forumThreads.downvotes} + 1` })
        .where(eq(forumThreads.id, data.threadId));
    }

    return { action: "added" };
  }
}

export async function getUserThreadVote(threadId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [vote] = await db
    .select()
    .from(forumVotes)
    .where(
      sql`${forumVotes.threadId} = ${threadId} AND ${forumVotes.userId} = ${userId}`
    );

  return vote;
}

// ============ DEVELOPER AGENT CONVERSATIONS ============

export async function saveConversation(data: {
  userId: number;
  messages: Array<{ role: string; content: string; timestamp: string }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user has existing conversation
  const [existing] = await db
    .select()
    .from(developerAgentConversations)
    .where(eq(developerAgentConversations.userId, data.userId))
    .orderBy(desc(developerAgentConversations.updatedAt))
    .limit(1);

  if (existing) {
    // Update existing conversation
    await db
      .update(developerAgentConversations)
      .set({ messages: data.messages, updatedAt: new Date() })
      .where(eq(developerAgentConversations.id, existing.id));
    return existing.id;
  } else {
    // Create new conversation
    const [conversation] = await db.insert(developerAgentConversations).values(data);
    return conversation.insertId;
  }
}

export async function getConversation(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [conversation] = await db
    .select()
    .from(developerAgentConversations)
    .where(eq(developerAgentConversations.userId, userId))
    .orderBy(desc(developerAgentConversations.updatedAt))
    .limit(1);

  return conversation;
}
