import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComingSoon } from "@/components/coming-soon";
import { Sparkles } from "lucide-react";

describe("ComingSoon component", () => {
  it("renders icon, title, description and coming soon badge correctly", () => {
    render(
      <ComingSoon
        icon={Sparkles}
        title="Tính năng mới"
        description="Đang trong quá trình phát triển"
      />
    );

    expect(screen.getByText("Tính năng mới")).toBeDefined();
    expect(screen.getByText("Đang trong quá trình phát triển")).toBeDefined();
    expect(screen.getByText("Sắp ra mắt")).toBeDefined();
  });
});
