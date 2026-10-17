import { useRef, useState, useSyncExternalStore } from "react";
import { setJoystick } from "../world/input.ts";
import { unlockAudio } from "../world/audio.ts";
import { addLook, beginPlay, getHudSnap, subscribeWorld, tryGather } from "../world/sim.ts";

export function LookPad() {
  const playing = useSyncExternalStore(subscribeWorld, getHudSnap, getHudSnap).playing;
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  if (!playing) return null;
  return (
    <div
      className="absolute inset-0 z-10 touch-none"
      aria-hidden
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("[data-control]")) return;
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const current = drag.current;
        if (!current || current.id !== event.pointerId) return;
        addLook(event.clientX - current.x, event.clientY - current.y);
        current.x = event.clientX;
        current.y = event.clientY;
      }}
      onPointerUp={(event) => {
        if (drag.current?.id === event.pointerId) drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    />
  );
}

export function TouchControls() {
  const playing = useSyncExternalStore(subscribeWorld, getHudSnap, getHudSnap).playing;
  if (!playing) return <StartCard />;
  return (
    <>
      <Joystick />
      <button
        type="button"
        data-control="true"
        className="gather-btn absolute right-4 bottom-5 z-30 min-h-16 min-w-24 rounded-full border border-primary bg-primary px-5 text-base font-medium text-bg"
        onPointerDown={(event) => {
          event.stopPropagation();
          tryGather();
        }}
      >
        Gather
      </button>
    </>
  );
}

function StartCard() {
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-border bg-bg/88 p-5 backdrop-blur-md sm:p-6">
        <p className="text-xs font-medium tracking-widest text-accent uppercase">World Foundation</p>
        <h1 className="font-display mt-1 text-3xl text-fg">Andromeda</h1>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-muted">
          You are on the crust of Earth's core. Walk into a glowing deposit — the ring at your
          feet is your reach — or tap Gather when one is close. Amber vents cook an idle suit.
        </p>
        <ul className="mt-4 space-y-1 text-sm text-fg">
          <li>Move with the stick, or WASD</li>
          <li>Drag to look around</li>
          <li>Deposits collect on contact</li>
        </ul>
        <button
          type="button"
          className="mt-5 min-h-12 w-full rounded-full bg-primary px-5 text-base font-medium text-bg"
          onClick={() => {
            unlockAudio();
            beginPlay();
          }}
        >
          Start
        </button>
      </div>
    </div>
  );
}

function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);

  function point(clientX: number, clientY: number) {
    const node = base.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const mag = Math.hypot(dx, dy) || 1;
    const max = rect.width * 0.36;
    const clamped = Math.min(mag, max);
    dx = (dx / mag) * clamped;
    dy = (dy / mag) * clamped;
    setKnob({ x: dx, y: dy });
    setJoystick(dx / max, dy / max);
  }

  function release(id: number) {
    if (active.current !== id) return;
    active.current = null;
    setKnob({ x: 0, y: 0 });
    setJoystick(0, 0);
  }

  return (
    <div
      ref={base}
      data-control="true"
      role="slider"
      aria-label="Move"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={0}
      className="stick-base absolute bottom-5 left-4 z-30"
      onPointerDown={(event) => {
        active.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        point(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (active.current !== event.pointerId) return;
        point(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => release(event.pointerId)}
      onPointerCancel={(event) => release(event.pointerId)}
    >
      <span className="stick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
