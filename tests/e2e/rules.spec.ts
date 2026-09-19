import { test, expect, type Page } from "@playwright/test";

const PAGES = ["/", "/capabilities", "/private", "/your-mac", "/automation", "/notebooks", "/download", "/legal/privacy", "/legal/terms"];
const V11 = ["Telegram", "iMessage", "Sandboxed terminal"];

async function bodyText(page: Page) { return (await page.locator("body").innerText()); }

test("nav is exactly Capabilities · Privacy · Download", async ({ page }) => {
  await page.goto("/");
  const links = page.getByRole("navigation", { name: "Primary" }).getByRole("listitem").getByRole("link");
  await expect(links).toHaveText(["Capabilities", "Privacy", "Download"]);
});

test("v1.1 features never appear on home or deep pages", async ({ page }) => {
  for (const p of ["/", "/private", "/your-mac", "/automation", "/notebooks"]) {
    await page.goto(p);
    const t = await bodyText(page);
    for (const name of V11) expect(t, `${name} leaked on ${p}`).not.toContain(name);
  }
});

test("capabilities lists v1.1 features only under Coming in 1.1", async ({ page }) => {
  await page.goto("/capabilities");
  const soon = page.locator("#coming-in-1-1");
  for (const name of V11) await expect(soon.getByRole("heading", { name })).toBeVisible();
  const above = await page.locator("main > section:not(#coming-in-1-1)").allInnerTexts();
  for (const name of V11) expect(above.join("\n")).not.toContain(name);
});

test("no page makes a third-party request", async ({ page }) => {
  for (const p of PAGES) {
    const external: string[] = [];
    page.on("request", (r) => { const u = new URL(r.url()); if (!["127.0.0.1", "localhost"].includes(u.hostname)) external.push(r.url()); });
    await page.goto(p, { waitUntil: "networkidle" });
    expect(external, `external requests on ${p}`).toEqual([]);
    page.removeAllListeners("request");
  }
});

test("waitlist form posts to Buttondown with an email field", async ({ page }) => {
  await page.goto("/download");
  const form = page.getByTestId("waitlist");
  await expect(form).toHaveAttribute("method", /post/i);
  await expect(form).toHaveAttribute("action", /^https:\/\/buttondown\.com\/api\/emails\/embed-subscribe\/[^/]+$/);
  await expect(form.locator('input[name="email"][type="email"][required]')).toHaveCount(1);
});

test("no price appears anywhere", async ({ page }) => {
  for (const p of PAGES) {
    await page.goto(p);
    expect(await bodyText(page), `price on ${p}`).not.toMatch(/\$\s?\d|\d+\s?(USD|dollars)/);
  }
});

test("banned words are absent", async ({ page }) => {
  for (const p of PAGES) {
    await page.goto(p);
    expect(await bodyText(page), `banned copy on ${p}`).not.toMatch(/unleash|supercharge|AI-powered/i);
  }
});
