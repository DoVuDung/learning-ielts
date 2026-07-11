import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { authApi } from "@/lib/api-client";

describe("GoogleSignInButton component", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  it("renders standard label and icon initially", () => {
    render(<GoogleSignInButton />);

    const button = screen.getByTestId("google-sign-in-button");
    expect(button).toBeDefined();
    expect(screen.getByText("Tiếp tục với Google")).toBeDefined();
  });

  it("sets loading state and navigates to googleLoginUrl when clicked", () => {
    vi.spyOn(authApi, "googleLoginUrl").mockReturnValue("http://localhost:4000/auth/google");

    render(<GoogleSignInButton />);
    const button = screen.getByTestId("google-sign-in-button");

    fireEvent.click(button);

    expect(screen.getByText("Đang chuyển hướng…")).toBeDefined();
    expect(window.location.href).toBe("http://localhost:4000/auth/google");
  });
});
