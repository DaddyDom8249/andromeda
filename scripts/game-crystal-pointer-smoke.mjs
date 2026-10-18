#!/usr/bin/env node
/**
 * Touch/mouse verification of the *world mesh* collection route.
 * The existing gameplay smoke separately verifies the HUD fallback.
 */
import assert from "node:assert/strict";
import { PerspectiveCamera, Vector3 } from "three";
import { chromium } from "playwright";
import { earthCoreMap } from "../src/game/maps/earth-core.ts";

const crystals = earthCoreMap.props
  .map((prop, index) => ({ prop, index }))
  .filter(({ prop }) => prop.kind === "crystal");
assert.ok(crystals.length > 0, "earth core must contain collectible crystals");

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader"],
});

let failed = false;
try {
  for (const vp of [
    { name: "desktop", width: 1280, height: 800, touch: false },
    { name: "phone", width: 390, height: 844, touch: true },
  ]) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.touch,
      isMobile: vp.touch,
      deviceScaleFactor: 1,
    });
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    try {
      const response = await page.goto("http://127.0.0.1:8080/", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      assert.equal(response?.status(), 200);
      await page.waitForFunction(() =>
        window.__andromeda?.getState().ready && window.__andromeda?.getCamera(),
        null, { timeout: 45000 },
      );
      const snapshot = await page.evaluate(() => ({
        game: window.__andromeda.getState(),
        camera: window.__andromeda.getCamera(),
        bounds: (() => {
          const r = document.querySelector("canvas").getBoundingClientRect();
          return { left: r.left, top: r.top, width: r.width, height: r.height };
        })(),
      }));
      assert.equal(snapshot.game.credits, 120);
      assert.equal(snapshot.game.crystals, 0);
      const { camera: snap, bounds } = snapshot;
      assert.ok(bounds.width > 100 && bounds.height > 100);
      const camera = new PerspectiveCamera(60, bounds.width / bounds.height, 0.1, 1000);
      camera.position.set(snap.x, snap.y, snap.z);
      camera.lookAt(new Vector3(snap.tx, snap.ty, snap.tz));
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      const positions = crystals.map(({ prop, index }) => {
        const p = new Vector3(...prop.position).project(camera);
        return {
          index, scale: prop.scale,
          x: bounds.left + (p.x + 1) * bounds.width * 0.5,
          y: bounds.top + (1 - p.y) * bounds.height * 0.5,
          depth: camera.position.distanceTo(new Vector3(...prop.position)),
          behind: p.z < -1 || p.z > 1,
        };
      }).filter(p => !p.behind
        && p.x > bounds.left + 25 && p.x < bounds.left + bounds.width - 25
        && p.y > bounds.top + 85 && p.y < bounds.top + bounds.height - 120
      ).sort((a,b) => a.depth - b.depth);
      assert.ok(positions.length > 0, "camera must frame at least one crystal without HUD overlap");

      let picked = null;
      for (const pos of positions) {
        if (vp.touch) await page.touchscreen.tap(pos.x, pos.y);
        else await page.mouse.click(pos.x, pos.y);
        const game = await page.evaluate(() => window.__andromeda.getState());
        if (game.crystals === 1) {
          assert.equal(game.credits, 145, "tapping the 3D crystal must add 25 cores");
          assert.equal(game.score, 50, "tapping the 3D crystal must add 50 score");
          picked = pos;
          break;
        }
      }
      assert.ok(picked, `${vp.name} pointer interaction must harvest a visible crystal`);
      // Claiming the same mesh twice must not mint currency.
      if (vp.touch) await page.touchscreen.tap(picked.x, picked.y);
      else await page.mouse.click(picked.x, picked.y);
      const again = await page.evaluate(() => window.__andromeda.getState());
      assert.equal(again.credits, 145, "a crystal must pay only once");
      assert.equal(again.crystals, 1, "a crystal must be consumed only once");
      assert.deepEqual(errors, [], "no uncaught browser errors");
      console.log(`PASS ${vp.name}: 3D crystal ${picked.index} tapped, +25 cores and +50 score, no double payout`);
    } catch (error) {
      failed = true;
      console.error(`FAIL ${vp.name}: ${error.stack || error}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
if (failed) process.exitCode = 1;
