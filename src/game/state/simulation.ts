import { getEnemyType } from "../enemies/registry.ts";
import { getMap } from "../maps/registry.ts";
import { buildMapPath } from "../paths/resolve.ts";
import { planForWave } from "../spawning/waves.ts";
import { RULES } from "../theme.ts";
import type { MatchState } from "./types.ts";

export function createMatch(mapId: string = RULES.mapId): MatchState {
  const map = getMap(mapId);
  const built = buildMapPath(map);
  return {
    mapId: map.id,
    lives: RULES.startingLives,
    wave: RULES.wave,
    phase: "countdown",
    countdown: RULES.countdownSeconds,
    spawnTimer: 0,
    spawnIndex: 0,
    plan: planForWave(RULES.wave),
    enemies: [],
    nextId: 1,
    leaked: 0,
    leakLog: [],
    path: built.path,
    routeIds: built.route.ids,
  };
}

/**
 * Advance the match by dt seconds. Movement is arc-length along the solved
 * path, so a crawler cannot leave the lane. A leak subtracts exactly one life.
 */
export function stepMatch(state: MatchState, dt: number): void {
  if (!(dt > 0) || state.phase === "resolved") return;

  if (state.phase === "countdown") {
    state.countdown -= dt;
    if (state.countdown > 1e-4) return;
    state.countdown = 0;
    state.phase = "active";
    state.spawnTimer = 0;
  }

  let leakedNow = 0;
  for (const enemy of state.enemies) {
    enemy.distance += enemy.speed * dt;
    if (enemy.distance >= state.path.totalLength) {
      enemy.distance = state.path.totalLength;
      leakedNow += 1;
      state.leakLog.push(enemy.id);
    }
  }
  if (leakedNow > 0) {
    state.lives -= leakedNow;
    state.leaked += leakedNow;
    state.enemies = state.enemies.filter((enemy) => enemy.distance < state.path.totalLength);
  }

  if (state.spawnIndex < state.plan.length) {
    state.spawnTimer -= dt;
    while (state.spawnIndex < state.plan.length && state.spawnTimer <= 0) {
      const step = state.plan[state.spawnIndex]!;
      const def = getEnemyType(step.typeId);
      state.enemies.push({
        id: state.nextId++,
        typeId: def.id,
        health: def.maxHealth,
        maxHealth: def.maxHealth,
        speed: def.speed,
        distance: 0,
      });
      state.spawnIndex += 1;
      state.spawnTimer += Math.max(step.interval, 0.05);
    }
  }

  if (state.spawnIndex >= state.plan.length && state.enemies.length === 0) {
    state.phase = "resolved";
  }
}
