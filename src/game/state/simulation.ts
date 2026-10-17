import { getEnemyType } from "../enemies/registry.ts";
import { getMap } from "../maps/registry.ts";
import { buildMapPath } from "../paths/resolve.ts";
import { FINAL_EARTH_CORE_WAVE, planForWave } from "../spawning/waves.ts";
import { RULES } from "../theme.ts";
import { applySpires, SPIRE } from "../towers/spire.ts";
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
    credits: SPIRE.startingCores,
    towers: [],
    nextTowerId: 1,
  };
}

/**
 * Advance the match by dt seconds. Movement is arc-length along the solved
 * path, so a crawler cannot leave the lane. A leak subtracts exactly one life.
 * Spires damage enemies in range; a kill does not leak.
 */
export function stepMatch(state: MatchState, dt: number): void {
  if (!(dt > 0) || state.phase === "victory" || state.phase === "defeat") return;

  if (state.phase === "countdown") {
    state.countdown -= dt;
    if (state.countdown > 1e-4) return;
    state.countdown = 0;
    state.phase = "active";
    state.spawnTimer = 0;
  }

  for (const enemy of state.enemies) {
    enemy.distance += enemy.speed * dt;
    if (enemy.distance > state.path.totalLength) enemy.distance = state.path.totalLength;
  }

  applySpires(state, dt);

  let leakedNow = 0;
  const surviving = [];
  for (const enemy of state.enemies) {
    if (enemy.health <= 0) continue;
    if (enemy.distance >= state.path.totalLength) {
      leakedNow += 1;
      state.leakLog.push(enemy.id);
      continue;
    }
    surviving.push(enemy);
  }
  if (leakedNow > 0) {
    state.lives = Math.max(0, state.lives - leakedNow);
    state.leaked += leakedNow;
  }
  state.enemies = surviving;

  // A lethal breach ends the match immediately. No subsequent wave can spawn.
  if (state.lives === 0) {
    state.phase = "defeat";
    state.enemies = [];
    return;
  }

  if (state.spawnIndex < state.plan.length) {
    state.spawnTimer -= dt;
    while (state.spawnIndex < state.plan.length && state.spawnTimer <= 0) {
      const step = state.plan[state.spawnIndex]!;
      const def = getEnemyType(step.typeId);
      const maxHealth = Math.round(def.maxHealth * (1 + (state.wave - 1) * 0.25));
      state.enemies.push({
        id: state.nextId++,
        typeId: def.id,
        health: maxHealth,
        maxHealth,
        speed: def.speed * (1 + (state.wave - 1) * 0.08),
        distance: 0,
      });
      state.spawnIndex += 1;
      state.spawnTimer += Math.max(step.interval, 0.05);
    }
  }

  if (state.spawnIndex >= state.plan.length && state.enemies.length === 0) {
    if (state.wave >= FINAL_EARTH_CORE_WAVE) {
      state.phase = "victory";
    } else {
      // Preserve towers, cores and lives; reset only wave-local state.
      state.wave += 1;
      state.plan = planForWave(state.wave);
      state.spawnIndex = 0;
      state.spawnTimer = 0;
      state.countdown = 15;
      state.phase = "countdown";
    }
  }
}
