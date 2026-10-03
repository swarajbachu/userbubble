import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  outputDir: ".context/playwright",
  reporter: [
    ["list"],
    ["html", { outputFolder: ".context/playwright-report", open: "never" }],
  ],
  use: {
    baseURL: process.env.TEST_APP_URL ?? "http://localhost:3000",
    launchOptions: {
      executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome",
      args: ["--no-sandbox"],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
