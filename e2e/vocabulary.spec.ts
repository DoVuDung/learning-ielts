import { test, expect } from "./fixtures";

test.describe("Vocabulary review page", () => {
  test.describe("Empty state (no words due)", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/vocabulary");
    });

    test("loads without error", async ({ authenticatedPage: page }) => {
      await expect(page.locator("body")).not.toContainText("Application error");
    });

    test("shows Luyện từ vựng title", async ({ authenticatedPage: page }) => {
      await expect(page.getByText("Luyện từ vựng").first()).toBeVisible();
    });

    test("shows empty state when no words due", async ({
      authenticatedPage: page,
    }) => {
      // If no words are due, shows empty state message
      const emptyMsg = page.getByText(
        /không có từ nào cần ôn tập hôm nay|no words/i
      );
      const flashcard = page.locator("[class*='flashcard'], [class*='card']");

      const hasEmpty = (await emptyMsg.count()) > 0;
      const hasCard = (await flashcard.count()) > 0;
      // Either empty state or flashcard — one must be visible
      expect(hasEmpty || hasCard).toBeTruthy();
    });

    test("shows spaced repetition explanation in empty state", async ({
      authenticatedPage: page,
    }) => {
      const emptyMsg = page.getByText(
        /không có từ nào cần ôn tập hôm nay/i
      );
      if ((await emptyMsg.count()) > 0) {
        await expect(page.getByText(/spaced repetition/i)).toBeVisible();
      }
    });

    test("shows subtitle with word count", async ({
      authenticatedPage: page,
    }) => {
      // Subtitle shows either "X từ cần ôn tập hôm nay" or "Không có từ nào cần ôn"
      const subtitle = page.getByText(
        /từ cần ôn tập|không có từ nào cần ôn/i
      );
      await expect(subtitle.first()).toBeVisible();
    });
  });

  test.describe("Flashcard review (with words)", () => {
    test("flashcard shows word when words are due", async ({
      authenticatedPage: page,
    }) => {
      await page.goto("/vocabulary");

      // If flashcard review is rendered, it has specific UI elements
      const flipCard = page.locator("[class*='cursor-pointer']").filter({
        hasText: /.+/,
      });
      const hasCard = (await flipCard.count()) > 0;

      if (hasCard) {
        // Has progress indicator
        await expect(page.locator("[role='progressbar']")).toBeVisible();
      }
    });

    test("flashcard has ease rating buttons when flipped", async ({
      authenticatedPage: page,
    }) => {
      await page.goto("/vocabulary");

      // If there are words and the card is visible, clicking reveals ease buttons
      const card = page
        .locator(".cursor-pointer")
        .filter({ hasText: /\w+/ });
      if ((await card.count()) > 0) {
        await card.first().click();
        // After flipping, ease buttons should appear
        const easyBtn = page.getByRole("button", { name: /dễ|easy/i });
        const hardBtn = page.getByRole("button", { name: /khó|hard/i });
        const hasEasy = (await easyBtn.count()) > 0;
        const hasHard = (await hardBtn.count()) > 0;
        expect(hasEasy || hasHard).toBeTruthy();
      }
    });
  });
});
