import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.env.GAME_PREVIEW_URL || "http://127.0.0.1:8081/";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-webgl", "--use-angle=swiftshader"],
});
let failed = false;
try {
  await mkdir("screenshots", { recursive: true });
  for (const viewport of [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      assert.equal(response?.status(), 200, "preview must respond 200");
      await page.locator('[data-testid="hud"]').waitFor({ state: "visible", timeout: 15000 });
      await page.waitForFunction(() => window.__andromeda?.getState().ready === true, { timeout: 20000 });
      assert.equal(await page.locator("canvas").count(), 1, "3D canvas must render");
      assert.equal((await page.locator('[data-testid="lives"]').innerText()).trim(), "20");
      assert.equal((await page.locator('[data-testid="cores"]').innerText()).trim(), "120");
      const before = Number((await page.locator('[data-testid="countdown"]').innerText()).trim());
      await page.waitForTimeout(1500);
      const after = Number((await page.locator('[data-testid="countdown"]').innerText()).trim());
      assert.ok(after < before && before <= 60, `countdown must tick: ${before} -> ${after}`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      assert.equal(overflow, false, "HUD must not overflow viewport");
      assert.deepEqual(errors, [], "page must not throw browser errors");
      await page.screenshot({ path: `screenshots/game-${viewport.name}.png` });
      console.log(`PASS ${viewport.name}: canvas, HUD, 20 lives, 120 cores, countdown ${before}->${after}, no overflow/errors`);
    } catch (error) {
      failed = true;
      await page.screenshot({ path: `screenshots/game-${viewport.name}-failure.png` }).catch(() => {});
      console.error(`FAIL ${viewport.name}: ${error.message}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
if (failed) process.exitCode = 1;
