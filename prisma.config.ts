import path from "node:path";
import { loadEnvFile } from "node:process";
import { defineConfig } from "prisma/config";

try {
  loadEnvFile(path.resolve(__dirname, ".env"));
} catch {
  // .env may not exist in production
}

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL!,
  },
});
