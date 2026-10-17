import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { distanceToPathXZ, samplePoly } from "../paths/sample.ts";
import { RULES } from "../theme.ts";
import { getMap } from "../maps/registry.ts";
import { listWaves } from "../spawning/waves.ts";
import { buildPads, placeSpire, SPIRE } from "../towers/spire.ts";
import { collectCrystal, collectDrop, createMatch, REWARD, startWaveNow, stepMatch } from "./simulation.ts";
import type { MatchState } from "./types.ts";

function advance(state: MatchState, seconds: number, step = 1 / 60) {
  let left = seconds;
  while (left > 1e-8) {
    const dt = Math.min(step, left);
    stepMatch(state, dt);
    left -= dt;
  }
}

function assertOnLane(state: MatchState) {
  for (const enemy of state.enemies) {
    assert.ok(enemy.distance >= -1e-6);
    assert.ok(enemy.distance <= state.path.totalLength + 1e-6);
    const sample = samplePoly(state.path, enemy.distance);
    assert.ok(
      distanceToPathXZ(sample.position, state.path) < 1e-3,
      `crawler ${enemy.id} left the lane`,
    );
    assert.equal(enemy.typeId, "magma-crawler");
    assert.equal(enemy.health, enemy.maxHealth);
  }
}

describe("earth core match", () => {
  it("opens on wave 1 with 20 lives and a 60 second countdown", () => {
    const state = createMatch();
    assert.equal(state.mapId, "earth-core");
    assert.equal(state.lives, 20);
    assert.equal(state.wave, 1);
    assert.equal(state.phase, "countdown");
    assert.equal(state.countdown, RULES.countdownSeconds);
    assert.equal(state.enemies.length, 0);
    assert.equal(state.routeIds[0], "spawn");
    assert.equal(state.routeIds[state.routeIds.length - 1], "exit");
    assert.ok(state.path.totalLength > 40);
  });

  it("holds the wave for 60 seconds, then releases the first crawler", () => {
    const state = createMatch();
    let elapsed = 0;
    while (state.phase === "countdown" && elapsed < 80) {
      stepMatch(state, 1 / 60);
      elapsed += 1 / 60;
    }
    assert.ok(Math.abs(elapsed - 60) < 0.03, `countdown ended at ${elapsed}`);
    assert.equal(state.phase, "active");
    assert.equal(state.enemies.length, 1);
    assert.equal(state.lives, 20);
  });

  it("spawns exactly five magma crawlers and keeps them on the path", () => {
    const state = createMatch();
    advance(state, 60 + 1.2 * 4 + 0.08);
    assert.equal(state.spawnIndex, 5);
    assert.equal(state.enemies.length, 5);
    assert.equal(state.leaked, 0);
    assertOnLane(state);
    const before = state.enemies.map((enemy) => enemy.distance);
    advance(state, 1);
    state.enemies.forEach((enemy, index) => {
      assert.ok(enemy.distance > before[index]!);
    });
    assertOnLane(state);
    advance(state, 3);
    assert.equal(state.spawnIndex, 5);
  });

  it("moves at the crawler's authored speed", () => {
    const state = createMatch();
    advance(state, 60);
    const speed = state.enemies[0]!.speed;
    const start = state.enemies[0]!.distance;
    advance(state, 2);
    assert.ok(Math.abs(state.enemies[0]!.distance - start - speed * 2) < 0.05);
  });

  it("subtracts exactly one life for each crawler that reaches the exit", () => {
    const state = createMatch();
    let previousLives = state.lives;
    let previousLeaks = 0;
    let guard = 0;
    while (state.wave === 1 && guard < 20000) {
      stepMatch(state, 1 / 60);
      assertOnLane(state);
      if (state.leaked !== previousLeaks) {
        assert.equal(previousLives - state.lives, state.leaked - previousLeaks);
        previousLives = state.lives;
        previousLeaks = state.leaked;
      }
      guard += 1;
    }
    assert.ok(guard < 20000, "first wave must advance");
    assert.equal(state.phase, "countdown");
    assert.equal(state.wave, 2);
    assert.equal(state.leaked, 5);
    assert.equal(state.lives, 15);
    assert.equal(state.leakLog.length, 5);
    assert.equal(new Set(state.leakLog).size, 5);
    assert.equal(state.enemies.length, 0);
  });

  it("spends cores to raise a spire that kills a crawler without leaking", () => {
    const state = createMatch();
    const pads = buildPads(state.path);
    assert.ok(pads.length >= 4);
    assert.equal(placeSpire(state, 0), "");
    assert.equal(state.credits, SPIRE.startingCores - SPIRE.cost);
    assert.match(placeSpire(state, 0), /already/);
    advance(state, 60);
    const enemy = state.enemies[0]!;
    const ahead = samplePoly(state.path, enemy.distance + 2);
    state.towers[0] = {
      ...state.towers[0]!,
      x: ahead.position[0],
      y: ahead.position[1],
      z: ahead.position[2],
      cooldown: 0,
    };
    const lives = state.lives;
    advance(state, 2.2);
    assert.equal(state.enemies.some((crawler) => crawler.id === enemy.id), false);
    assert.equal(state.lives, lives);
    assert.equal(state.leakLog.includes(enemy.id), false);
  });
  it("advances through all five waves without silently freezing", () => {
    const state = createMatch();
    assert.equal(listWaves().length, 5);
    assert.equal(startWaveNow(state), true);
    assert.equal(startWaveNow(state), true);
    let guard = 0;
    while (state.phase !== "resolved" && guard < 30000) {
      stepMatch(state, 1 / 30);
      for (const enemy of state.enemies) enemy.health = 0;
      guard++;
    }
    assert.ok(guard < 30000, "progression did not terminate");
    assert.equal(state.result, "victory");
    assert.equal(state.wave, 5);
    assert.equal(state.kills, 45);
    assert.equal(state.score, 45 * REWARD.killScore);
    assert.equal(state.drops.length, 45);
    assert.equal(state.lives, RULES.startingLives);
    assert.equal(startWaveNow(state), false, "resolved game cannot start a new wave");
  });

  it("pays once for harvesting map crystals, never for props or repeats", () => {
    const state = createMatch();
    const props = getMap(state.mapId).props;
    const crystal = props.findIndex((prop) => prop.kind === "crystal");
    const rock = props.findIndex((prop) => prop.kind === "rock");
    assert.ok(crystal >= 0);
    assert.ok(rock >= 0);
    const initial = state.credits;
    assert.equal(collectCrystal(state, rock), false);
    assert.equal(collectCrystal(state, crystal), true);
    assert.equal(collectCrystal(state, crystal), false);
    assert.equal(state.credits, initial + REWARD.crystalCores);
    assert.equal(state.score, REWARD.crystalScore);
    assert.deepEqual(state.collectedCrystals, [crystal]);
  });

  it("creates one collectible resource drop per kill and prevents double claims", () => {
    const state = createMatch();
    startWaveNow(state);
    stepMatch(state, 1 / 60);
    assert.equal(state.enemies.length, 1);
    const enemyId = state.enemies[0]!.id;
    state.enemies[0]!.health = 0;
    stepMatch(state, 1 / 60);
    assert.equal(state.enemies.some((enemy) => enemy.id === enemyId), false);
    assert.equal(state.kills, 1);
    assert.equal(state.score, REWARD.killScore);
    assert.equal(state.drops.length, 1);
    const id = state.drops[0]!.id;
    const oldCores = state.credits;
    assert.equal(collectDrop(state, id), true);
    assert.equal(collectDrop(state, id), false);
    assert.equal(state.credits, oldCores + REWARD.dropCores);
    assert.equal(state.drops.length, 0);
    assert.equal(state.leaked, 0);
  });

  it("ends the stage in defeat at zero lives without spawning more enemies", () => {
    const state = createMatch();
    startWaveNow(state);
    stepMatch(state, 1 / 60);
    state.lives = 1;
    state.enemies[0]!.distance = state.path.totalLength - 0.01;
    stepMatch(state, 1 / 60);
    assert.equal(state.lives, 0);
    assert.equal(state.result, "defeat");
    assert.equal(state.phase, "resolved");
    const before = state.spawnIndex;
    stepMatch(state, 10);
    assert.equal(state.spawnIndex, before);
  });

});
