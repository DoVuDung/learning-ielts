import { chromium } from "@playwright/test";
import { SignJWT } from "jose";
import fs from "fs";
import path from "path";

export const TEST_JWT_SECRET = "playwright-e2e-test-secret-key-minimum-32chars!";

export const TEST_USER = {
  id: "playwright-test-user-id",
  email: "test@playwright.local",
  name: "Playwright Test User",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=playwright",
  isPremium: false,
};

export async function generateTestToken(): Promise<string> {
  const secret = new TextEncoder().encode(TEST_JWT_SECRET);
  return new SignJWT({ sub: TEST_USER.id, email: TEST_USER.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);
}

export default async function globalSetup() {
  const authDir = path.join(process.cwd(), "e2e/.auth");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const token = await generateTestToken();

  const browser = await chromium.launch();
  const context = await browser.newContext();

  await context.addCookies([
    {
      name: "access_token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    },
  ]);

  await context.storageState({ path: path.join(authDir, "user.json") });
  await browser.close();
}
