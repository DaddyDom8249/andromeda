import { playGather } from "./audio.ts";
import { consumeMove, setInjectedKeys } from "./input.ts";
import {
  DEPOSITS,
  GATHER_RADIUS,
  GOAL,
  GROUND_Y,
  MOVE_SPEED,
  PICKUP_RADIUS,
  SPAWN,
  VENTS,
  canStand,
  type DepositKind,
  type DepositSpot,
} from "./layout.ts";

export interface DepositState extends DepositSpot {
  taken: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
}

export interface ViewState {
  yaw: number;
  pitch: number;
}

export interface FlashState {
  x: number;
  z: number;
  life: number;
  kind: DepositKind;
}

export interface HudSnap {
  playing: boolean;
  total: number;
  goal: number;
  crystal: number;
  ore: number;
  ember: number;
  heat: number;
  won: boolean;
  toastId: number;
  toast: string;
  message: string;
}

interface World {
  playing: boolean;
  player: PlayerState;
  view: ViewState;
  deposits: DepositState[];
  counts: Record<DepositKind, number>;
  heat: number;
  invuln: number;
  won: boolean;
  toastId: number;
  toast: string;
  message: string;
  flash: FlashState | null;
}

const listeners = new Set<() => void>();

function fresh(): World {
  return {
    playing: false,
    player: { x: SPAWN.x, y: GROUND_Y, z: SPAWN.z, yaw: 0, speed: 0 },
    view: { yaw: 0, pitch: 0.98 },
    deposits: DEPOSITS.map((spot) => ({ ...spot, taken: false })),
    counts: { crystal: 0, ore: 0, ember: 0 },
    heat: 100,
    invuln: 0,
    won: false,
    toastId: 0,
    toast: "",
    message: "",
    flash: null,
  };
}

let world = fresh();
let hud: HudSnap = toHud(world);

function toHud(state: World): HudSnap {
  const total = state.counts.crystal + state.counts.ore + state.counts.ember;
  return {
    playing: state.playing,
    total,
    goal: GOAL,
    crystal: state.counts.crystal,
    ore: state.counts.ore,
    ember: state.counts.ember,
    heat: Math.max(0, Math.round(state.heat)),
    won: state.won,
    toastId: state.toastId,
    toast: state.toast,
    message: state.message,
  };
}

function emit(): void {
  const next = toHud(world);
  if (
    next.playing === hud.playing &&
    next.total === hud.total &&
    next.crystal === hud.crystal &&
    next.ore === hud.ore &&
    next.ember === hud.ember &&
    next.heat === hud.heat &&
    next.won === hud.won &&
    next.toastId === hud.toastId &&
    next.message === hud.message
  ) {
    return;
  }
  hud = next;
  for (const listener of listeners) listener();
}

export function subscribeWorld(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getHudSnap(): HudSnap {
  return hud;
}

export function getPlayer(): PlayerState {
  return world.player;
}

export function getView(): ViewState {
  return world.view;
}

export function getDeposits(): DepositState[] {
  return world.deposits;
}

export function getFlash(): FlashState | null {
  return world.flash;
}

export function beginPlay(): void {
  world.playing = true;
  world.message = "";
  emit();
}

export function resetWorld(): void {
  world = fresh();
  hud = toHud(world);
  for (const listener of listeners) listener();
}

export function addLook(dx: number, dy: number): void {
  world.view.yaw -= dx * 0.0055;
  world.view.pitch += dy * 0.0032;
  if (world.view.pitch < 0.38) world.view.pitch = 0.38;
  if (world.view.pitch > 1.05) world.view.pitch = 1.05;
}

export function teleport(x: number, z: number): void {
  world.player.x = x;
  world.player.z = z;
  world.player.speed = 0;
}

function wrapAngle(delta: number): number {
  return Math.atan2(Math.sin(delta), Math.cos(delta));
}

function turnToward(current: number, target: number, dt: number): number {
  const delta = wrapAngle(target - current);
  const max = 14 * dt;
  if (Math.abs(delta) <= max) return target;
  return current + Math.sign(delta) * max;
}

function slide(x: number, z: number, nx: number, nz: number): { x: number; z: number } {
  if (canStand(nx, nz)) return { x: nx, z: nz };
  if (canStand(nx, z)) return { x: nx, z };
  if (canStand(x, nz)) return { x, z: nz };
  return { x, z };
}

function nearest(radius: number): DepositState | null {
  let best: DepositState | null = null;
  let bestDist = radius;
  const { x, z } = world.player;
  for (const deposit of world.deposits) {
    if (deposit.taken) continue;
    const dist = Math.hypot(deposit.x - x, deposit.z - z);
    if (dist <= bestDist) {
      best = deposit;
      bestDist = dist;
    }
  }
  return best;
}

function take(deposit: DepositState): void {
  if (deposit.taken) return;
  deposit.taken = true;
  world.counts[deposit.kind] += 1;
  world.toastId += 1;
  const label = deposit.kind === "crystal" ? "Crystal" : deposit.kind === "ore" ? "Ore" : "Ember";
  world.toast = `${label} +1`;
  world.flash = { x: deposit.x, z: deposit.z, life: 0.38, kind: deposit.kind };
  const total = world.counts.crystal + world.counts.ore + world.counts.ember;
  if (!world.won && total >= GOAL) {
    world.won = true;
    world.message = "The crust steadies. Keep the rest if you want them.";
  }
  playGather(deposit.kind);
  emit();
}

/** Ground-plane pickup. Height of the shard must not block a gather. */
function collectAuto(): void {
  for (const deposit of world.deposits) {
    if (deposit.taken) continue;
    const dist = Math.hypot(deposit.x - world.player.x, deposit.z - world.player.z);
    if (dist <= PICKUP_RADIUS) take(deposit);
  }
}

export function tryGather(): boolean {
  const hit = nearest(GATHER_RADIUS);
  if (!hit) {
    world.message = "Nothing in reach — step closer to a glow.";
    emit();
    return false;
  }
  world.message = "";
  take(hit);
  return true;
}

export function getGuide(): { angle: number; dist: number; kind: DepositKind } | null {
  const deposit = nearest(10_000);
  if (!deposit) return null;
  const dx = deposit.x - world.player.x;
  const dz = deposit.z - world.player.z;
  const dist = Math.hypot(dx, dz);
  const yaw = world.view.yaw;
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const screenX = dx * rx + dz * rz;
  const screenY = dx * fx + dz * fz;
  return { angle: Math.atan2(screenX, screenY), dist, kind: deposit.kind };
}

function applyHeat(dt: number): void {
  if (world.invuln > 0) {
    world.invuln = Math.max(0, world.invuln - dt);
    return;
  }
  let burning = false;
  for (const vent of VENTS) {
    if (Math.hypot(vent.x - world.player.x, vent.z - world.player.z) <= vent.r) {
      burning = true;
      break;
    }
  }
  if (burning) world.heat -= 28 * dt;
  else world.heat = Math.min(100, world.heat + 8 * dt);
  if (world.heat <= 0) {
    world.heat = 100;
    world.player.x = SPAWN.x;
    world.player.z = SPAWN.z;
    world.player.speed = 0;
    world.invuln = 1.25;
    world.message = "The vent cooked the suit. Back on the pad.";
  }
}

export function stepWorld(dt: number): void {
  const step = Math.min(Math.max(dt, 0), 0.05);
  if (world.flash) {
    world.flash.life -= step;
    if (world.flash.life <= 0) world.flash = null;
  }
  if (!world.playing) return;
  const move = consumeMove();
  const yaw = world.view.yaw;
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  let wx = fx * move.y + rx * move.x;
  let wz = fz * move.y + rz * move.x;
  const mag = Math.hypot(wx, wz);
  if (mag > 1) {
    wx /= mag;
    wz /= mag;
  }
  const moving = mag > 0.08;
  if (moving) {
    const targetYaw = Math.atan2(-wx, -wz);
    world.player.yaw = turnToward(world.player.yaw, targetYaw, step);
    const travel = MOVE_SPEED * Math.min(1, mag) * step;
    const next = slide(world.player.x, world.player.z, world.player.x + wx * travel, world.player.z + wz * travel);
    world.player.x = next.x;
    world.player.z = next.z;
    world.player.speed = MOVE_SPEED * Math.min(1, mag);
  } else {
    world.player.speed = 0;
  }
  if (move.gather) {
    const hit = nearest(GATHER_RADIUS);
    if (hit) {
      world.message = "";
      take(hit);
    } else if (mag < 0.2) {
      world.message = "Nothing in reach — step closer to a glow.";
    }
  }
  collectAuto();
  applyHeat(step);
  emit();
}

export function installProbe(): void {
  if (typeof window === "undefined") return;
  window.__controlsTest = {
    getYaw: () => world.player.yaw,
    getSpeed: () => world.player.speed,
    setKeys: (codes: string[]) => setInjectedKeys(codes),
    getCollected: () => world.counts.crystal + world.counts.ore + world.counts.ember,
    teleport: (x: number, z: number) => teleport(x, z),
  };
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys: (codes: string[]) => void;
      getCollected: () => number;
      teleport: (x: number, z: number) => void;
    };
  }
}

installProbe();
