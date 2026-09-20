import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://127.0.0.1:4321" },
  // No `webServer`: Astro 7's `astro preview` backgrounds only with --background (and binds
  // [::1] by default), so Playwright cannot own it. `make e2e` starts it on 127.0.0.1 with
  // --background, runs the tests, and always stops it.
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
