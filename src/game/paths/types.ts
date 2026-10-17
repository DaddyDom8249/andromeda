import type { Vec3 } from "../math/vec3.ts";

export interface PathNode {
  id: string;
  position: Vec3;
}

export interface PathEdge {
  from: string;
  to: string;
  /** Defaults to the distance between the nodes. */
  cost?: number;
  /** Defaults to true so a lane can be walked either way. */
  bidirectional?: boolean;
}

export interface PathGraph {
  nodes: PathNode[];
  edges: PathEdge[];
}

export interface Route {
  ids: string[];
  points: Vec3[];
}
