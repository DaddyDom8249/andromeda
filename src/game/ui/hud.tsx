import { collectAllLoot, harvestNextCrystal, restartMatch, skipCountdown } from "../runtime.ts";
import { useHud } from "../hud-store.ts";
import { listWaves } from "../spawning/waves.ts";
import { RULES } from "../theme.ts";
import { REWARD } from "../state/simulation.ts";
import { SPIRE } from "../towers/spire.ts";

export function Hud() {
  const lives = useHud((state) => state.lives);
  const wave = useHud((state) => state.wave);
  const phase = useHud((state) => state.phase);
  const result = useHud((state) => state.result);
  const countdown = useHud((state) => state.countdown);
  const credits = useHud((state) => state.credits);
  const notice = useHud((state) => state.notice);
  const leaked = useHud((state) => state.leaked);
  const alive = useHud((state) => state.alive);
  const score = useHud((state) => state.score);
  const crystalsRemaining = useHud((state) => state.crystalsRemaining);
  const dropCount = useHud((state) => state.dropIds.length);
  const seconds = Math.max(0, Math.ceil(countdown));
  const breach = RULES.countdownSeconds <= 0 ? 0 : seconds / RULES.countdownSeconds;

  return (
    <div data-testid="hud" className="pointer-events-none absolute inset-0 z-20">
      <p className="sr-only" aria-live="polite">
        Wave {wave} of {listWaves().length}. {lives} lives. {credits} cores. {score} score.
        {phase === "countdown" ? ` Breach in ${seconds} seconds.` : ""}
        {phase === "resolved" ? ` ${result}. ${leaked} leaked.` : ""}
      </p>
      <header className="flex items-start justify-between gap-3 p-3 sm:p-4">
        <div>
          <p className="text-xs font-medium tracking-widest text-accent uppercase">Tower defense</p>
          <h1 className="font-display text-xl leading-tight text-fg">Andromeda</h1>
          <p className="text-sm text-muted">Wave {wave} / {listWaves().length}</p>
          <p data-testid="score" className="text-xs font-semibold text-accent">Score {score}</p>
        </div>
        <div className="flex gap-2">
          <Stat label="Lives" value={lives} testId="lives" />
          <Stat label="Cores" value={credits} testId="cores" />
        </div>
      </header>
      {phase === "countdown" ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div
            className="breach-dial breach-panel"
            style={{ ["--breach" as string]: String(breach) }}
            data-testid="countdown"
          >
            <span className="font-display text-3xl text-fg tabular-nums">{seconds}</span>
          </div>
          <button
            type="button"
            data-testid="start-wave"
            onClick={skipCountdown}
            className="pointer-events-auto min-h-11 rounded-full border border-accent bg-surface/95 px-5 text-sm font-semibold text-fg"
          >
            Start wave {wave} now
          </button>
        </div>
      ) : null}
      {phase === "resolved" ? (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/75 p-6 backdrop-blur-sm">
          <section role="dialog" aria-label="Game result" className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-xl">
            <h2 className="font-display text-2xl text-fg">{result === "victory" ? "Earth Core Secured" : "Core Breached"}</h2>
            <p className="mt-3 text-sm text-muted">
              {result === "victory" ? "All five waves cleared." : "All lives lost."}
              {" "}Score {score}. {leaked} crawlers escaped.
            </p>
            <button
              type="button"
              data-testid="restart"
              onClick={restartMatch}
              className="mt-5 min-h-12 w-full rounded-full bg-primary px-5 font-semibold text-bg"
            >
              Restart stage
            </button>
          </section>
        </div>
      ) : null}
      <footer className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-sm text-fg">
          {phase === "countdown"
            ? `Tap a gold ring to build (${SPIRE.cost} cores). Collect crystals for more.`
            : phase === "active"
              ? `${alive} crawlers on the lane. Kills drop glowing core loot.`
              : ""}
        </p>
        {phase !== "resolved" ? (
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              data-testid="harvest-crystal"
              disabled={crystalsRemaining === 0}
              onClick={harvestNextCrystal}
              className="min-h-11 rounded-full border border-accent bg-surface/95 px-3 text-xs font-semibold text-fg disabled:opacity-40"
            >
              Crystal +{REWARD.crystalCores} ({crystalsRemaining} left)
            </button>
            <button
              type="button"
              data-testid="collect-loot"
              disabled={dropCount === 0}
              onClick={collectAllLoot}
              className="min-h-11 rounded-full border border-accent bg-surface/95 px-3 text-xs font-semibold text-fg disabled:opacity-40"
            >
              Collect loot ({dropCount})
            </button>
          </div>
        ) : null}
        {notice && phase !== "resolved" ? (
          <p role="status" className="text-xs text-accent">{notice}</p>
        ) : null}
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
