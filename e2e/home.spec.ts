import { test, expect } from "./fixtures";

test.describe("Home page", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto("/home");
  });

  test("loads without error", async ({ authenticatedPage: page }) => {
    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator("main, [class*='overflow']").first()).toBeVisible();
  });

  test("shows all 6 feature cards", async ({ authenticatedPage: page }) => {
    await expect(page.getByText("Dictation")).toBeVisible();
    await expect(page.getByText("Shadowing")).toBeVisible();
    await expect(page.getByText("Luyện nói")).toBeVisible();
    await expect(page.getByText("Luyện từ vựng")).toBeVisible();
    await expect(page.getByText("Video của tôi")).toBeVisible();
    await expect(page.getByText("Danh sách từ")).toBeVisible();
  });

  test("Dictation card has 'Phổ biến nhất' badge", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.getByText("Phổ biến nhất")).toBeVisible();
  });

  test("Speaking card has AI badge", async ({ authenticatedPage: page }) => {
    await expect(page.getByText("AI").first()).toBeVisible();
  });

  test("Video import card has Import badge", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.getByText("Import")).toBeVisible();
  });

  test("Dictation feature card links to /dictation", async ({
    authenticatedPage: page,
  }) => {
    const link = page.getByRole("link", { name: /dictation/i }).first();
    const href = await link.getAttribute("href");
    expect(href).toBe("/dictation");
  });

  test("Shadowing feature card links to /shadowing", async ({
    authenticatedPage: page,
  }) => {
    const links = page.getByRole("link", { name: /shadowing/i });
    const href = await links.first().getAttribute("href");
    expect(href).toBe("/shadowing");
  });

  test("Speaking card links to /speaking", async ({
    authenticatedPage: page,
  }) => {
    const link = page.getByRole("link", { name: /luyện nói/i }).first();
    const href = await link.getAttribute("href");
    expect(href).toBe("/speaking");
  });

  test("shows feature steps for Dictation", async ({
    authenticatedPage: page,
  }) => {
    await expect(
      page.getByText("Nghe và gõ lại câu")
    ).toBeVisible();
  });

  test("shows keyboard shortcut tip for Dictation", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.getByText(/Tab.*phát lại|Tab.*replay/i)).toBeVisible();
  });

  test("Dictation card navigation goes to /dictation", async ({
    authenticatedPage: page,
  }) => {
    const link = page.getByRole("link", { name: /dictation/i }).first();
    await link.click();
    await expect(page).toHaveURL(/\/dictation/);
  });

  test("root path redirects to /home", async ({ authenticatedPage: page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/home/);
  });
});
