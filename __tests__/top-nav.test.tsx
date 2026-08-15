import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopNav } from "@/components/top-nav";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/home",
}));

vi.mock("@/lib/user-context", () => ({
  useUser: () => ({
    user: { id: "u1", name: "Học viên", email: "test@example.com" },
    stats: {
      streakDays: 7,
      todaySentencesDone: 10,
      dailyGoalSentences: 20,
      totalWordsSaved: 12,
      dueCardsCount: 2,
    },
    loading: false,
  }),
}));

describe("TopNav component", () => {
  it("renders title and optional subtitle correctly", () => {
    render(<TopNav title="Luyện Dictation" subtitle="Chọn bài học từ thư viện IELTS V3" />);

    expect(screen.getByText("Luyện Dictation")).toBeDefined();
    expect(screen.getByText("Chọn bài học từ thư viện IELTS V3")).toBeDefined();
  });

  it("renders streak badge and upgrade link", () => {
    render(<TopNav title="Trang chủ" />);

    expect(screen.getByText(/Ngày/)).toBeDefined();
    expect(screen.getByText("Nâng cấp PRO")).toBeDefined();
  });

  it("renders search bar when showSearch is true", () => {
    render(<TopNav title="Từ điển AI" showSearch />);

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm/i);
    expect(searchInput).toBeDefined();
  });
});

