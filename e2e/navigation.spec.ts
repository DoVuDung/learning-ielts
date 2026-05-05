import { test, expect } from "./fixtures";

test.describe("Sidebar navigation (desktop)", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto("/home");
    // Wait for sidebar to be rendered
    await page.waitForSelector("aside");
  });

  test("shows BapEnglish logo in sidebar", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("BapEnglish")).toBeVisible();
  });

  test("shows all nav section headers", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.getByText("TỔNG QUAN")).toBeVisible();
    await expect(page.getByText("LUYỆN TẬP")).toBeVisible();
    await expect(page.getByText("THƯ VIỆN")).toBeVisible();
    await expect(page.getByText("TIẾN ĐỘ")).toBeVisible();
  });

  test("shows all nav links", async ({ authenticatedPage: page }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar.getByRole("link", { name: "Trang chủ" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Dictation" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Shadowing" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Luyện nói" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Luyện từ vựng" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Video của tôi" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Danh sách từ" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Từ điển AI" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Xếp hạng" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Thống kê" })).toBeVisible();
  });

  test("active link is highlighted on home page", async ({
    authenticatedPage: page,
  }) => {
    const homeLink = page.locator("aside").getByRole("link", { name: "Trang chủ" });
    // Active links have bg-primary/15 class applied
    await expect(homeLink).toHaveClass(/text-primary/);
  });

  test("navigates to Dictation via sidebar link", async ({
    authenticatedPage: page,
  }) => {
    await page.locator("aside").getByRole("link", { name: "Dictation" }).click();
    await expect(page).toHaveURL(/\/dictation/);
  });

  test("navigates to Shadowing via sidebar link", async ({
    authenticatedPage: page,
  }) => {
    await page.locator("aside").getByRole("link", { name: "Shadowing" }).click();
    await expect(page).toHaveURL(/\/shadowing/);
  });

  test("navigates to Speaking via sidebar link", async ({
    authenticatedPage: page,
  }) => {
    await page.locator("aside").getByRole("link", { name: "Luyện nói" }).click();
    await expect(page).toHaveURL(/\/speaking/);
  });

  test("navigates to Vocabulary via sidebar link", async ({
    authenticatedPage: page,
  }) => {
    await page.locator("aside").getByRole("link", { name: "Luyện từ vựng" }).click();
    await expect(page).toHaveURL(/\/vocabulary/);
  });

  test("navigates to My Videos via sidebar link", async ({
    authenticatedPage: page,
  }) => {
    await page.locator("aside").getByRole("link", { name: "Video của tôi" }).click();
    await expect(page).toHaveURL(/\/my-videos/);
  });

  test("navigates to Word Lists via sidebar link", async ({
    authenticatedPage: page,
  }) => {
    await page.locator("aside").getByRole("link", { name: "Danh sách từ" }).click();
    await expect(page).toHaveURL(/\/word-lists/);
  });

  test("navigates to Stats via sidebar link", async ({
    authenticatedPage: page,
  }) => {
    await page.locator("aside").getByRole("link", { name: "Thống kê" }).click();
    await expect(page).toHaveURL(/\/stats/);
  });

  test("shows Premium upgrade banner in sidebar", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.getByText("Nâng cấp Premium")).toBeVisible();
  });

  test("shows user avatar and profile button", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator("aside");
    const profileBtn = sidebar.locator("button").filter({ has: page.locator("img, [class*='Avatar']") }).first();
    await expect(profileBtn).toBeVisible();
  });

  test("user menu opens on avatar click", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator("aside");
    // Click the profile button (avatar + name area)
    const profileBtn = sidebar.locator("button").filter({ hasText: /dung|Miễn phí/ }).first();
    await profileBtn.click();
    await expect(page.getByText("Đăng xuất")).toBeVisible();
  });

  test("logout button visible in user menu", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator("aside");
    const profileBtn = sidebar.locator("button").filter({ hasText: /dung|Miễn phí/ }).first();
    await profileBtn.click();
    const logoutBtn = page.getByRole("button", { name: /đăng xuất/i });
    await expect(logoutBtn).toBeVisible();
  });

  test("theme picker button is present in sidebar", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator("aside");
    // Sun icon button for theme
    const themeBtn = sidebar.locator("button[title='Chọn giao diện']");
    await expect(themeBtn).toBeVisible();
  });

  test("language switcher button is present in sidebar", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator("aside");
    const langBtn = sidebar.locator("button[title='Ngôn ngữ giao diện']");
    await expect(langBtn).toBeVisible();
  });
});

test.describe("Mobile navigation", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto("/home");
  });

  test("hamburger menu button is visible on mobile", async ({
    authenticatedPage: page,
  }) => {
    const hamburger = page.getByRole("button", { name: /open menu/i });
    await expect(hamburger).toBeVisible();
  });

  test("BapEnglish brand name shown in mobile top bar", async ({
    authenticatedPage: page,
  }) => {
    // Mobile top bar shows brand name
    const topBar = page.locator(".lg\\:hidden").filter({ hasText: "BapEnglish" });
    await expect(topBar.first()).toBeVisible();
  });

  test("sidebar drawer opens on hamburger click", async ({
    authenticatedPage: page,
  }) => {
    await page.getByRole("button", { name: /open menu/i }).click();
    // Sidebar should be visible (translated into view)
    await expect(page.locator("aside")).toBeVisible();
    await expect(page.getByText("TỔNG QUAN")).toBeVisible();
  });

  test("sidebar drawer closes on overlay click", async ({
    authenticatedPage: page,
  }) => {
    await page.getByRole("button", { name: /open menu/i }).click();
    await expect(page.locator("aside")).toBeVisible();
    // Click the backdrop overlay
    await page.locator(".bg-black\\/60").click();
    // Sidebar should slide back out
    await expect(page.locator("aside")).not.toBeInViewport();
  });

  test("sidebar drawer closes after navigating", async ({
    authenticatedPage: page,
  }) => {
    await page.getByRole("button", { name: /open menu/i }).click();
    await page.locator("aside").getByRole("link", { name: "Dictation" }).click();
    await expect(page).toHaveURL(/\/dictation/);
    // After navigation, drawer should be closed
    await expect(page.locator("aside")).not.toBeInViewport();
  });
});

test.describe("Auth redirect", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to dictation redirects to login", async ({
    page,
  }) => {
    await page.goto("/dictation");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to speaking redirects to login", async ({
    page,
  }) => {
    await page.goto("/speaking");
    await expect(page).toHaveURL(/\/login/);
  });
});
