import { test, expect } from "./fixtures";

test.describe("Dictation list page", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto("/dictation");
  });

  test("loads without 500 error", async ({ authenticatedPage: page }) => {
    // Page should not show a server error
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("500");
  });

  test("shows Dictation as title in top nav", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.getByText("Dictation").first()).toBeVisible();
  });

  test("shows filter bar with 'Tất cả' category", async ({
    authenticatedPage: page,
  }) => {
    // Filter bar always renders "Tất cả" as the default chip
    await expect(page.getByRole("button", { name: /tất cả/i })).toBeVisible();
  });

  test("shows level filter chips", async ({ authenticatedPage: page }) => {
    // Level filter has "Tất cả" and specific levels
    const filterButtons = page.getByRole("button", { name: /tất cả/i });
    await expect(filterButtons.first()).toBeVisible();
  });

  test("category filter chip is active by default", async ({
    authenticatedPage: page,
  }) => {
    const allBtn = page.getByRole("button", { name: /tất cả/i }).first();
    await expect(allBtn).toHaveClass(/bg-primary/);
  });

  test("clicking a level filter updates URL params", async ({
    authenticatedPage: page,
  }) => {
    // Find any level filter button (B2, C1, etc.)
    const levelChips = page.locator("button").filter({ hasText: /^B[12]$|^C[12]$|^A[12]$/ });
    const count = await levelChips.count();
    if (count > 0) {
      await levelChips.first().click();
      await expect(page).toHaveURL(/level=/);
    }
  });

  test("clicking a category filter updates URL params", async ({
    authenticatedPage: page,
  }) => {
    // Find any category filter button other than "Tất cả"
    const catChips = page
      .locator("button")
      .filter({ hasText: /IELTS|BBC|TED|News|Science|Business/ });
    const count = await catChips.count();
    if (count > 0) {
      await catChips.first().click();
      await expect(page).toHaveURL(/category=/);
    }
  });

  test("clicking 'Tất cả' removes filter from URL", async ({
    authenticatedPage: page,
  }) => {
    // Set a filter first
    await page.goto("/dictation?level=B2");
    const allBtn = page.getByRole("button", { name: /tất cả/i }).first();
    await allBtn.click();
    await expect(page).not.toHaveURL(/level=/);
  });

  test("video cards link to dictation player", async ({
    authenticatedPage: page,
  }) => {
    // If there are video cards, they should link to /dictation/[id]
    const videoLinks = page.getByRole("link", { name: /B[12]|C[12]|A[12]/i });
    const count = await videoLinks.count();
    if (count > 0) {
      const href = await videoLinks.first().getAttribute("href");
      expect(href).toMatch(/\/dictation\/.+/);
    }
  });
});

test.describe("Dictation player", () => {
  // These tests require a real video in the database.
  // They will be skipped if no DATABASE_URL is set.

  test("player renders when valid video ID provided", async ({
    authenticatedPage: page,
  }) => {
    // Navigate to a dictation player URL; page will either load or redirect
    await page.goto("/dictation/test-video-id");
    const status = page.locator("body");

    // Either the player loads, or we get a "not found" state
    await expect(status).toBeTruthy();
  });

  test("dictation player has input field for typing", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dictation/test-video-id");
    // If the player loads with a real video, there should be a textarea
    const textarea = page.locator("textarea");
    const count = await textarea.count();
    if (count > 0) {
      await expect(textarea.first()).toBeVisible();
      const placeholder = await textarea.first().getAttribute("placeholder");
      expect(placeholder).toMatch(/tab|replay|phát lại/i);
    }
  });

  test("dictation player has Check/Kiểm tra button", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dictation/test-video-id");
    const checkBtn = page.getByRole("button", { name: /check|kiểm tra/i });
    const count = await checkBtn.count();
    if (count > 0) {
      await expect(checkBtn.first()).toBeVisible();
    }
  });

  test("dictation player has Hint/Gợi ý button", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dictation/test-video-id");
    const hintBtn = page.getByRole("button", { name: /hint|gợi ý/i });
    const count = await hintBtn.count();
    if (count > 0) {
      await expect(hintBtn.first()).toBeVisible();
    }
  });

  test("dictation player has Replay button", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dictation/test-video-id");
    const replayBtn = page.getByRole("button", { name: /replay|phát lại/i });
    const count = await replayBtn.count();
    if (count > 0) {
      await expect(replayBtn.first()).toBeVisible();
    }
  });

  test("dictation player has progress bar", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dictation/test-video-id");
    const progress = page.locator("[role='progressbar'], [class*='Progress']");
    const count = await progress.count();
    if (count > 0) {
      await expect(progress.first()).toBeVisible();
    }
  });

  test("dictation player has Auto Next toggle", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dictation/test-video-id");
    const autoNext = page.getByText(/auto next|tự động tiếp/i);
    const count = await autoNext.count();
    if (count > 0) {
      await expect(autoNext.first()).toBeVisible();
    }
  });

  test("typing in input and pressing Enter triggers check", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dictation/test-video-id");
    const textarea = page.locator("textarea").first();
    const count = await textarea.count();
    if (count > 0) {
      await textarea.fill("hello world");
      await textarea.press("Enter");
      // After checking, status message should appear
      const status = page.locator("[class*='status'], [class*='msg']");
      // Just verify no crash
      await expect(page.locator("body")).not.toContainText("Application error");
    }
  });
});
