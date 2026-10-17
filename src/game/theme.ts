/** Shared world colors. CSS tokens in styles.css mirror these values. */
export const THEME = {
  bg: "#120806",
  surface: "#2a1812",
  fg: "#f3e6d8",
  muted: "#b9a193",
  primary: "#ff4d1a",
  accent: "#ffb020",
  hot: "#ffe1a8",
  crust: "#1a0c09",
  rock: "#5c3a2c",
  fog: "#2a120c",
} as const;

export const RULES = {
  mapId: "earth-core",
  startingLives: 20,
  countdownSeconds: 60,
  wave: 1,
} as const;
