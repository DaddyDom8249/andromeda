const GAME_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
  "KeyE",
]);

const held = new Set<string>();
let injected: Set<string> | null = null;
let joyX = 0;
let joyY = 0;
let gatherLatch = false;
let installed = false;

function radial(x: number, y: number, dead = 0.18): { x: number; y: number } {
  const mag = Math.hypot(x, y);
  if (mag < dead || mag === 0) return { x: 0, y: 0 };
  const scale = (mag - dead) / (1 - dead) / mag;
  return { x: x * scale, y: y * scale };
}

function clampStick(v: number): number {
  if (v > 1) return 1;
  if (v < -1) return -1;
  return v;
}

export function setJoystick(x: number, yDown: number): void {
  joyX = clampStick(x);
  joyY = clampStick(-yDown);
}

export function requestGather(): void {
  gatherLatch = true;
}

export function setInjectedKeys(codes: string[]): void {
  injected = new Set(codes);
}

export interface MoveAxes {
  x: number;
  y: number;
  gather: boolean;
}

export function consumeMove(): MoveAxes {
  const keys = injected ?? held;
  let x = 0;
  let y = 0;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
  if (keys.has("KeyW") || keys.has("ArrowUp")) y += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) y -= 1;
  const keyMag = Math.hypot(x, y);
  const gather = gatherLatch || keys.has("Space") || keys.has("KeyE");
  gatherLatch = false;
  if (keyMag > 0) {
    const scale = keyMag > 1 ? 1 / keyMag : 1;
    return { x: x * scale, y: y * scale, gather };
  }
  const stick = radial(joyX, joyY);
  if (stick.x !== 0 || stick.y !== 0) return { x: stick.x, y: stick.y, gather };
  const pad = readPad();
  if (pad) return { x: pad.x, y: pad.y, gather: gather || pad.gather };
  return { x: 0, y: 0, gather };
}

function readPad(): { x: number; y: number; gather: boolean } | null {
  if (typeof navigator === "undefined" || !navigator.getGamepads) return null;
  const pads = navigator.getGamepads();
  for (const pad of pads) {
    if (!pad) continue;
    const stick = radial(pad.axes[0] ?? 0, -(pad.axes[1] ?? 0));
    const gather = pad.buttons[0]?.pressed === true;
    if (stick.x !== 0 || stick.y !== 0 || gather) return { x: stick.x, y: stick.y, gather };
  }
  return null;
}

function onKeyDown(event: KeyboardEvent) {
  if (!GAME_KEYS.has(event.code)) return;
  event.preventDefault();
  held.add(event.code);
  if (event.code === "Space" || event.code === "KeyE") requestGather();
}

function onKeyUp(event: KeyboardEvent) {
  held.delete(event.code);
}

function clearHeld() {
  held.clear();
}

export function installInput(): void {
  if (installed || typeof window === "undefined") return;
  const mark = window as Window & { __andromedaInput?: boolean };
  if (mark.__andromedaInput) return;
  mark.__andromedaInput = true;
  installed = true;
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clearHeld);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearHeld();
  });
}

installInput();
