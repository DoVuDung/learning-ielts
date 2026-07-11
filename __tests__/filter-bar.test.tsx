import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterBar } from "@/components/filter-bar";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams("category=ielts&level=B2"),
}));

describe("FilterBar component", () => {
  const categories = [
    { id: "ielts", label: "IELTS Academic", count: 15, hot: true },
    { id: "bbc", label: "BBC Learning", count: 8 },
  ];
  const levels = [
    { id: "b2", label: "B2", count: 12 },
    { id: "c1", label: "C1", count: 5 },
  ];

  it("renders all category and level filter chips with counts", () => {
    render(<FilterBar categories={categories} levels={levels} />);

    expect(screen.getByText("IELTS Academic")).toBeDefined();
    expect(screen.getByText("BBC Learning")).toBeDefined();
    expect(screen.getByText("15")).toBeDefined();
    expect(screen.getByText("8")).toBeDefined();
  });

  it("calls router.push when clicking a category filter chip", () => {
    render(<FilterBar categories={categories} levels={levels} />);

    const bbcChip = screen.getByText("BBC Learning");
    fireEvent.click(bbcChip);
    expect(mockPush).toHaveBeenCalled();
  });
});
