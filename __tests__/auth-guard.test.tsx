import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthGuard } from "@/components/auth-guard";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

let mockUserContext = {
  user: null as any,
  loading: false,
};

vi.mock("@/lib/user-context", () => ({
  useUser: () => mockUserContext,
}));

describe("AuthGuard component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("redirects to /login and does not render children when no access_token in localStorage", () => {
    mockUserContext = { user: null, loading: false };
    render(
      <AuthGuard>
        <div data-testid="protected-content">Màn hình chức năng</div>
      </AuthGuard>
    );

    expect(screen.queryByTestId("protected-content")).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("renders protected content when authenticated with valid token and user", () => {
    localStorage.setItem("access_token", "fake-token");
    mockUserContext = {
      user: { id: "u1", name: "User" },
      loading: false,
    };

    render(
      <AuthGuard>
        <div data-testid="protected-content">Màn hình chức năng</div>
      </AuthGuard>
    );

    expect(screen.getByTestId("protected-content")).toBeDefined();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
