import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonGrid } from "@/components/lesson-grid";

describe("LessonGrid component", () => {
  const sampleLessons = [
    {
      id: "1",
      title: "IELTS Listening Practice 1",
      thumbnailUrl: "https://i.ytimg.com/vi/test1/hqdefault.jpg",
      duration: 600,
      segments: 10,
      level: "B1",
    },
    {
      id: "2",
      title: "IELTS Speaking Part 2",
      thumbnailUrl: "https://i.ytimg.com/vi/test2/hqdefault.jpg",
      duration: 930,
      segments: 15,
      level: "B2",
    },
  ];

  it("returns null when lessons list is empty", () => {
    const { container } = render(<LessonGrid title="Bài học" lessons={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders title, count badge, view more link, and lesson cards", () => {
    render(
      <LessonGrid
        title="Bài học mới"
        count={2}
        href="/dictation"
        lessons={sampleLessons}
      />
    );

    expect(screen.getByText("Bài học mới")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("Xem thêm")).toBeDefined();
    expect(screen.getByText("IELTS Listening Practice 1")).toBeDefined();
    expect(screen.getByText("IELTS Speaking Part 2")).toBeDefined();
  });
});
