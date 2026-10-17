import type { Vec3 } from "../math/vec3.ts";
import type { PathGraph } from "../paths/types.ts";

export type SceneryKind = "rock" | "crystal" | "geyser" | "fall" | "isle";

export interface SceneryProp {
  kind: SceneryKind;
  position: Vec3;
  scale: number;
  phase: number;
}

export interface MapDefinition {
  id: string;
  name: string;
  world: string;
  biome: string;
  graph: PathGraph;
  spawnId: string;
  exitId: string;
  /** Corner fillet radius in world units. */
  fillet: number;
  props: SceneryProp[];
}
