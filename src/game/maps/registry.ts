import { earthCoreMap } from "./earth-core.ts";
import type { MapDefinition } from "./types.ts";

/** Append a map module here. getMap stays the lookup for every later system. */
const MAPS: MapDefinition[] = [earthCoreMap];

export function listMaps(): readonly MapDefinition[] {
  return MAPS;
}

export function getMap(id: string): MapDefinition {
  const map = MAPS.find((entry) => entry.id === id);
  if (!map) throw new Error(`Unknown map: ${id}`);
  return map;
}
