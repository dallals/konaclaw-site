import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { load } from "js-yaml";
const shots = load(readFileSync("shots/shots.yaml", "utf8")) as { id: string }[];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const s of shots) {
  await page.setContent(`<body style="margin:0;display:grid;place-items:center;height:100vh;background:#f4ede2;color:#8a7a6b;font:600 40px system-ui">PLACEHOLDER · ${s.id}</body>`);
  await page.screenshot({ path: `src/assets/shots/${s.id}.png` });
}
await browser.close();
console.log(`wrote ${shots.length} placeholders`);
