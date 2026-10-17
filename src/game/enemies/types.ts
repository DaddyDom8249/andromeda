export interface EnemyDefinition {
  id: string;
  name: string;
  maxHealth: number;
  /** World units per second along the designated path. */
  speed: number;
  radius: number;
}
