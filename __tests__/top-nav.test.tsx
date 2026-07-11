import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopNav } from "@/components/top-nav";

describe("TopNav component", () => {
  it("renders title and optional subtitle correctly", () => {
    render(<TopNav title="Luyện Dictation" subtitle="Chọn bài học từ thư viện IELTS V3" />);

    expect(screen.getByText("Luyện Dictation")).toBeDefined();
    expect(screen.getByText("Chọn bài học từ thư viện IELTS V3")).toBeDefined();
  });

  it("renders streak badge", () => {
    render(<TopNav title="Trang chủ" />);

    expect(screen.getByText("12 Ngày")).toBeDefined();
  });

  it("renders search bar when showSearch is true", () => {
    render(<TopNav title="Từ điển AI" showSearch />);

    const searchInput = screen.getByPlaceholderText("Tìm kiếm bài học, từ vựng...");
    expect(searchInput).toBeDefined();
  });
});
