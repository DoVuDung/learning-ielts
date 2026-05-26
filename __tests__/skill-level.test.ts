import { describe, it, expect } from "vitest";
import { skillLevel } from "@/lib/skill-level";

describe("skillLevel()", () => {
  it("returns 'Chưa bắt đầu' for score 0", () => {
    const r = skillLevel(0);
    expect(r.label).toBe("Chưa bắt đầu");
    expect(r.pct).toBe(0);
  });

  it("returns A1 for score 1–19", () => {
    expect(skillLevel(1).label).toBe("A1 – Beginner");
    expect(skillLevel(19).label).toBe("A1 – Beginner");
    expect(skillLevel(1).pct).toBe(15);
  });

  it("returns A2 for score 20–59", () => {
    expect(skillLevel(20).label).toBe("A2 – Elementary");
    expect(skillLevel(59).label).toBe("A2 – Elementary");
    expect(skillLevel(20).pct).toBe(35);
  });

  it("returns B1 for score 60–149", () => {
    expect(skillLevel(60).label).toBe("B1 – Intermediate");
    expect(skillLevel(149).label).toBe("B1 – Intermediate");
    expect(skillLevel(60).pct).toBe(55);
  });

  it("returns B2 for score 150–299", () => {
    expect(skillLevel(150).label).toBe("B2 – Upper-Inter");
    expect(skillLevel(299).label).toBe("B2 – Upper-Inter");
    expect(skillLevel(150).pct).toBe(70);
  });

  it("returns C1 for score 300–499", () => {
    expect(skillLevel(300).label).toBe("C1 – Advanced");
    expect(skillLevel(499).label).toBe("C1 – Advanced");
    expect(skillLevel(300).pct).toBe(85);
  });

  it("returns C2 for score 500+", () => {
    expect(skillLevel(500).label).toBe("C2 – Mastery");
    expect(skillLevel(9999).label).toBe("C2 – Mastery");
    expect(skillLevel(500).pct).toBe(100);
  });

  it("pct is always 0–100", () => {
    for (const score of [0, 1, 19, 20, 59, 60, 149, 150, 299, 300, 499, 500, 1000]) {
      const { pct } = skillLevel(score);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  it("higher score never gives lower pct", () => {
    const scores = [0, 1, 20, 60, 150, 300, 500];
    const pcts = scores.map((s) => skillLevel(s).pct);
    for (let i = 1; i < pcts.length; i++) {
      expect(pcts[i]).toBeGreaterThanOrEqual(pcts[i - 1]);
    }
  });

  it("each level has a non-empty label and color", () => {
    for (const score of [0, 1, 20, 60, 150, 300, 500]) {
      const { label, color } = skillLevel(score);
      expect(label.length).toBeGreaterThan(0);
      expect(color.length).toBeGreaterThan(0);
    }
  });
});
