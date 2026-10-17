import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { useHud } from "./hud-store.ts";
import { ensureMatch, publish, restartMatch, tryPlace } from "./runtime.ts";
import { RULES } from "./theme.ts";
import { SPIRE } from "./towers/spire.ts";

describe("match restart", () => {
  it("clears old towers, notices, losses, wave and currency in both simulation and HUD", () => {
    restartMatch();
    assert.equal(tryPlace(0), true);
    const old = ensureMatch();
    old.wave = 4;
    old.lives = 0;
    old.phase = "defeat";
    old.leaked = 3;
    publish(old);
    useHud.setState({ notice: "Old warning" });

    restartMatch();
    const current = ensureMatch();
    const hud = useHud.getState();
    assert.notEqual(current, old);
    assert.equal(current.phase, "countdown");
    assert.equal(current.wave, 1);
    assert.equal(current.countdown, 60);
    assert.equal(current.lives, RULES.startingLives);
    assert.equal(current.credits, SPIRE.startingCores);
    assert.equal(current.towers.length, 0);
    assert.equal(current.enemies.length, 0);
    assert.equal(hud.wave, 1);
    assert.equal(hud.lives, RULES.startingLives);
    assert.equal(hud.credits, SPIRE.startingCores);
    assert.equal(hud.built.length, 0);
    assert.equal(hud.phase, "countdown");
    assert.equal(hud.notice, "");
    assert.equal(hud.leaked, 0);
  });

  it("does not allow placing towers after victory or defeat", () => {
    restartMatch();
    const state = ensureMatch();
    state.phase = "victory";
    assert.equal(tryPlace(0), false);
    assert.equal(state.towers.length, 0);
    restartMatch();
    const defeated = ensureMatch();
    defeated.phase = "defeat";
    assert.equal(tryPlace(0), false);
    assert.equal(defeated.credits, SPIRE.startingCores);
  });
});
