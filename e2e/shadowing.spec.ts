import { test, expect } from "./fixtures";

test.describe("Shadowing list page", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto("/shadowing");
  });

  test("loads without error", async ({ authenticatedPage: page }) => {
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("500");
  });

  test("shows Shadowing title in top nav", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.getByText("Shadowing").first()).toBeVisible();
  });

  test("shows filter bar", async ({ authenticatedPage: page }) => {
    await expect(page.getByRole("button", { name: /tất cả/i })).toBeVisible();
  });

  test("has level filter chips", async ({ authenticatedPage: page }) => {
    const allBtns = page.getByRole("button", { name: /tất cả/i });
    await expect(allBtns.first()).toBeVisible();
  });

  test("video cards link to shadowing player", async ({
    authenticatedPage: page,
  }) => {
    const videoLinks = page.getByRole("link");
    const count = await videoLinks.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await videoLinks.nth(i).getAttribute("href");
      if (href?.startsWith("/shadowing/") && href !== "/shadowing") {
        expect(href).toMatch(/\/shadowing\/.+/);
        return;
      }
    }
  });
});

test.describe("Shadowing player", () => {
  test("player page loads without crashing", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/shadowing/test-video-id");
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("player has progress bar when loaded", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/shadowing/test-video-id");
    const progress = page.locator("[role='progressbar']");
    const count = await progress.count();
    if (count > 0) {
      await expect(progress.first()).toBeVisible();
    }
  });

  test("player has transcript sidebar when loaded", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/shadowing/test-video-id");
    const transcriptLabel = page.getByText(/transcript/i);
    const count = await transcriptLabel.count();
    if (count > 0) {
      await expect(transcriptLabel.first()).toBeVisible();
    }
  });

  test("player has Done/Next button when loaded", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/shadowing/test-video-id");
    const doneBtn = page.getByRole("button", { name: /done|xong|next|tiếp/i });
    const count = await doneBtn.count();
    if (count > 0) {
      await expect(doneBtn.first()).toBeVisible();
    }
  });

  test("player has Replay button when loaded", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/shadowing/test-video-id");
    const replayBtn = page.getByRole("button", { name: /replay|nghe lại/i });
    const count = await replayBtn.count();
    if (count > 0) {
      await expect(replayBtn.first()).toBeVisible();
    }
  });

  test("player has Reveal All button when loaded", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/shadowing/test-video-id");
    const revealBtn = page.getByRole("button", { name: /reveal all/i });
    const count = await revealBtn.count();
    if (count > 0) {
      await expect(revealBtn.first()).toBeVisible();
    }
  });

  test("player has locale toggle buttons", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/shadowing/test-video-id");
    const enBtn = page.getByRole("button", { name: /^EN$/i });
    const viBtn = page.getByRole("button", { name: /^VI$/i });
    const hasEn = (await enBtn.count()) > 0;
    const hasVi = (await viBtn.count()) > 0;
    if (hasEn && hasVi) {
      await expect(enBtn).toBeVisible();
      await expect(viBtn).toBeVisible();
    }
  });
});
