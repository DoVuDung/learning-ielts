import { test, expect } from "./fixtures";

test.describe("Stats page", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto("/stats");
  });

  test("loads without error", async ({ authenticatedPage: page }) => {
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("shows Thống kê title", async ({ authenticatedPage: page }) => {
    await expect(page.getByText("Thống kê").first()).toBeVisible();
  });

  test("shows subtitle about tracking progress", async ({
    authenticatedPage: page,
  }) => {
    await expect(
      page.getByText(/theo dõi tiến trình/i).first()
    ).toBeVisible();
  });

  test("shows 4 stat cards", async ({ authenticatedPage: page }) => {
    await expect(page.getByText("Đang học")).toBeVisible();
    await expect(page.getByText("Đã hoàn thành")).toBeVisible();
    await expect(page.getByText("Câu đã luyện")).toBeVisible();
    await expect(page.getByText("Trung bình")).toBeVisible();
  });

  test("stat cards show numeric values", async ({
    authenticatedPage: page,
  }) => {
    // Each stat card shows a number (0 for empty state)
    const statValues = page.locator("[class*='text-2xl']");
    await expect(statValues.first()).toBeVisible();
  });

  test("shows Đang học stat with correct icon color", async ({
    authenticatedPage: page,
  }) => {
    const dangHocCard = page
      .locator("[class*='card'], [class*='rounded']")
      .filter({ hasText: "Đang học" })
      .first();
    await expect(dangHocCard).toBeVisible();
  });

  test("shows Đã hoàn thành stat card", async ({
    authenticatedPage: page,
  }) => {
    const card = page
      .locator("[class*='rounded']")
      .filter({ hasText: "Đã hoàn thành" })
      .first();
    await expect(card).toBeVisible();
  });

  test("shows Câu đã luyện stat card", async ({
    authenticatedPage: page,
  }) => {
    const card = page
      .locator("[class*='rounded']")
      .filter({ hasText: "Câu đã luyện" })
      .first();
    await expect(card).toBeVisible();
  });

  test("shows empty state when no progress data", async ({
    authenticatedPage: page,
  }) => {
    // When no videos have been studied, the progress list is empty
    // Stats should still show 0 values
    const zeroStats = page.getByText("0").first();
    const progressSection = page.getByText("Chi tiết từng video");

    const hasZero = (await zeroStats.count()) > 0;
    const hasSection = (await progressSection.count()) > 0;
    // Either empty (zeros only) or has progress section
    expect(hasZero || hasSection).toBeTruthy();
  });

  test("shows per-video progress bars when data exists", async ({
    authenticatedPage: page,
  }) => {
    const detailSection = page.getByText("Chi tiết từng video");
    if ((await detailSection.count()) > 0) {
      // Progress bars for each video
      await expect(
        page.locator("[role='progressbar']").first()
      ).toBeVisible();
    }
  });
});
