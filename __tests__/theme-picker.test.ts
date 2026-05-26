import { describe, it, expect, vi, beforeEach } from "vitest";
import { applyTheme, THEMES } from "@/components/theme-picker";

describe("applyTheme()", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });

  it("sets data-theme attribute on documentElement", () => {
    applyTheme("dark-pink");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark-pink");
  });

  it("persists the theme to localStorage", () => {
    applyTheme("dark-purple");
    expect(localStorage.getItem("theme")).toBe("dark-purple");
  });

  it("overwrites a previously set theme", () => {
    applyTheme("dark-pink");
    applyTheme("dark-blue");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark-blue");
    expect(localStorage.getItem("theme")).toBe("dark-blue");
  });

  it("works for every defined theme id", () => {
    for (const theme of THEMES) {
      applyTheme(theme.id);
      expect(document.documentElement.getAttribute("data-theme")).toBe(theme.id);
    }
  });
});

describe("THEMES constant", () => {
  it("has 6 themes", () => {
    expect(THEMES).toHaveLength(6);
  });

  it("every theme has id, label, dark, accent", () => {
    for (const t of THEMES) {
      expect(typeof t.id).toBe("string");
      expect(typeof t.label).toBe("string");
      expect(typeof t.dark).toBe("boolean");
      expect(t.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("all theme ids are unique", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has both dark and light variants", () => {
    expect(THEMES.some((t) => t.dark)).toBe(true);
    expect(THEMES.some((t) => !t.dark)).toBe(true);
  });
});
