import type { MapDefinition } from "../maps/types.ts";
import { findRoute } from "./pathfinding.ts";
import { buildPolyPath, smoothCorners, type PolyPath } from "./sample.ts";
import type { Route } from "./types.ts";

/** Pathfinding plus corner smoothing. Every match asks for its lane here. */
export function buildMapPath(
  map: Pick<MapDefinition, "graph" | "spawnId" | "exitId" | "fillet">,
): { route: Route; path: PolyPath } {
  const route = findRoute(map.graph, map.spawnId, map.exitId);
  const path = buildPolyPath(smoothCorners(route.points, map.fillet));
  return { route, path };
}
