import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database functions
const mockVotes: Map<string, { id: number; userId: number; topic: string; voteType: "up" | "down" }> = new Map();
let voteIdCounter = 1;

// Simulated database functions that mirror the actual implementation
function castVote(userId: number, topic: string, voteType: "up" | "down") {
  const key = `${userId}-${topic}`;
  const existing = mockVotes.get(key);

  if (existing) {
    // If same vote type, remove the vote (toggle off)
    if (existing.voteType === voteType) {
      mockVotes.delete(key);
      return { action: "removed", voteType: null };
    }
    // Otherwise, update to new vote type
    existing.voteType = voteType;
    return { action: "changed", voteType };
  }

  // Insert new vote
  mockVotes.set(key, { id: voteIdCounter++, userId, topic, voteType });
  return { action: "added", voteType };
}

function getUserVote(userId: number, topic: string) {
  const key = `${userId}-${topic}`;
  const vote = mockVotes.get(key);
  return vote ? vote.voteType : null;
}

function getVoteCounts(topic: string) {
  const votes = Array.from(mockVotes.values()).filter(v => v.topic === topic);
  const upvotes = votes.filter(v => v.voteType === "up").length;
  const downvotes = votes.filter(v => v.voteType === "down").length;
  return {
    upvotes,
    downvotes,
    score: upvotes - downvotes,
  };
}

function getTopVotedTopics(limit = 10) {
  const allVotes = Array.from(mockVotes.values());
  const topicScores: Record<string, { upvotes: number; downvotes: number }> = {};

  for (const vote of allVotes) {
    if (!topicScores[vote.topic]) {
      topicScores[vote.topic] = { upvotes: 0, downvotes: 0 };
    }
    if (vote.voteType === "up") {
      topicScores[vote.topic].upvotes++;
    } else {
      topicScores[vote.topic].downvotes++;
    }
  }

  return Object.entries(topicScores)
    .map(([topic, counts]) => ({
      topic,
      upvotes: counts.upvotes,
      downvotes: counts.downvotes,
      score: counts.upvotes - counts.downvotes,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

describe("Beat Vote Feature", () => {
  beforeEach(() => {
    // Clear all votes before each test
    mockVotes.clear();
    voteIdCounter = 1;
  });

  describe("castVote", () => {
    it("should add a new upvote", () => {
      const result = castVote(1, "AI Technology", "up");
      expect(result.action).toBe("added");
      expect(result.voteType).toBe("up");
    });

    it("should add a new downvote", () => {
      const result = castVote(1, "AI Technology", "down");
      expect(result.action).toBe("added");
      expect(result.voteType).toBe("down");
    });

    it("should toggle off vote when voting same type twice", () => {
      castVote(1, "AI Technology", "up");
      const result = castVote(1, "AI Technology", "up");
      expect(result.action).toBe("removed");
      expect(result.voteType).toBeNull();
    });

    it("should change vote type when voting different type", () => {
      castVote(1, "AI Technology", "up");
      const result = castVote(1, "AI Technology", "down");
      expect(result.action).toBe("changed");
      expect(result.voteType).toBe("down");
    });

    it("should allow different users to vote on same topic", () => {
      castVote(1, "AI Technology", "up");
      castVote(2, "AI Technology", "up");
      castVote(3, "AI Technology", "down");

      const counts = getVoteCounts("AI Technology");
      expect(counts.upvotes).toBe(2);
      expect(counts.downvotes).toBe(1);
      expect(counts.score).toBe(1);
    });
  });

  describe("getUserVote", () => {
    it("should return null when user has not voted", () => {
      const vote = getUserVote(1, "AI Technology");
      expect(vote).toBeNull();
    });

    it("should return upvote when user has upvoted", () => {
      castVote(1, "AI Technology", "up");
      const vote = getUserVote(1, "AI Technology");
      expect(vote).toBe("up");
    });

    it("should return downvote when user has downvoted", () => {
      castVote(1, "AI Technology", "down");
      const vote = getUserVote(1, "AI Technology");
      expect(vote).toBe("down");
    });

    it("should return null after vote is toggled off", () => {
      castVote(1, "AI Technology", "up");
      castVote(1, "AI Technology", "up"); // Toggle off
      const vote = getUserVote(1, "AI Technology");
      expect(vote).toBeNull();
    });
  });

  describe("getVoteCounts", () => {
    it("should return zero counts for topic with no votes", () => {
      const counts = getVoteCounts("Unknown Topic");
      expect(counts.upvotes).toBe(0);
      expect(counts.downvotes).toBe(0);
      expect(counts.score).toBe(0);
    });

    it("should correctly count upvotes and downvotes", () => {
      castVote(1, "AI Technology", "up");
      castVote(2, "AI Technology", "up");
      castVote(3, "AI Technology", "up");
      castVote(4, "AI Technology", "down");
      castVote(5, "AI Technology", "down");

      const counts = getVoteCounts("AI Technology");
      expect(counts.upvotes).toBe(3);
      expect(counts.downvotes).toBe(2);
      expect(counts.score).toBe(1);
    });

    it("should handle negative scores", () => {
      castVote(1, "Bad Trend", "down");
      castVote(2, "Bad Trend", "down");
      castVote(3, "Bad Trend", "down");
      castVote(4, "Bad Trend", "up");

      const counts = getVoteCounts("Bad Trend");
      expect(counts.upvotes).toBe(1);
      expect(counts.downvotes).toBe(3);
      expect(counts.score).toBe(-2);
    });
  });

  describe("getTopVotedTopics", () => {
    it("should return empty array when no votes exist", () => {
      const topics = getTopVotedTopics();
      expect(topics).toHaveLength(0);
    });

    it("should return topics sorted by score descending", () => {
      // Topic A: 3 upvotes, 1 downvote = score 2
      castVote(1, "Topic A", "up");
      castVote(2, "Topic A", "up");
      castVote(3, "Topic A", "up");
      castVote(4, "Topic A", "down");

      // Topic B: 5 upvotes, 0 downvotes = score 5
      castVote(1, "Topic B", "up");
      castVote(2, "Topic B", "up");
      castVote(3, "Topic B", "up");
      castVote(4, "Topic B", "up");
      castVote(5, "Topic B", "up");

      // Topic C: 1 upvote, 2 downvotes = score -1
      castVote(1, "Topic C", "up");
      castVote(2, "Topic C", "down");
      castVote(3, "Topic C", "down");

      const topics = getTopVotedTopics();
      expect(topics[0].topic).toBe("Topic B");
      expect(topics[0].score).toBe(5);
      expect(topics[1].topic).toBe("Topic A");
      expect(topics[1].score).toBe(2);
      expect(topics[2].topic).toBe("Topic C");
      expect(topics[2].score).toBe(-1);
    });

    it("should respect the limit parameter", () => {
      // Create 5 topics
      for (let i = 1; i <= 5; i++) {
        castVote(1, `Topic ${i}`, "up");
      }

      const topics = getTopVotedTopics(3);
      expect(topics).toHaveLength(3);
    });
  });

  describe("Vote Isolation", () => {
    it("should keep votes separate between different topics", () => {
      castVote(1, "Topic A", "up");
      castVote(1, "Topic B", "down");

      expect(getUserVote(1, "Topic A")).toBe("up");
      expect(getUserVote(1, "Topic B")).toBe("down");

      expect(getVoteCounts("Topic A").upvotes).toBe(1);
      expect(getVoteCounts("Topic A").downvotes).toBe(0);
      expect(getVoteCounts("Topic B").upvotes).toBe(0);
      expect(getVoteCounts("Topic B").downvotes).toBe(1);
    });

    it("should keep votes separate between different users", () => {
      castVote(1, "Topic A", "up");
      castVote(2, "Topic A", "down");

      expect(getUserVote(1, "Topic A")).toBe("up");
      expect(getUserVote(2, "Topic A")).toBe("down");
    });
  });
});
