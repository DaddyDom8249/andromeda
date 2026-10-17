import { magmaCrawler } from "./magma-crawler.ts";
import type { EnemyDefinition } from "./types.ts";

/** Append enemy modules here. Spawners look types up by id. */
const ENEMIES: EnemyDefinition[] = [magmaCrawler];

export function listEnemyTypes(): readonly EnemyDefinition[] {
  return ENEMIES;
}

export function getEnemyType(id: string): EnemyDefinition {
  const found = ENEMIES.find((enemy) => enemy.id === id);
  if (!found) throw new Error(`Unknown enemy type: ${id}`);
  return found;
}
