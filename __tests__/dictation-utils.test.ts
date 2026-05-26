import { describe, it, expect } from "vitest";
import { clean, splitWords, parseInput } from "@/app/(main)/dictation/[videoId]/dictation-player";

describe("clean()", () => {
  it("lowercases and strips punctuation", () => {
    expect(clean("Hello,")).toBe("hello");
    expect(clean("World!")).toBe("world");
    expect(clean("test.")).toBe("test");
  });

  it("strips apostrophes (normalises contractions for matching)", () => {
    expect(clean("don't")).toBe("dont");
    expect(clean("it's")).toBe("its");
  });

  it("returns empty string for punctuation-only input", () => {
    expect(clean("...")).toBe("");
  });
});

describe("splitWords()", () => {
  it("splits a normal sentence", () => {
    expect(splitWords("Hello world")).toEqual(["Hello", "world"]);
  });

  it("handles multiple spaces", () => {
    expect(splitWords("a  b")).toEqual(["a", "b"]);
  });

  it("trims leading/trailing whitespace", () => {
    expect(splitWords("  hello  ")).toEqual(["hello"]);
  });
});

describe("parseInput()", () => {
  it("returns empty done and partial when input is empty", () => {
    expect(parseInput("")).toEqual({ done: [], partial: "" });
  });

  it("treats trailing space as completing a word", () => {
    expect(parseInput("hello ")).toEqual({ done: ["hello"], partial: "" });
  });

  it("splits completed words from current partial", () => {
    expect(parseInput("hello wor")).toEqual({ done: ["hello"], partial: "wor" });
  });

  it("handles multiple completed words", () => {
    expect(parseInput("the quick brown ")).toEqual({
      done: ["the", "quick", "brown"],
      partial: "",
    });
  });

  it("handles single partial word", () => {
    expect(parseInput("hel")).toEqual({ done: [], partial: "hel" });
  });
});
