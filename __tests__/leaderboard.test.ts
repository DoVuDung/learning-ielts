import { describe, it, expect } from "vitest";
import { computeScore, rankUsers, type UserStats } from "@/lib/leaderboard";

function makeUser(overrides: Partial<UserStats> & { id: string }): UserStats {
  return {
    name: "Test User",
    avatarUrl: null,
    sentencesDone: 0,
    reviewsDone: 0,
    wordsSaved: 0,
    ...overrides,
  };
}

// ─── computeScore ─────────────────────────────────────────────────────────────

describe("computeScore()", () => {
  it("returns 0 for all-zero stats", () => {
    expect(computeScore({ sentencesDone: 0, reviewsDone: 0, wordsSaved: 0 })).toBe(0);
  });

  it("weights sentences at 1pt each", () => {
    expect(computeScore({ sentencesDone: 10, reviewsDone: 0, wordsSaved: 0 })).toBe(10);
  });

  it("weights card reviews at 2pt each", () => {
    expect(computeScore({ sentencesDone: 0, reviewsDone: 5, wordsSaved: 0 })).toBe(10);
  });

  it("weights saved words at 1pt each", () => {
    expect(computeScore({ sentencesDone: 0, reviewsDone: 0, wordsSaved: 7 })).toBe(7);
  });

  it("sums all three contributions", () => {
    // 100 + 2*50 + 20 = 100 + 100 + 20 = 220
    expect(computeScore({ sentencesDone: 100, reviewsDone: 50, wordsSaved: 20 })).toBe(220);
  });
});

// ─── rankUsers ────────────────────────────────────────────────────────────────

describe("rankUsers()", () => {
  it("returns empty array for empty input", () => {
    expect(rankUsers([])).toEqual([]);
  });

  it("filters out users with score 0", () => {
    const users = [makeUser({ id: "a", sentencesDone: 0, reviewsDone: 0, wordsSaved: 0 })];
    expect(rankUsers(users)).toHaveLength(0);
  });

  it("includes users with non-zero score", () => {
    const users = [makeUser({ id: "a", sentencesDone: 1 })];
    expect(rankUsers(users)).toHaveLength(1);
  });

  it("sorts by score descending", () => {
    const users = [
      makeUser({ id: "a", sentencesDone: 10 }),
      makeUser({ id: "b", sentencesDone: 50 }),
      makeUser({ id: "c", sentencesDone: 30 }),
    ];
    const ranked = rankUsers(users);
    expect(ranked[0].id).toBe("b");
    expect(ranked[1].id).toBe("c");
    expect(ranked[2].id).toBe("a");
  });

  it("attaches computed score to each user", () => {
    const users = [makeUser({ id: "a", sentencesDone: 10, reviewsDone: 5, wordsSaved: 3 })];
    const [r] = rankUsers(users);
    expect(r.score).toBe(10 + 10 + 3); // 23
  });

  it("does not mutate the input array", () => {
    const users = [
      makeUser({ id: "a", sentencesDone: 5 }),
      makeUser({ id: "b", sentencesDone: 20 }),
    ];
    const copy = [...users];
    rankUsers(users);
    expect(users[0].id).toBe(copy[0].id);
    expect(users[1].id).toBe(copy[1].id);
  });

  it("handles ties by preserving relative order (stable sort)", () => {
    const users = [
      makeUser({ id: "a", sentencesDone: 10 }),
      makeUser({ id: "b", sentencesDone: 10 }),
    ];
    const ranked = rankUsers(users);
    expect(ranked).toHaveLength(2);
    expect(ranked[0].score).toBe(ranked[1].score);
  });

  it("preserves all original fields on ranked users", () => {
    const user = makeUser({ id: "x", name: "Alice", avatarUrl: "https://example.com/a.jpg", sentencesDone: 5 });
    const [r] = rankUsers([user]);
    expect(r.name).toBe("Alice");
    expect(r.avatarUrl).toBe("https://example.com/a.jpg");
    expect(r.sentencesDone).toBe(5);
  });
});
