import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { setInjectedKeys } from "./input.ts";
import { DEPOSITS, GATHER_RADIUS, PICKUP_RADIUS, SPAWN, canStand } from "./layout.ts";
import { beginPlay, getDeposits, getPlayer, resetWorld, stepWorld, teleport, tryGather } from "./sim.ts";

function frames(seconds: number) {
  let left = seconds;
  while (left > 1e-8) {
    const dt = Math.min(1 / 60, left);
    stepWorld(dt);
    left -= dt;
  }
}

describe("core gathering", () => {
  beforeEach(() => {
    resetWorld();
    setInjectedKeys([]);
    beginPlay();
  });

  it("puts every deposit on walkable crust, clear of the spawn pickup", () => {
    for (const spot of DEPOSITS) {
      assert.equal(canStand(spot.x, spot.z), true, `deposit ${spot.id} is not standable`);
      const dist = Math.hypot(spot.x - SPAWN.x, spot.z - SPAWN.z);
      assert.ok(dist > PICKUP_RADIUS + 0.4, `deposit ${spot.id} overlaps spawn`);
    }
  });

  it("collects on the ground plane when you walk into a deposit", () => {
    const spot = DEPOSITS[0]!;
    teleport(spot.x, spot.z);
    stepWorld(1 / 60);
    assert.equal(getDeposits().find((deposit) => deposit.id === spot.id)?.taken, true);
    const again = getDeposits().filter((deposit) => deposit.taken).length;
    stepWorld(1 / 60);
    assert.equal(
      getDeposits().filter((deposit) => deposit.taken).length,
      again,
      "a taken deposit must not count twice",
    );
  });

  it("does not collect a deposit that is only visually close", () => {
    const spot = DEPOSITS[0]!;
    teleport(spot.x + PICKUP_RADIUS + 0.45, spot.z);
    stepWorld(1 / 60);
    assert.equal(getDeposits().find((deposit) => deposit.id === spot.id)?.taken, false);
  });

  it("gathers the nearest deposit inside the longer reach", () => {
    const spot = DEPOSITS[1]!;
    teleport(spot.x + GATHER_RADIUS - 0.3, spot.z);
    assert.equal(tryGather(), true);
    assert.equal(getDeposits().find((deposit) => deposit.id === spot.id)?.taken, true);
  });

  it("refuses gather when nothing is in reach", () => {
    teleport(SPAWN.x, SPAWN.z);
    assert.equal(tryGather(), false);
  });

  it("moves forward along camera -Z and yaws left on A", () => {
    const z0 = getPlayer().z;
    setInjectedKeys(["KeyW"]);
    frames(0.5);
    assert.ok(getPlayer().z < z0 - 1, `expected forward, z ${getPlayer().z}`);
    assert.ok(getPlayer().speed > 1);
    const y0 = getPlayer().yaw;
    setInjectedKeys(["KeyW", "KeyA"]);
    frames(0.35);
    const turned = Math.atan2(Math.sin(getPlayer().yaw - y0), Math.cos(getPlayer().yaw - y0));
    assert.ok(turned > 0.05, `A should yaw left, got ${turned}`);
  });

  it("yaws right on D", () => {
    setInjectedKeys(["KeyW"]);
    frames(0.2);
    const y0 = getPlayer().yaw;
    setInjectedKeys(["KeyW", "KeyD"]);
    frames(0.35);
    const turned = Math.atan2(Math.sin(getPlayer().yaw - y0), Math.cos(getPlayer().yaw - y0));
    assert.ok(turned < -0.05, `D should yaw right, got ${turned}`);
  });
});
