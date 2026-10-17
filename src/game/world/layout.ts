export type DepositKind = "crystal" | "ore" | "ember";

export interface Island {
  x: number;
  z: number;
  r: number;
}

export interface Bridge {
  x: number;
  z: number;
  hx: number;
  hz: number;
}

export interface Disc {
  x: number;
  z: number;
  r: number;
}

export interface DepositSpot {
  id: number;
  kind: DepositKind;
  x: number;
  z: number;
}

export const PLAYER_RADIUS = 0.42;
export const PICKUP_RADIUS = 1.85;
export const GATHER_RADIUS = 3.55;
export const MOVE_SPEED = 6.4;
export const GROUND_Y = 0.5;
export const GOAL = 10;

export const SPAWN = { x: 0, z: 8.2 };

export const ISLANDS: Island[] = [
  { x: 0, z: 0, r: 12 },
  { x: 0, z: -20, r: 5.5 },
  { x: 18, z: 2, r: 5 },
  { x: -16, z: 5, r: 4.8 },
];

export const BRIDGES: Bridge[] = [
  { x: 0, z: -16, hx: 2.15, hz: 5.5 },
  { x: 14.2, z: 2, hx: 5.2, hz: 2.05 },
];

export const ROCKS: Disc[] = [
  { x: 6.2, z: -4.2, r: 1.25 },
  { x: -7.1, z: -2.6, r: 1.45 },
  { x: 4.4, z: 4.6, r: 1.15 },
  { x: -5.4, z: 2.4, r: 1.1 },
  { x: 2.4, z: -8.6, r: 1.15 },
  { x: 0.4, z: -20.2, r: 1.05 },
  { x: 18.4, z: 3.6, r: 1.05 },
  { x: -16.2, z: 6.4, r: 1.0 },
];

export const VENTS: Disc[] = [
  { x: 8.4, z: -7.6, r: 1.35 },
  { x: -8.6, z: 6.6, r: 1.3 },
  { x: 0.2, z: -23.2, r: 1.15 },
  { x: 16.2, z: -0.4, r: 1.15 },
];

export const DEPOSITS: DepositSpot[] = [
  { id: 1, kind: "crystal", x: -6.2, z: 6.0 },
  { id: 2, kind: "crystal", x: 7.1, z: 1.1 },
  { id: 3, kind: "crystal", x: -2.2, z: -6.4 },
  { id: 4, kind: "crystal", x: 3.4, z: -10.2 },
  { id: 5, kind: "crystal", x: -2.4, z: -18.2 },
  { id: 6, kind: "ore", x: 8.8, z: -4.6 },
  { id: 7, kind: "ore", x: -8.8, z: -0.6 },
  { id: 8, kind: "ore", x: 17.6, z: -0.8 },
  { id: 9, kind: "ore", x: -3.6, z: -9.2 },
  { id: 10, kind: "ember", x: -15.6, z: 3.3 },
  { id: 11, kind: "ember", x: 6.4, z: 7.2 },
  { id: 12, kind: "ember", x: -1.6, z: -16.8 },
  { id: 13, kind: "ember", x: 15.2, z: 4.2 },
  { id: 14, kind: "crystal", x: 4.6, z: -2.2 },
];

export function onCrust(x: number, z: number): boolean {
  for (const isle of ISLANDS) {
    const dx = x - isle.x;
    const dz = z - isle.z;
    if (dx * dx + dz * dz <= isle.r * isle.r) return true;
  }
  for (const bridge of BRIDGES) {
    if (Math.abs(x - bridge.x) <= bridge.hx && Math.abs(z - bridge.z) <= bridge.hz) return true;
  }
  return false;
}

export function blockedByRock(x: number, z: number): boolean {
  for (const rock of ROCKS) {
    const dx = x - rock.x;
    const dz = z - rock.z;
    const reach = rock.r + PLAYER_RADIUS;
    if (dx * dx + dz * dz < reach * reach) return true;
  }
  return false;
}

export function canStand(x: number, z: number): boolean {
  return onCrust(x, z) && !blockedByRock(x, z);
}
