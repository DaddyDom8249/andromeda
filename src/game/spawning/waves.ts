export interface WaveGroup {
  typeId: string;
  count: number;
  /** Seconds between each spawn in the group. */
  interval: number;
}

export interface WaveDefinition {
  number: number;
  spawns: WaveGroup[];
}

export interface SpawnStep {
  typeId: string;
  interval: number;
}

/** Five waves complete the Earth Core stage. Later stages get their own wave tables. */
export const FINAL_EARTH_CORE_WAVE = 5;

const WAVES: WaveDefinition[] = [
  { number: 1, spawns: [{ typeId: "magma-crawler", count: 5, interval: 1.2 }] },
  { number: 2, spawns: [{ typeId: "magma-crawler", count: 7, interval: 1.1 }] },
  { number: 3, spawns: [{ typeId: "magma-crawler", count: 9, interval: 1.0 }] },
  { number: 4, spawns: [{ typeId: "magma-crawler", count: 12, interval: 0.9 }] },
  { number: 5, spawns: [{ typeId: "magma-crawler", count: 15, interval: 0.8 }] },
];

export function listWaves(): readonly WaveDefinition[] {
  return WAVES;
}

export function getWave(number: number): WaveDefinition {
  const wave = WAVES.find((entry) => entry.number === number);
  if (!wave) throw new Error(`Unknown wave: ${number}`);
  return wave;
}

export function planForWave(number: number): SpawnStep[] {
  const plan: SpawnStep[] = [];
  for (const group of getWave(number).spawns) {
    for (let i = 0; i < group.count; i++) {
      plan.push({ typeId: group.typeId, interval: group.interval });
    }
  }
  return plan;
}
