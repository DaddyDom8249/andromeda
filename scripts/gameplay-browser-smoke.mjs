#!/usr/bin/env node
/** Real browser smoke for both screen sizes; exercises HUD and WebGL runtime. */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.GAMEPLAY_URL || "http://127.0.0.1:8080";
const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-webgl",
    "--use-gl=angle",
    "--use-angle=swiftshader",
  ],
});

try {
  for (const viewport of [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.name === "mobile",
      isMobile: viewport.name === "mobile",
    });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const response = await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    assert.equal(response?.status(), 200, "app HTTP response");
    await page.locator("canvas").waitFor({ state: "visible", timeout: 45000 });
    await page.waitForFunction(() => window.__andromeda?.getState().ready === true, null, { timeout: 45000 });
    const first = await page.evaluate(() => window.__andromeda.getState());
    assert.equal(first.wave, 1);
    assert.equal(first.credits, 120);
    assert.equal(first.phase, "countdown");
    await page.getByTestId("harvest-crystal").click();
    const harvested = await page.evaluate(() => window.__andromeda.getState());
    assert.equal(harvested.credits, 145, "crystal must pay");
    assert.equal(harvested.score, 50, "crystal must award score");
    assert.equal(harvested.crystals, 1, "crystal must be consumed");
    await page.getByTestId("start-wave").click();
    await page.waitForFunction(() => window.__andromeda?.getState().phase === "active", null, { timeout: 15000 });
    const active = await page.evaluate(() => window.__andromeda.getState());
    assert.equal(active.wave, 1);
    assert.ok(active.spawned >= 1, "start wave must spawn enemies");
    assert.equal(pageErrors.length, 0, `${viewport.name} uncaught exceptions: ${pageErrors.join("; ")}`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    assert.equal(overflow, false, `${viewport.name} horizontal overflow`);
    console.log(`${viewport.name}: WebGL ready, crystal payout, score, wave start, layout PASS`);
    await page.close();
  }
} finally {
  await browser.close();
}
