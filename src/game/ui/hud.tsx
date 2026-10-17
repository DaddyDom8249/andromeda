import { useHud } from "../hud-store.ts";
import { RULES } from "../theme.ts";
import { SPIRE } from "../towers/spire.ts";

export function Hud() {
  const lives = useHud((state) => state.lives);
  const wave = useHud((state) => state.wave);
  const phase = useHud((state) => state.phase);
  const countdown = useHud((state) => state.countdown);
  const credits = useHud((state) => state.credits);
  const notice = useHud((state) => state.notice);
  const leaked = useHud((state) => state.leaked);
  const alive = useHud((state) => state.alive);
  const seconds = Math.max(0, Math.ceil(countdown));
  const breach = RULES.countdownSeconds <= 0 ? 0 : seconds / RULES.countdownSeconds;

  return (
    <div data-testid="hud" className="pointer-events-none absolute inset-0 z-20">
      <p className="sr-only" aria-live="polite">
        Wave {wave}. {lives} lives. {credits} cores.
        {phase === "countdown" ? ` Breach in ${seconds} seconds.` : ""}
        {phase === "resolved" ? ` Wave resolved. ${leaked} leaked.` : ""}
      </p>
      <header className="flex items-start justify-between gap-3 p-3 sm:p-4">
        <div>
          <p className="text-xs font-medium tracking-widest text-accent uppercase">Tower defense</p>
          <h1 className="font-display text-xl leading-tight text-fg">Andromeda</h1>
          <p className="text-sm text-muted">Wave {wave}</p>
        </div>
        <div className="flex gap-2">
          <Stat label="Lives" value={lives} testId="lives" />
          <Stat label="Cores" value={credits} testId="cores" />
        </div>
      </header>
      {phase === "countdown" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="breach-dial breach-panel"
            style={{ ["--breach" as string]: String(breach) }}
            data-testid="countdown"
          >
            <span className="font-display text-3xl text-fg tabular-nums">{seconds}</span>
          </div>
        </div>
      ) : null}
      <footer className="absolute inset-x-0 bottom-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-sm text-fg">
          {phase === "countdown"
            ? `Tap a gold ring to raise an Ember Spire (${SPIRE.cost} cores). Drag to look around.`
            : phase === "active"
              ? `${alive} crawler${alive === 1 ? "" : "s"} on the lane.`
              : leaked > 0
                ? `${leaked} reached the exit. ${lives} lives left.`
                : "The lane is clear."}
        </p>
        {notice ? <p className="mt-1 text-sm text-accent">{notice}</p> : null}
      </footer>
    </div>
  );
}

function Stat({ label, value, testId }: { label: string; value: number; testId: string }) {
  return (
    <div className="min-w-16 rounded-2xl border border-border bg-surface/90 px-3 py-2 text-right">
      <div className="text-xs tracking-widest text-muted uppercase">{label}</div>
      <div data-testid={testId} className="font-display text-2xl leading-none text-fg tabular-nums">
        {value}
      </div>
    </div>
  );
}
