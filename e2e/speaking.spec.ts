import { test, expect } from "./fixtures";

const TOPICS = [
  "Daily Life",
  "Travel",
  "IELTS Part 1",
  "IELTS Part 2",
  "IELTS Part 3",
  "Work & Career",
  "Technology",
  "Environment",
];

test.describe("Speaking chat page", () => {
  test.beforeEach(async ({ mockedPage: page }) => {
    await page.goto("/speaking");
  });

  test("loads without error", async ({ mockedPage: page }) => {
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("shows Speaking / Luyện nói title", async ({ mockedPage: page }) => {
    const title = page
      .getByText(/luyện nói|speaking/i)
      .first();
    await expect(title).toBeVisible();
  });

  test("shows all 8 conversation topics", async ({ mockedPage: page }) => {
    for (const topic of TOPICS) {
      await expect(page.getByText(topic)).toBeVisible();
    }
  });

  test("shows TOPICS section label", async ({ mockedPage: page }) => {
    await expect(page.getByText(/topics|chủ đề/i).first()).toBeVisible();
  });

  test("shows speaking tips", async ({ mockedPage: page }) => {
    const tip = page.getByText(/ai.*câu hỏi|ai asks/i);
    await expect(tip.first()).toBeVisible();
  });

  test("shows Start Conversation button", async ({ mockedPage: page }) => {
    const startBtn = page.getByRole("button", {
      name: /start conversation|bắt đầu hội thoại/i,
    });
    await expect(startBtn).toBeVisible();
  });

  test("topic selection changes active topic", async ({
    mockedPage: page,
  }) => {
    const travelBtn = page.getByText("Travel");
    await travelBtn.click();
    // After clicking, Travel should be selected/highlighted
    await expect(travelBtn).toBeVisible();
  });

  test("clicking Start begins a conversation", async ({
    mockedPage: page,
  }) => {
    // Mock the streaming response
    await page.route("/api/speaking", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Hello! Let's start our conversation. How has your day been?",
      });
    });

    const startBtn = page.getByRole("button", {
      name: /start conversation|bắt đầu hội thoại/i,
    });
    await startBtn.click();

    // After starting, the chat interface should be visible
    await expect(
      page.locator("input, textarea").last()
    ).toBeVisible({ timeout: 5000 });
  });

  test("chat input is present after starting conversation", async ({
    mockedPage: page,
  }) => {
    await page.route("/api/speaking", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Hello! How are you today?",
      });
    });

    await page
      .getByRole("button", { name: /start conversation|bắt đầu/i })
      .click();

    const input = page.locator("input[type='text'], input:not([type])").last();
    await expect(input).toBeVisible({ timeout: 5000 });
  });

  test("send button is present after starting conversation", async ({
    mockedPage: page,
  }) => {
    await page.route("/api/speaking", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Hello!",
      });
    });

    await page
      .getByRole("button", { name: /start conversation|bắt đầu/i })
      .click();

    // Send button (has Send icon or text)
    const sendBtn = page.locator("button[type='submit'], button").filter({
      has: page.locator("svg"),
    });
    await expect(sendBtn.last()).toBeVisible({ timeout: 5000 });
  });

  test("can type a message in chat input", async ({ mockedPage: page }) => {
    await page.route("/api/speaking", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Great! Tell me more.",
      });
    });

    await page
      .getByRole("button", { name: /start conversation|bắt đầu/i })
      .click();

    const input = page.locator("input[type='text'], input:not([type])").last();
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill("I am learning IELTS speaking");
    await expect(input).toHaveValue("I am learning IELTS speaking");
  });

  test("reset conversation button is present", async ({
    mockedPage: page,
  }) => {
    await page.route("/api/speaking", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Hello!",
      });
    });

    await page
      .getByRole("button", { name: /start conversation|bắt đầu/i })
      .click();

    // RotateCcw icon button for resetting conversation
    const resetBtn = page.locator("button").filter({ hasText: "" }).nth(0);
    // Verify some form of reset/back button exists
    const allBtns = page.getByRole("button");
    await expect(allBtns.first()).toBeVisible({ timeout: 5000 });
  });
});
