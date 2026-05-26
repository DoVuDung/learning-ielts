import { describe, it, expect } from "vitest";
import { schedule, previewIntervals, RATING, type CardSnapshot } from "@/lib/fsrs";

const NOW = new Date("2026-05-26T12:00:00Z");

function newCard(): CardSnapshot {
  return {
    state: "NEW",
    due: NOW,
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    lastReview: null,
  };
}

function reviewCard(overrides: Partial<CardSnapshot> = {}): CardSnapshot {
  return {
    state: "REVIEW",
    due: NOW,
    stability: 10,
    difficulty: 5,
    elapsedDays: 10,
    scheduledDays: 10,
    reps: 3,
    lapses: 0,
    lastReview: new Date(+NOW - 10 * 86_400_000),
    ...overrides,
  };
}

// ─── State transitions ────────────────────────────────────────────────────────

describe("NEW card transitions", () => {
  it("Again (1) → LEARNING, short interval", () => {
    const r = schedule(newCard(), RATING.Again, NOW);
    expect(r.state).toBe("LEARNING");
    expect(r.scheduledDays).toBe(0);
    expect(r.due > NOW).toBe(true);
    expect(r.reps).toBe(1);
  });

  it("Hard (2) → LEARNING, short interval", () => {
    const r = schedule(newCard(), RATING.Hard, NOW);
    expect(r.state).toBe("LEARNING");
    expect(r.scheduledDays).toBe(0);
  });

  it("Good (3) → REVIEW immediately (graduates)", () => {
    const r = schedule(newCard(), RATING.Good, NOW);
    expect(r.state).toBe("REVIEW");
    expect(r.scheduledDays).toBeGreaterThan(0);
  });

  it("Easy (4) → REVIEW immediately (graduates)", () => {
    const r = schedule(newCard(), RATING.Easy, NOW);
    expect(r.state).toBe("REVIEW");
    expect(r.scheduledDays).toBeGreaterThan(0);
  });

  it("Easy graduates with longer interval than Good", () => {
    const good = schedule(newCard(), RATING.Good, NOW);
    const easy = schedule(newCard(), RATING.Easy, NOW);
    expect(easy.scheduledDays).toBeGreaterThanOrEqual(good.scheduledDays);
  });
});

describe("REVIEW card transitions", () => {
  it("Again (1) → RELEARNING", () => {
    const r = schedule(reviewCard(), RATING.Again, NOW);
    expect(r.state).toBe("RELEARNING");
    expect(r.lapses).toBe(1);
    expect(r.scheduledDays).toBe(0);
  });

  it("Hard (2) → stays REVIEW", () => {
    const r = schedule(reviewCard(), RATING.Hard, NOW);
    expect(r.state).toBe("REVIEW");
    expect(r.scheduledDays).toBeGreaterThan(0);
  });

  it("Good (3) → stays REVIEW with longer interval", () => {
    const hard = schedule(reviewCard(), RATING.Hard, NOW);
    const good = schedule(reviewCard(), RATING.Good, NOW);
    expect(good.scheduledDays).toBeGreaterThanOrEqual(hard.scheduledDays);
  });

  it("Easy (4) → stays REVIEW with longest interval", () => {
    const good = schedule(reviewCard(), RATING.Good, NOW);
    const easy = schedule(reviewCard(), RATING.Easy, NOW);
    expect(easy.scheduledDays).toBeGreaterThanOrEqual(good.scheduledDays);
  });

  it("does not increment lapses on Good", () => {
    const r = schedule(reviewCard(), RATING.Good, NOW);
    expect(r.lapses).toBe(0);
  });
});

describe("RELEARNING card transitions", () => {
  const relearning: CardSnapshot = {
    ...reviewCard(),
    state: "RELEARNING",
    lapses: 1,
  };

  it("Again (1) → stays RELEARNING", () => {
    const r = schedule(relearning, RATING.Again, NOW);
    expect(r.state).toBe("RELEARNING");
    expect(r.scheduledDays).toBe(0);
  });

  it("Good (3) → graduates back to REVIEW", () => {
    const r = schedule(relearning, RATING.Good, NOW);
    expect(r.state).toBe("REVIEW");
    expect(r.scheduledDays).toBeGreaterThan(0);
  });

  it("Easy (4) → graduates back to REVIEW", () => {
    const r = schedule(relearning, RATING.Easy, NOW);
    expect(r.state).toBe("REVIEW");
  });
});

// ─── Invariants ───────────────────────────────────────────────────────────────

describe("schedule() invariants", () => {
  it("always increments reps", () => {
    for (const rating of [1, 2, 3, 4] as const) {
      const r = schedule(newCard(), rating, NOW);
      expect(r.reps).toBe(1);
    }
  });

  it("sets lastReview to now", () => {
    const r = schedule(newCard(), RATING.Good, NOW);
    expect(r.lastReview.toISOString()).toBe(NOW.toISOString());
  });

  it("due date is always after now", () => {
    for (const rating of [1, 2, 3, 4] as const) {
      const r = schedule(newCard(), rating, NOW);
      expect(r.due >= NOW).toBe(true);
    }
  });

  it("stability is always positive", () => {
    for (const rating of [1, 2, 3, 4] as const) {
      const r = schedule(newCard(), rating, NOW);
      expect(r.stability).toBeGreaterThan(0);
    }
  });

  it("difficulty is clamped to [1, 10]", () => {
    for (const rating of [1, 2, 3, 4] as const) {
      const r = schedule(newCard(), rating, NOW);
      expect(r.difficulty).toBeGreaterThanOrEqual(1);
      expect(r.difficulty).toBeLessThanOrEqual(10);
    }
  });

  it("scheduledDays is non-negative", () => {
    for (const rating of [1, 2, 3, 4] as const) {
      const r = schedule(newCard(), rating, NOW);
      expect(r.scheduledDays).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── previewIntervals ─────────────────────────────────────────────────────────

describe("previewIntervals()", () => {
  it("returns 4 previews", () => {
    const previews = previewIntervals(newCard(), NOW);
    expect(previews).toHaveLength(4);
  });

  it("previews have ratings 1–4", () => {
    const previews = previewIntervals(newCard(), NOW);
    expect(previews.map((p) => p.rating)).toEqual([1, 2, 3, 4]);
  });

  it("previews have human-readable labels", () => {
    const previews = previewIntervals(newCard(), NOW);
    expect(previews[0].label).toBe("Again");
    expect(previews[1].label).toBe("Hard");
    expect(previews[2].label).toBe("Good");
    expect(previews[3].label).toBe("Easy");
  });

  it("humanInterval is non-empty string", () => {
    const previews = previewIntervals(newCard(), NOW);
    for (const p of previews) {
      expect(p.humanInterval).toBeTruthy();
      expect(typeof p.humanInterval).toBe("string");
    }
  });

  it("Again interval is shortest for REVIEW card", () => {
    const previews = previewIntervals(reviewCard(), NOW);
    const [again, , good, easy] = previews;
    expect(+again.due).toBeLessThan(+good.due);
    expect(+good.due).toBeLessThanOrEqual(+easy.due);
  });

  it("does not mutate the input card", () => {
    const card = newCard();
    const before = { ...card };
    previewIntervals(card, NOW);
    expect(card).toEqual(before);
  });
});

// ─── humanInterval format ─────────────────────────────────────────────────────

describe("humanInterval format", () => {
  it("shows minutes for short steps", () => {
    const r = previewIntervals(newCard(), NOW);
    // Again on NEW → minute-level step
    expect(r[0].humanInterval).toMatch(/^\d+m$/);
  });

  it("shows days for REVIEW card good/easy", () => {
    const r = previewIntervals(reviewCard(), NOW);
    const good = r[2];
    // Should be days or months (not minutes)
    expect(good.humanInterval).toMatch(/^\d+(d|mo|y)$/);
  });
});
