# Andromeda

World Foundation. A 3D tower defense on the crust of Earth's molten core. Magma crawlers follow one lane from the spawn portal to the exit. Ember Spires shoot them before they leak.

## Play

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). The 60-second countdown starts immediately.

## Controls

| Action | Phone | Desktop |
| --- | --- | --- |
| Look | Drag | Drag |
| Zoom | Pinch | Scroll |
| Pan | Two-finger drag | Right-drag |
| Build | Tap a gold ring | Click a gold ring |

You start with 20 lives, wave 1, and 120 cores. An Ember Spire costs 40 cores. It fires at the crawler furthest along the lane while that crawler is in range. A kill does not cost a life. A crawler that reaches the exit costs exactly one life.

Five magma crawlers spawn after the countdown. Place spires during the countdown if you want them ready.

## Checks

```bash
npm run typecheck
npm test
node --experimental-strip-types --test src/game/world/sim.test.ts src/game/maps/earth-core.test.ts src/game/paths/paths.test.ts src/game/state/simulation.test.ts
```

## Build

```bash
npm run build
npm run preview
```
