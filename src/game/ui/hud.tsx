import { useHud } from "../hud-store.ts";
import { restartMatch } from "../runtime.ts";
import { FINAL_EARTH_CORE_WAVE } from "../spawning/waves.ts";
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
  const duration = wave === 1 ? RULES.countdownSeconds : 15;
  const breach = duration <= 0 ? 0 : seconds / duration;

  return (
    <div data-testid="hud" className="pointer-events-none absolute inset-0 z-20">
      <p className="sr-only" aria-live="polite">
        Wave {wave}. {lives} lives. {credits} cores.
        {phase === "countdown" ? ` Breach in ${seconds} seconds.` : ""}
        {phase === "victory" ? " Earth Core victory." : ""}
        {phase === "defeat" ? " Game over." : ""}
      </p>
      <header className="flex items-start justify-between gap-3 p-3 sm:p-4">
        <div>
          <p className="text-xs font-medium tracking-widest text-accent uppercase">Tower defense</p>
          <h1 className="font-display text-xl leading-tight text-fg">Andromeda</h1>
          <p className="text-sm text-muted">Wave {wave} / {FINAL_EARTH_CORE_WAVE}</p>
        </div>
        <div className="flex gap-2">
          <Stat label="Lives" value={lives} testId="lives" />
          <Stat label="Cores" value={credits} testId="cores" />
        </div>
      </header>
      {phase === "countdown" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div
              className="breach-dial breach-panel"
              style={{ ["--breach" as string]: String(breach) }}
              data-testid="countdown"
            >
              <span className="font-display text-3xl text-fg tabular-nums">{seconds}</span>
            </div>
            <p className="rounded-full bg-surface/90 px-4 py-2 text-sm text-fg">
              Wave {wave} starts in {seconds}s
            </p>
          </div>
        </div>
      ) : null}
      {phase === "victory" || phase === "defeat" ? (
        <div
          className="pointer-events-auto absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-bg/90 px-6 text-center"
          data-testid="match-result"
          role="dialog"
          aria-label={phase === "victory" ? "Earth Core victory" : "Game over"}
        >
          <p className="text-xs font-medium tracking-[0.3em] text-accent uppercase">
            Earth Core
          </p>
          <h2 className="font-display text-4xl text-fg">
            {phase === "victory" ? "Core Defended" : "Game Over"}
          </h2>
          <p className="max-w-sm text-base text-muted">
            {phase === "victory"
              ? `All ${FINAL_EARTH_CORE_WAVE} waves survived with ${lives} lives remaining.`
              : `The crawlers breached your defenses during wave ${wave}.`}
          </p>
          <button
            type="button"
            onClick={restartMatch}
            className="pointer-events-auto min-h-12 min-w-44 rounded-full bg-accent px-7 py-3 text-base font-bold text-bg shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            data-testid="restart"
          >
            Restart game
          </button>
        </div>
      ) : null}
      <footer className="absolute inset-x-0 bottom-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-sm text-fg">
          {phase === "countdown"
            ? `Tap a gold ring to raise an Ember Spire (${SPIRE.cost} cores). Drag to look around.`
            : phase === "active"
              ? `${alive} crawler${alive === 1 ? "" : "s"} on the lane.`
              : phase === "victory"
                ? "Earth Core cleared. The next environment unlocks in a future system."
                : "Your defenses fell. Restart to try again."}
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
