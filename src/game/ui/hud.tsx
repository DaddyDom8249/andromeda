import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { getGuide, getHudSnap, resetWorld, subscribeWorld } from "../world/sim.ts";

export function Hud() {
  const snap = useSyncExternalStore(subscribeWorld, getHudSnap, getHudSnap);
  if (!snap.playing) return null;
  return (
    <div data-testid="hud" className="pointer-events-none absolute inset-0 z-20">
      <p className="sr-only" aria-live="polite">
        {snap.total} of {snap.goal} deposits gathered. Suit {snap.heat}.
        {snap.won ? " Core steady." : ""}
      </p>
      {snap.heat < 40 ? <div className="heat-warning absolute inset-0" /> : null}
      <header className="relative flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-widest text-accent uppercase">Molten reach</p>
          <h1 className="font-display text-xl leading-tight text-fg">Andromeda</h1>
          <Compass />
          <div className="mt-2 flex flex-col items-start gap-2">
            <Suit heat={snap.heat} />
            <KindRow crystal={snap.crystal} ore={snap.ore} ember={snap.ember} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="min-w-16 rounded-2xl border border-border bg-surface/90 px-3 py-2 text-right">
            <div className="text-xs tracking-widest text-muted uppercase">Gathered</div>
            <div data-testid="gathered" className="font-display text-2xl leading-none text-fg tabular-nums">
              {snap.total}
              <span className="text-base text-muted">/{snap.goal}</span>
            </div>
          </div>
          <button
            type="button"
            data-control="true"
            className="pointer-events-auto min-h-11 rounded-full border border-border bg-surface/90 px-4 text-sm text-fg"
            onClick={() => resetWorld()}
          >
            Retry
          </button>
        </div>
      </header>
      <div className="relative flex flex-col items-center gap-2 px-4">
        {snap.toast ? (
          <p key={snap.toastId} className="pickup-toast rounded-full bg-surface/90 px-4 py-2 text-sm text-fg">
            {snap.toast}
          </p>
        ) : null}
        {snap.message ? (
          <p className="max-w-xs rounded-2xl border border-border bg-bg/85 px-3 py-2 text-center text-sm text-fg">
            {snap.message}
          </p>
        ) : null}
        {snap.won ? (
          <p className="rounded-full border border-accent bg-bg/85 px-4 py-2 text-sm text-accent">Core steady</p>
        ) : null}
      </div>
    </div>
  );
}

function Suit({ heat }: { heat: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-bg/80 px-3 py-1.5">
      <span className="text-xs tracking-widest text-muted uppercase">Suit</span>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
        <div className="h-full bg-primary" style={{ width: `${heat}%` }} />
      </div>
      <span className="text-xs text-fg tabular-nums">{heat}</span>
    </div>
  );
}

function KindRow({ crystal, ore, ember }: { crystal: number; ore: number; ember: number }) {
  return (
    <p className="flex gap-3 text-xs text-muted">
      <span>Crystal {crystal}</span>
      <span>Ore {ore}</span>
      <span>Ember {ember}</span>
    </p>
  );
}

function Compass() {
  const arrow = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const guide = getGuide();
      if (arrow.current) {
        arrow.current.style.transform = guide ? `rotate(${guide.angle}rad)` : "none";
      }
      if (label.current) {
        if (!guide) label.current.textContent = "Crust clear";
        else {
          const name = guide.kind === "crystal" ? "Crystal" : guide.kind === "ore" ? "Ore" : "Ember";
          label.current.textContent = `${name} · ${Math.max(1, Math.round(guide.dist))}m`;
        }
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <p className="mt-1 flex items-center gap-1 text-sm text-fg">
      <span ref={arrow} className="inline-flex">
        <ArrowUp className="size-4 text-accent" aria-hidden />
      </span>
      <span ref={label}>Seek a glow</span>
    </p>
  );
}
