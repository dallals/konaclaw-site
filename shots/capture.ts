import { webkit } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { load } from "js-yaml";

type Shot = { id: string; conv?: string; route?: string; click?: string; ready: string };
const DASH = process.env.KC_DASH_URL ?? "http://127.0.0.1:5173";
const DEMO = join(homedir(), "KonaClawDemo");
const shots = load(readFileSync("shots/shots.yaml", "utf8")) as Shot[];

function routeFor(s: Shot) {
  if (s.route) return s.route;
  const f = join(DEMO, "data", `conv_${s.conv}.id`);
  if (!existsSync(f)) throw new Error(`missing ${f} — run shots/seed_demo.py first`);
  return `/chat?agent=Kona-AI&conv=${readFileSync(f, "utf8").trim()}`;
}

const browser = await webkit.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: "light" });
await ctx.addInitScript(() => { document.documentElement.setAttribute("data-theme", "light"); });
const page = await ctx.newPage();
for (const s of shots) {
  const url = DASH + routeFor(s);
  await page.goto(url, { waitUntil: "networkidle" });
  if (s.click) await page.locator(s.click).first().click();
  await page.locator(s.ready).first().waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `public/shots/${s.id}.png`, fullPage: false });
  console.log("captured", s.id, url);
}
await browser.close();
