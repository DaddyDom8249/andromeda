import { create } from "zustand";
import { getMap } from "./maps/registry.ts";
import { planForWave } from "./spawning/waves.ts";
import { RULES } from "./theme.ts";
import { SPIRE } from "./towers/spire.ts";
import type { MatchPhase, MatchResult } from "./state/types.ts";

export interface HudState {
  lives: number;
  wave: number;
  phase: MatchPhase;
  result: MatchResult;
  countdown: number;
  spawned: number;
  spawnTotal: number;
  alive: number;
  leaked: number;
  kills: number;
  score: number;
  roster: number[];
  credits: number;
  built: number[];
  crystalIds: number[];
  crystalsRemaining: number;
  dropIds: number[];
  notice: string;
}

export const useHud = create<HudState>(() => ({
  lives: RULES.startingLives,
  wave: RULES.wave,
  phase: "countdown",
  result: null,
  countdown: RULES.countdownSeconds,
  spawned: 0,
  spawnTotal: planForWave(RULES.wave).length,
  alive: 0,
  leaked: 0,
  kills: 0,
  score: 0,
  roster: [],
  credits: SPIRE.startingCores,
  built: [],
  crystalIds: [],
  crystalsRemaining: getMap(RULES.mapId).props.filter((prop) => prop.kind === "crystal").length,
  dropIds: [],
  notice: "",
}));
