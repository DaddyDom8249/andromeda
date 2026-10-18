import type { PolyPath } from "../paths/sample.ts";
import type { SpawnStep } from "../spawning/waves.ts";

export type MatchPhase = "countdown" | "active" | "resolved";
export type MatchResult = "victory" | "defeat" | null;

export interface EnemyRuntime {
  id: number;
  typeId: string;
  health: number;
  maxHealth: number;
  speed: number;
  /** Distance along the designated path, in world units. */
  distance: number;
}

export interface TowerRuntime {
  id: number;
  pad: number;
  x: number;
  y: number;
  z: number;
  cooldown: number;
}

export interface ResourceDrop {
  id: number;
  x: number;
  y: number;
  z: number;
  cores: number;
}

export interface MatchState {
  mapId: string;
  lives: number;
  wave: number;
  phase: MatchPhase;
  result: MatchResult;
  countdown: number;
  spawnTimer: number;
  spawnIndex: number;
  plan: SpawnStep[];
  enemies: EnemyRuntime[];
  nextId: number;
  leaked: number;
  leakLog: number[];
  kills: number;
  score: number;
  path: PolyPath;
  routeIds: string[];
  credits: number;
  towers: TowerRuntime[];
  nextTowerId: number;
  collectedCrystals: number[];
  drops: ResourceDrop[];
  nextDropId: number;
}
