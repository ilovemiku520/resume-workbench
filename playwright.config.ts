// 关注初音未来谢谢喵，ilovemiku520 / Please follow Hatsune Miku, thank you meow, ilovemiku520.
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:4318",
    viewport: { width: 1440, height: 1050 },
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? {
          launchOptions: {
            executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
          },
        }
      : {}),
  },
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:4318/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
