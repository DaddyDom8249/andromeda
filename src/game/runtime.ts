import { samplePoly } from "./paths/sample.ts";
import { getMap } from "./maps/registry.ts";
import { useHud } from "./hud-store.ts";
import {
  collectCrystal,
  collectDrop,
  createMatch,
  startWaveNow,
  stepMatch,
  REWARD,
} from "./state/simulation.ts";
import type { EnemyRuntime, MatchPhase, MatchResult, MatchState, ResourceDrop } from "./state/types.ts";
import type { PolyPath } from "./paths/sample.ts";
import { placeSpire } from "./towers/spire.ts";

export interface AndromedaState {
  ready: boolean;
  lives: number;
  wave: number;
  phase: MatchPhase;
  result: MatchResult;
  countdown: number;
  spawned: number;
  alive: number;
  leaked: number;
  kills: number;
  score: number;
  credits: number;
  crystals: number;
  drops: number;
  spawnTotal: number;
  routeIds: string[];
  pathLength: number;
  enemies: {
    id: number;
    typeId: string;
    health: number;
    maxHealth: number;
    distance: number;
    x: number;
    y: number;
    z: number;
  }[];
}

export interface CameraSnap {
  x: number;
  y: number;
  z: number;
  tx: number;
  ty: number;
  tz: number;
  touchOne: number;
  touchTwo: number;
  mouseLeft: number;
  mouseRight: number;
  mouseMiddle: number;
}

let match: MatchState | null = null;
let cameraSnap: CameraSnap | null = null;
let ready = false;

export function ensureMatch(): MatchState {
  if (!match) match = createMatch();
  return match;
}

export function getEnemy(id: number): EnemyRuntime | undefined {
  return ensureMatch().enemies.find((enemy) => enemy.id === id);
}

export function getDrops(): readonly ResourceDrop[] {
  return ensureMatch().drops;
}

export function getActivePath(): PolyPath {
  return ensureMatch().path;
}

export function publish(state: MatchState = ensureMatch()): void {
  const curr = useHud.getState();
  const ids = state.enemies.map((enemy) => enemy.id);
  const sameRoster =
    curr.roster.length === ids.length && curr.roster.every((id, index) => id === ids[index]);
  const roster = sameRoster ? curr.roster : ids;
  const built = state.towers.map((tower) => tower.pad);
  const sameBuilt =
    curr.built.length === built.length && curr.built.every((pad, index) => pad === built[index]);
  const builtPads = sameBuilt ? curr.built : built;
  const dropIds = state.drops.map((drop) => drop.id);
  const sameDrops =
    curr.dropIds.length === dropIds.length &&
    curr.dropIds.every((id, index) => id === dropIds[index]);
  const remainingCrystals = getMap(state.mapId).props.filter((prop, index) =>
    prop.kind === "crystal" && !state.collectedCrystals.includes(index),
  ).length;
  if (
    Math.abs(curr.countdown - state.countdown) < 0.04 &&
    curr.lives === state.lives &&
    curr.wave === state.wave &&
    curr.phase === state.phase &&
    curr.result === state.result &&
    curr.spawned === state.spawnIndex &&
    curr.spawnTotal === state.plan.length &&
    curr.alive === state.enemies.length &&
    curr.leaked === state.leaked &&
    curr.kills === state.kills &&
    curr.score === state.score &&
    curr.credits === state.credits &&
    curr.crystalsRemaining === remainingCrystals &&
    sameDrops &&
    sameRoster &&
    sameBuilt
  ) {
    return;
  }
  useHud.setState({
    lives: state.lives,
    wave: state.wave,
    phase: state.phase,
    result: state.result,
    countdown: state.countdown,
    spawned: state.spawnIndex,
    spawnTotal: state.plan.length,
    alive: state.enemies.length,
    leaked: state.leaked,
    kills: state.kills,
    score: state.score,
    roster,
    credits: state.credits,
    built: builtPads,
    dropIds: sameDrops ? curr.dropIds : dropIds,
    crystalsRemaining: remainingCrystals,
  });
}

export function tryPlace(pad: number): boolean {
  const state = ensureMatch();
  if (state.phase === "resolved") return false;
  const notice = placeSpire(state, pad);
  publish(state);
  useHud.setState({ notice: notice || "Ember Spire built." });
  return notice === "";
}

export function tryCollectCrystal(index: number): boolean {
  const state = ensureMatch();
  if (!collectCrystal(state, index)) return false;
  publish(state);
  useHud.setState({ notice: `Crystal +${REWARD.crystalCores} cores · +${REWARD.crystalScore} score` });
  return true;
}

export function harvestNextCrystal(): boolean {
  const state = ensureMatch();
  const index = getMap(state.mapId).props.findIndex(
    (prop, i) => prop.kind === "crystal" && !state.collectedCrystals.includes(i),
  );
  return index >= 0 && tryCollectCrystal(index);
}

export function tryCollectDrop(id: number): boolean {
  const state = ensureMatch();
  if (!collectDrop(state, id)) return false;
  publish(state);
  useHud.setState({ notice: `Loot +${REWARD.dropCores} cores` });
  return true;
}

export function collectAllLoot(): number {
  const state = ensureMatch();
  const ids = state.drops.map((drop) => drop.id);
  for (const id of ids) collectDrop(state, id);
  if (ids.length) {
    publish(state);
    useHud.setState({ notice: `Collected ${ids.length} drop(s): +${ids.length * REWARD.dropCores} cores` });
  }
  return ids.length;
}

export function skipCountdown(): boolean {
  const state = ensureMatch();
  if (!startWaveNow(state)) return false;
  // Spawn on the next animation tick. Do not advance simulation twice here.
  publish(state);
  return true;
}

export function restartMatch(): void {
  match = createMatch();
  publish(match);
  useHud.setState({ notice: "" });
}

export function getEnemies(): readonly EnemyRuntime[] {
  return ensureMatch().enemies;
}

/** Fixed-step simulation; capped to avoid a background tab skipping an entire wave. */
export function tick(delta: number): void {
  const state = ensureMatch();
  let left = Math.min(Math.max(delta, 0), 0.1);
  const step = 1 / 60;
  while (left > 1e-5) {
    const dt = Math.min(step, left);
    stepMatch(state, dt);
    left -= dt;
  }
  publish(state);
}

export function setCameraSnap(snap: CameraSnap): void {
  cameraSnap = snap;
}

export function markReady(): void {
  ready = true;
}

export function installDebug(): void {
  if (typeof window === "undefined") return;
  window.__andromeda = {
    getState: () => {
      const state = ensureMatch();
      return {
        ready,
        lives: state.lives,
        wave: state.wave,
        phase: state.phase,
        result: state.result,
        countdown: state.countdown,
        spawned: state.spawnIndex,
        alive: state.enemies.length,
        leaked: state.leaked,
        kills: state.kills,
        score: state.score,
        credits: state.credits,
        crystals: state.collectedCrystals.length,
        drops: state.drops.length,
        spawnTotal: state.plan.length,
        routeIds: state.routeIds,
        pathLength: state.path.totalLength,
        enemies: state.enemies.map((enemy) => {
          const sample = samplePoly(state.path, enemy.distance);
          return {
            id: enemy.id,
            typeId: enemy.typeId,
            health: enemy.health,
            maxHealth: enemy.maxHealth,
            distance: enemy.distance,
            x: sample.position[0],
            y: sample.position[1],
            z: sample.position[2],
          };
        }),
      };
    },
    getCamera: () => cameraSnap,
  };
}

declare global {
  interface Window {
    __andromeda?: {
      getState: () => AndromedaState;
      getCamera: () => CameraSnap | null;
    };
  }
}
