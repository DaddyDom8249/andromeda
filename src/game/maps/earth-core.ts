import type { Vec3 } from "../math/vec3.ts";
import { buildMapPath } from "../paths/resolve.ts";
import { distanceToPathXZ } from "../paths/sample.ts";
import type { MapDefinition, SceneryKind, SceneryProp } from "./types.ts";

const NODES: { id: string; at: Vec3 }[] = [
  { id: "spawn", at: [-16, 1.5, 10] },
  { id: "n01", at: [-10, 1.75, 10.5] },
  { id: "n02", at: [-6, 2.15, 6.5] },
  { id: "n03", at: [-1, 1.6, 9] },
  { id: "n04", at: [5, 1.55, 8.5] },
  { id: "n05", at: [10.5, 1.95, 4.5] },
  { id: "n06", at: [13.5, 1.5, -0.5] },
  { id: "n07", at: [8.5, 1.7, -5.5] },
  { id: "n08", at: [2.5, 2.2, -8.5] },
  { id: "n09", at: [-3.5, 1.55, -6] },
  { id: "n10", at: [-9, 1.8, -9.5] },
  { id: "n11", at: [-14, 2.05, -4.5] },
  { id: "n12", at: [-11, 1.55, 0.5] },
  { id: "n13", at: [-5, 1.85, 3.2] },
  { id: "n14", at: [1.5, 1.5, 0.8] },
  { id: "n15", at: [7, 1.8, -2.2] },
  { id: "exit", at: [14, 1.55, -7.5] },
];

const draft = {
  id: "earth-core",
  name: "Earth's Molten Core",
  world: "Earth",
  biome: "Molten core",
  graph: {
    nodes: NODES.map((node) => ({ id: node.id, position: node.at })),
    edges: NODES.slice(0, -1).map((node, i) => ({
      from: node.id,
      to: NODES[i + 1]!.id,
      bidirectional: true,
    })),
  },
  spawnId: "spawn",
  exitId: "exit",
  fillet: 1.75,
  props: [] as SceneryProp[],
};

const { path } = buildMapPath(draft);

function ring(
  kind: SceneryKind,
  count: number,
  radius: number,
  y: number,
  scale: number,
  spin: number,
): SceneryProp[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + spin;
    const r = radius + Math.sin(i * 2.2 + spin) * 1.6;
    return {
      kind,
      position: [Math.cos(a) * r, y + (i % 3) * 0.5, Math.sin(a) * r] as Vec3,
      scale: scale * (0.78 + ((i * 5) % 7) / 12),
      phase: spin + i * 0.7,
    };
  });
}

function takeClear(
  candidates: SceneryProp[],
  minPath: number,
  minSep: number,
  limit: number,
): SceneryProp[] {
  const kept: SceneryProp[] = [];
  for (const prop of candidates) {
    if (distanceToPathXZ(prop.position, path) < minPath) continue;
    const crowded = kept.some(
      (other) =>
        Math.hypot(other.position[0] - prop.position[0], other.position[2] - prop.position[2]) <
        minSep,
    );
    if (crowded) continue;
    kept.push(prop);
    if (kept.length >= limit) break;
  }
  return kept;
}

const rocks = takeClear(ring("rock", 14, 27, 6.2, 1.35, 0.4), 4.5, 4, 9);
const crystals = takeClear(ring("crystal", 12, 23.5, 2.4, 1, 0.9), 3.6, 3.2, 8);
const falls = takeClear(ring("fall", 8, 32, 6.5, 1.1, 0.2), 6, 8, 4);
const geysers = takeClear(
  Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2 + 0.15;
    const r = 4.5 + (i % 5) * 2.7;
    return {
      kind: "geyser" as const,
      position: [Math.cos(a) * r, 0, Math.sin(a) * r] as Vec3,
      scale: 0.75 + (i % 4) * 0.28,
      phase: i * 0.55,
    };
  }),
  3.8,
  4.2,
  6,
);
const isles = takeClear(
  Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2 + 0.33;
    const r = 7 + (i % 6) * 2.1;
    return {
      kind: "isle" as const,
      position: [Math.cos(a) * r, 0.12, Math.sin(a) * r] as Vec3,
      scale: 1.1 + (i % 4) * 0.45,
      phase: i,
    };
  }),
  3.8,
  3.6,
  7,
);

export const earthCoreMap: MapDefinition = {
  ...draft,
  props: [...rocks, ...crystals, ...falls, ...geysers, ...isles],
};
