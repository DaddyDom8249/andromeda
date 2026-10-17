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

/** Append later waves here. The spawner only reads this table. */
const WAVES: WaveDefinition[] = [
  {
    number: 1,
    spawns: [{ typeId: "magma-crawler", count: 5, interval: 1.2 }],
  },
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
