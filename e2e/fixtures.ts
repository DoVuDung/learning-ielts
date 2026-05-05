import { test as base, expect, type Page, type Route } from "@playwright/test";
import { TEST_USER } from "./global-setup";

export { expect };

export const MOCK_VIDEOS = [
  {
    id: "mock-video-1",
    title: "IELTS Speaking Band 7+ Practice",
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: 240,
    level: "B2",
    category: "IELTS",
    segments: 12,
    isNew: false,
  },
  {
    id: "mock-video-2",
    title: "BBC News: Climate Change Special",
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: 180,
    level: "C1",
    category: "BBC",
    segments: 8,
    isNew: true,
  },
];

export const MOCK_WORDS = [
  {
    id: "word-1",
    word: "resilient",
    context: "The community was surprisingly resilient.",
    interval: 1,
    easeFactor: 2.5,
    nextReview: new Date().toISOString(),
    userId: TEST_USER.id,
  },
];

export const MOCK_PROGRESS = [
  {
    id: "progress-1",
    userId: TEST_USER.id,
    videoId: "mock-video-1",
    sentencesDone: 6,
    totalSentences: 12,
    completedAt: null,
    updatedAt: new Date().toISOString(),
    video: { title: "IELTS Speaking Band 7+ Practice", level: "B2" },
  },
];

async function mockAuthMe(page: Page) {
  await page.route("/api/auth/me", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(TEST_USER),
    });
  });
}

async function mockVideosApi(page: Page) {
  await page.route("/api/videos", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_VIDEOS),
    });
  });
}

async function mockWordsApi(page: Page) {
  await page.route("/api/words", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_WORDS),
      });
    } else {
      await route.continue();
    }
  });

  await page.route("/api/words/review", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
}

async function mockProgressApi(page: Page) {
  await page.route("/api/progress", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_PROGRESS),
      });
    } else {
      await route.continue();
    }
  });
}

async function mockSpeakingApi(page: Page) {
  await page.route("/api/speaking", async (route: Route) => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const chunk = encoder.encode(
          "Hello! I'm your AI conversation partner. Let's practice English together. How has your day been?"
        );
        controller.enqueue(chunk);
        controller.close();
      },
    });
    await route.fulfill({
      status: 200,
      contentType: "text/plain",
      body: "Hello! I'm your AI conversation partner. Let's practice English together. How has your day been?",
    });
  });
}

type Fixtures = {
  authenticatedPage: Page;
  mockedPage: Page;
};

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    await mockAuthMe(page);
    await use(page);
  },
  mockedPage: async ({ page }, use) => {
    await mockAuthMe(page);
    await mockVideosApi(page);
    await mockWordsApi(page);
    await mockProgressApi(page);
    await mockSpeakingApi(page);
    await use(page);
  },
});
