import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SideNav } from "@/components/side-nav";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/lib/user-context", () => ({
  useUser: () => ({
    user: {
      id: "u1",
      name: "Nguyễn Văn A",
      email: "a@example.com",
      avatar: "https://example.com/avatar.jpg",
    },
    loading: false,
  }),
}));

vi.mock("@/lib/api-client", () => ({
  authApi: {
    logout: vi.fn().mockResolvedValue({}),
  },
}));

describe("SideNav component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders logo and major navigation sections", () => {
    render(<SideNav />);

    expect(screen.getByText("BapEnglish")).toBeDefined();
    expect(screen.getByText("TỔNG QUAN")).toBeDefined();
    expect(screen.getByText("LUYỆN TẬP")).toBeDefined();
    expect(screen.getByText("THƯ VIỆN")).toBeDefined();
    expect(screen.getByText("TIẾN ĐỘ")).toBeDefined();
  });

  it("renders user information and opens user menu popup", () => {
    render(<SideNav />);

    expect(screen.getByText("Nguyễn Văn A")).toBeDefined();
    expect(screen.getByText("B2 Upper Intermediate")).toBeDefined();

    const profileButton = screen.getByText("Nguyễn Văn A").closest("button");
    if (profileButton) {
      fireEvent.click(profileButton);
    }

    expect(screen.getByText("a@example.com")).toBeDefined();
    expect(screen.getByText("Đăng xuất tài khoản")).toBeDefined();
  });
});
