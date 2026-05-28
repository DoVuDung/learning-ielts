import { describe, it, expect } from "vitest";
import { extractYoutubeId } from "@/lib/utils";

describe("extractYoutubeId()", () => {
  it("extracts from watch URL", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from watch URL with extra params", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=abc&index=1")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from youtu.be short link", () => {
    expect(extractYoutubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from youtu.be with tracking param", () => {
    expect(extractYoutubeId("https://youtu.be/dQw4w9WgXcQ?si=abc123")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from YouTube Shorts", () => {
    expect(extractYoutubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from embed URL", () => {
    expect(extractYoutubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for non-YouTube URL", () => {
    expect(extractYoutubeId("https://vimeo.com/123456")).toBeNull();
  });

  it("returns null for plain text", () => {
    expect(extractYoutubeId("not-a-url")).toBeNull();
  });

  it("returns null for YouTube URL without video ID", () => {
    expect(extractYoutubeId("https://www.youtube.com/channel/UCxxx")).toBeNull();
  });
});
