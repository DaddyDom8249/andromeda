import { distanceToPathXZ, samplePoly, type PolyPath } from "../paths/sample.ts";
import type { MatchState } from "../state/types.ts";

export const SPIRE = {
  cost: 40,
  range: 6.8,
  damage: 45,
  interval: 0.42,
  laneClearance: 2.2,
  startingCores: 120,
} as const;

export interface BuildPad {
  x: number;
  y: number;
  z: number;
}

/** Rings beside the lane. Far enough to stand, close enough to shoot. */
export function buildPads(path: PolyPath): BuildPad[] {
  const pads: BuildPad[] = [];
  for (let distance = 10; distance < path.totalLength - 8; distance += 16) {
    const sample = samplePoly(path, distance);
    const tx = sample.tangent[0];
    const tz = sample.tangent[2];
    const span = Math.hypot(tx, tz) || 1;
    const px = -tz / span;
    const pz = tx / span;
    for (const side of [-1, 1]) {
      const x = sample.position[0] + px * 3.6 * side;
      const z = sample.position[2] + pz * 3.6 * side;
      const y = sample.position[1];
      if (distanceToPathXZ([x, y, z], path) < SPIRE.laneClearance) continue;
      if (pads.some((pad) => Math.hypot(pad.x - x, pad.z - z) < 4)) continue;
      pads.push({ x, y, z });
    }
  }
  return pads;
}

/** Empty string on success. Otherwise a reason the HUD can show. */
export function placeSpire(state: MatchState, padIndex: number): string {
  const pads = buildPads(state.path);
  const pad = pads[padIndex];
  if (!pad) return "No pad there.";
  if (state.towers.some((tower) => tower.pad === padIndex)) return "A spire already stands there.";
  if (state.credits < SPIRE.cost) return `Need ${SPIRE.cost} cores.`;
  state.credits -= SPIRE.cost;
  state.towers.push({
    id: state.nextTowerId++,
    pad: padIndex,
    x: pad.x,
    y: pad.y,
    z: pad.z,
    cooldown: 0.2,
  });
  return "";
}

/** Damage crawlers inside range. A kill is not a leak. No towers is a no-op. */
export function applySpires(state: MatchState, dt: number): void {
  if (state.towers.length === 0 || state.enemies.length === 0) return;
  for (const tower of state.towers) tower.cooldown -= dt;
  for (const tower of state.towers) {
    if (tower.cooldown > 0) continue;
    let best: (typeof state.enemies)[number] | null = null;
    for (const enemy of state.enemies) {
      if (enemy.health <= 0) continue;
      const at = samplePoly(state.path, enemy.distance).position;
      const reach = Math.hypot(at[0] - tower.x, at[2] - tower.z);
      if (reach > SPIRE.range) continue;
      if (!best || enemy.distance > best.distance) best = enemy;
    }
    if (!best) continue;
    best.health -= SPIRE.damage;
    tower.cooldown = SPIRE.interval;
  }
}
