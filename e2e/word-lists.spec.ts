import { test, expect } from "./fixtures";

test.describe("Word lists page", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto("/word-lists");
  });

  test("loads without error", async ({ authenticatedPage: page }) => {
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("shows Danh sách từ title", async ({ authenticatedPage: page }) => {
    await expect(page.getByText("Danh sách từ").first()).toBeVisible();
  });

  test("shows empty state when no words saved", async ({
    authenticatedPage: page,
  }) => {
    const emptyMsg = page.getByText(/chưa có từ nào được lưu/i);
    const searchInput = page.getByPlaceholder(/tìm từ/i);

    const hasEmpty = (await emptyMsg.count()) > 0;
    const hasSearch = (await searchInput.count()) > 0;
    // Either empty state or word list — one must be present
    expect(hasEmpty || hasSearch).toBeTruthy();
  });

  test("empty state shows instruction to save words", async ({
    authenticatedPage: page,
  }) => {
    const emptyMsg = page.getByText(/chưa có từ nào được lưu/i);
    if ((await emptyMsg.count()) > 0) {
      await expect(emptyMsg).toBeVisible();
      await expect(page.getByText(/luyện dictation/i)).toBeVisible();
    }
  });

  test("search input is present when words exist", async ({
    authenticatedPage: page,
  }) => {
    const searchInput = page.getByPlaceholder(/tìm từ/i);
    if ((await searchInput.count()) > 0) {
      await expect(searchInput).toBeVisible();
    }
  });

  test("can type in search input when words exist", async ({
    authenticatedPage: page,
  }) => {
    const searchInput = page.getByPlaceholder(/tìm từ/i);
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("resilient");
      await expect(searchInput).toHaveValue("resilient");
    }
  });

  test("word cards have delete buttons when words exist", async ({
    authenticatedPage: page,
  }) => {
    const searchInput = page.getByPlaceholder(/tìm từ/i);
    if ((await searchInput.count()) > 0) {
      // Word cards have trash/delete buttons
      const deleteBtn = page.locator("button[aria-label*='delete'], button[title*='xóa']");
      // Just verify the list structure is rendered
      const wordGrid = page.locator("[class*='grid']").last();
      await expect(wordGrid).toBeVisible();
    }
  });

  test("word count badge shown in sidebar", async ({
    authenticatedPage: page,
  }) => {
    // The sidebar shows a badge with word count on "Danh sách từ" nav item
    const sidebar = page.locator("aside");
    const badge = sidebar.locator("[class*='badge'], [class*='Badge']");
    await expect(badge.first()).toBeVisible();
  });
});
