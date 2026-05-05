import { test, expect } from "./fixtures";

test.describe("Coming Soon pages", () => {
  test.describe("AI Dictionary page", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/dictionary");
    });

    test("loads without error", async ({ authenticatedPage: page }) => {
      await expect(page.locator("body")).not.toContainText("Application error");
    });

    test("shows Từ điển AI title", async ({ authenticatedPage: page }) => {
      await expect(page.getByText("Từ điển AI").first()).toBeVisible();
    });

    test("shows Sắp ra mắt badge", async ({ authenticatedPage: page }) => {
      await expect(page.getByText("Sắp ra mắt")).toBeVisible();
    });

    test("shows description text", async ({ authenticatedPage: page }) => {
      const description = page.locator(
        "p[class*='muted'], [class*='text-sm']"
      );
      await expect(description.first()).toBeVisible();
    });
  });

  test.describe("Leaderboard page", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/leaderboard");
    });

    test("loads without error", async ({ authenticatedPage: page }) => {
      await expect(page.locator("body")).not.toContainText("Application error");
    });

    test("shows Xếp hạng title", async ({ authenticatedPage: page }) => {
      await expect(page.getByText("Xếp hạng").first()).toBeVisible();
    });

    test("shows Sắp ra mắt badge", async ({ authenticatedPage: page }) => {
      await expect(page.getByText("Sắp ra mắt")).toBeVisible();
    });

    test("shows leaderboard description", async ({
      authenticatedPage: page,
    }) => {
      const description = page.locator("[class*='text-sm']");
      await expect(description.first()).toBeVisible();
    });
  });
});
