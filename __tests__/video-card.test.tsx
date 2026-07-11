import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VideoCard } from "@/components/video-card";

describe("VideoCard component", () => {
  it("renders video title, duration, level badge, and sentence count", () => {
    render(
      <VideoCard
        id="vid-1"
        title="TED Talks: Secret to Learning English"
        thumbnailUrl="https://img.youtube.com/vi/abc/hqdefault.jpg"
        duration={325}
        segments={24}
        level="C1"
        isNew={true}
      />,
    );

    expect(screen.getByText("TED Talks: Secret to Learning English")).toBeDefined();
    expect(screen.getByText("C1")).toBeDefined();
    expect(screen.getByText("MỚI")).toBeDefined();
    expect(screen.getByText("24 câu")).toBeDefined();
    expect(screen.getByText("5:25")).toBeDefined();
  });
});
