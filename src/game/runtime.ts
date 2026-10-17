import { samplePoly } from "./paths/sample.ts";
import { useHud } from "./hud-store.ts";
import { createMatch, stepMatch } from "./state/simulation.ts";
import type { EnemyRuntime, MatchPhase, MatchState } from "./state/types.ts";
import type { PolyPath } from "./paths/sample.ts";

export interface AndromedaState {
  ready: boolean;
  lives: number;
  wave: number;
  phase: MatchPhase;
  countdown: number;
  spawned: number;
  alive: number;
  leaked: number;
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

export function getActivePath(): PolyPath {
  return ensureMatch().path;
}

export function publish(state: MatchState = ensureMatch()): void {
  const curr = useHud.getState();
  const ids = state.enemies.map((enemy) => enemy.id);
  const sameRoster =
    curr.roster.length === ids.length && curr.roster.every((id, index) => id === ids[index]);
  const roster = sameRoster ? curr.roster : ids;
  if (
    Math.abs(curr.countdown - state.countdown) < 0.04 &&
    curr.lives === state.lives &&
    curr.wave === state.wave &&
    curr.phase === state.phase &&
    curr.spawned === state.spawnIndex &&
    curr.spawnTotal === state.plan.length &&
    curr.alive === state.enemies.length &&
    curr.leaked === state.leaked &&
    sameRoster
  ) {
    return;
  }
  useHud.setState({
    lives: state.lives,
    wave: state.wave,
    phase: state.phase,
    countdown: state.countdown,
    spawned: state.spawnIndex,
    spawnTotal: state.plan.length,
    alive: state.enemies.length,
    leaked: state.leaked,
    roster,
  });
}

/** Fixed-step the simulation. Delta is capped so a stalled tab cannot skip the wave. */
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
        countdown: state.countdown,
        spawned: state.spawnIndex,
        alive: state.enemies.length,
        leaked: state.leaked,
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
