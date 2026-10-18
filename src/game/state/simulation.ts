import { getEnemyType } from "../enemies/registry.ts";
import { getMap } from "../maps/registry.ts";
import { buildMapPath } from "../paths/resolve.ts";
import { samplePoly } from "../paths/sample.ts";
import { listWaves, planForWave } from "../spawning/waves.ts";
import { RULES } from "../theme.ts";
import { applySpires, SPIRE } from "../towers/spire.ts";
import type { MatchState } from "./types.ts";

export const REWARD = {
  killScore: 10,
  dropCores: 10,
  crystalCores: 25,
  crystalScore: 50,
  betweenWavesSeconds: 12,
} as const;

export function createMatch(mapId: string = RULES.mapId): MatchState {
  const map = getMap(mapId);
  const built = buildMapPath(map);
  return {
    mapId: map.id,
    lives: RULES.startingLives,
    wave: RULES.wave,
    phase: "countdown",
    result: null,
    countdown: RULES.countdownSeconds,
    spawnTimer: 0,
    spawnIndex: 0,
    plan: planForWave(RULES.wave),
    enemies: [],
    nextId: 1,
    leaked: 0,
    leakLog: [],
    kills: 0,
    score: 0,
    path: built.path,
    routeIds: built.route.ids,
    credits: SPIRE.startingCores,
    towers: [],
    nextTowerId: 1,
    collectedCrystals: [],
    drops: [],
    nextDropId: 1,
  };
}

/** Crystals already present on the map can be harvested once for cores and score. */
export function collectCrystal(state: MatchState, propIndex: number): boolean {
  if (state.phase === "resolved" || !Number.isInteger(propIndex)) return false;
  const prop = getMap(state.mapId).props[propIndex];
  if (prop?.kind !== "crystal" || state.collectedCrystals.includes(propIndex)) return false;
  state.collectedCrystals.push(propIndex);
  state.credits += REWARD.crystalCores;
  state.score += REWARD.crystalScore;
  return true;
}

/** A loot orb must be claimed, and can never pay twice. */
export function collectDrop(state: MatchState, id: number): boolean {
  const index = state.drops.findIndex((drop) => drop.id === id);
  if (index < 0) return false;
  const [drop] = state.drops.splice(index, 1);
  state.credits += drop!.cores;
  return true;
}

export function startWaveNow(state: MatchState): boolean {
  if (state.phase !== "countdown") return false;
  state.countdown = 0;
  return true;
}

/**
 * Advance the match. Kills earn score and spawn collectable cores, leaks cost
 * one life each. On clearance, the next wave receives a build countdown.
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

  for (const enemy of state.enemies) {
    enemy.distance = Math.min(state.path.totalLength, enemy.distance + enemy.speed * dt);
  }

  applySpires(state, dt);

  let leakedNow = 0;
  const surviving = [];
  for (const enemy of state.enemies) {
    if (enemy.health <= 0) {
      state.kills += 1;
      state.score += REWARD.killScore;
      const position = samplePoly(state.path, enemy.distance).position;
      state.drops.push({
        id: state.nextDropId++,
        x: position[0],
        y: position[1] + 1.15,
        z: position[2],
        cores: REWARD.dropCores,
      });
      continue;
    }
    if (enemy.distance >= state.path.totalLength) {
      leakedNow += 1;
      state.leakLog.push(enemy.id);
      continue;
    }
    surviving.push(enemy);
  }
  state.enemies = surviving;
  if (leakedNow > 0) {
    state.lives = Math.max(0, state.lives - leakedNow);
    state.leaked += leakedNow;
  }
  if (state.lives === 0) {
    state.phase = "resolved";
    state.result = "defeat";
    return;
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
    if (state.wave === listWaves().length) {
      state.phase = "resolved";
      state.result = "victory";
    } else {
      state.wave += 1;
      state.phase = "countdown";
      state.countdown = REWARD.betweenWavesSeconds;
      state.spawnIndex = 0;
      state.spawnTimer = 0;
      state.plan = planForWave(state.wave);
    }
  }
}
