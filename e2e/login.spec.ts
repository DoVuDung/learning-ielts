import { test, expect } from "@playwright/test";

// Login page does not require authentication
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows BapEnglish logo and branding", async ({ page }) => {
    await expect(page.locator("text=BapEnglish").first()).toBeVisible();
    // Logo icon
    const logoIcon = page.locator("div").filter({ hasText: /^B$/ }).first();
    await expect(logoIcon).toBeVisible();
  });

  test("shows welcome heading in Vietnamese", async ({ page }) => {
    await expect(page.getByText("Chào mừng trở lại")).toBeVisible();
    await expect(
      page.getByText("Đăng nhập để tiếp tục hành trình học tiếng Anh của bạn")
    ).toBeVisible();
  });

  test("shows Google sign-in button", async ({ page }) => {
    const googleBtn = page.getByRole("button", { name: /google/i });
    await expect(googleBtn).toBeVisible();
  });

  test("shows 'only Google supported' separator text", async ({ page }) => {
    await expect(page.getByText("Chỉ hỗ trợ Google")).toBeVisible();
  });

  test("shows terms of service and privacy policy links", async ({ page }) => {
    await expect(page.getByText("Điều khoản dịch vụ")).toBeVisible();
    await expect(page.getByText("Chính sách bảo mật")).toBeVisible();
  });

  test("redirects to /dictation when already authenticated", async ({
    browser,
  }) => {
    const { generateTestToken } = await import("./global-setup");
    const token = await generateTestToken();

    const context = await browser.newContext();
    await context.addCookies([
      {
        name: "access_token",
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
        expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
    ]);
    const page = await context.newPage();
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dictation/);
    await context.close();
  });
});
