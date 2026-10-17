import { create } from "zustand";
import { planForWave } from "./spawning/waves.ts";
import { RULES } from "./theme.ts";
import type { MatchPhase } from "./state/types.ts";

export interface HudState {
  lives: number;
  wave: number;
  phase: MatchPhase;
  countdown: number;
  spawned: number;
  spawnTotal: number;
  alive: number;
  leaked: number;
  roster: number[];
}

export const useHud = create<HudState>(() => ({
  lives: RULES.startingLives,
  wave: RULES.wave,
  phase: "countdown",
  countdown: RULES.countdownSeconds,
  spawned: 0,
  spawnTotal: planForWave(RULES.wave).length,
  alive: 0,
  leaked: 0,
  roster: [],
}));
