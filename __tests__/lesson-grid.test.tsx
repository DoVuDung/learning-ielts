import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonGrid } from "@/components/lesson-grid";

describe("LessonGrid component", () => {
  const sampleLessons = [
    {
      id: "1",
      slug: "lesson-1",
      title: "IELTS Listening Practice 1",
      channel: "IELTS Pro",
      duration: "10:00",
      level: "B1" as const,
      topic: "Daily Life",
      views: "1.2k",
    },
    {
      id: "2",
      slug: "lesson-2",
      title: "IELTS Speaking Part 2",
      channel: "English Master",
      duration: "15:30",
      level: "B2" as const,
      topic: "Academic",
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
