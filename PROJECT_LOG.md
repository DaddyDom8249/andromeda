# PROJECT_LOG

## 2026-10-17 — Game regression coverage and CI (repair branch)

- **Repository:** `DaddyDom8249/andromeda`.
- **Baseline main HEAD inspected:** `f7935a34a9241566c823a7dbcffe686ef5e3238c`.
- **Existing instructions:** reviewed root `AGENTS.md`; no existing `PROJECT_LOG.md` was present on `main`.
- **Confirmed defect:** `npm test` named five TypeScript tests under `src/lib` and did not run the four game regression modules (`src/game/maps/earth-core.test.ts`, `src/game/paths/paths.test.ts`, `src/game/state/simulation.test.ts`, `src/game/world/sim.test.ts`). The README required a separate manual game test command.
- **Smallest fix:** use Node 22's recursive test glob for all `src/**/*.test.ts` in `npm test`. Existing script tests remain a separate first command.
- **Verification gate added:** GitHub Actions checks locked dependency install, `npm test`, TypeScript, lint, and build. CI explicitly clears `DATABASE_URL`, so build skips production DB migrations. The workflow has read-only repository permission and invokes no provider generation.
- **Local baseline:** not run. Network DNS in the temporary local executor could not resolve GitHub, so the full repository could not be cloned here.
- **Hosted CI evidence (commit `222f0797628016b78941c7eb93c1e53b6c60c5f3`):** [run 39064717125](https://github.com/DaddyDom8249/andromeda/actions/runs/39064717125) completed the portable source suite with **77 tests passed, 0 failed** (includes gameplay and library tests); `npm run typecheck`, `npm run lint`, and `npm run build` each completed successfully. A final doc-only commit will need its own revision-bound CI confirmation.
- **Full `npm test` portability:** the initial full runner failed 16 Grok-template tests on GitHub due to missing `.grok` sandbox files and platform-dependent brand assumptions. These script-level platform tests were **not** run in portable GitHub CI, which uses `npm run test:source`; they still run under `npm test` in the originating Grok environment. Do not report the full command as passing on GitHub.
- **Lint defect repaired:** `src/lib/app-data/client.server.ts` had an empty JWT-parse fallback `catch` rejected by ESLint. A documentation-only catch-body comment preserves the fallback behavior and removes the violation.
- **Twilio:** no Twilio package or application integration identified; no unrelated service was added.
- **CodeRabbit:** GitHub review connector does not expose a direct CodeRabbit review action; no automated review result is claimed.
- **Production:** no deployment, database changes, or browser verification performed.
- **Next:** inspect GitHub Actions run conclusions on the PR HEAD and repair any concrete failure before merge or deploy.

## 2026-10-17 — Earth Core gameplay continuity and rewards

- **User reproduction:** first wave stops forever; visible crystals do not react to taps/clicks; killed crawlers produce no resources.
- **Root causes on main `f7935a34`:** only wave 1 authored; `stepMatch` unconditionally marks the state `resolved` after clearing that plan; scenery crystals render without an onClick or reward; dead enemies are deleted without awarding score or loot.
- **Implemented on `fix/andromeda-gameplay-progression-loot`:** five escalating waves with 12-second inter-wave countdown, skip-wave action, explicit victory/defeat and restart; collectible map crystals and accessible HUD harvest; killed enemies spawn click-to-claim loot orbs, score and HUD collection fallback. All pickups are once-only, and the build currency remains spendable on spires.
- **Scope:** implements progression *within the Earth's Core* only. Additional planetary/galactic levels have not been built.
- **Test coverage:** new simulation regressions for progression through all waves, collectible crystals, single payout per kill/drop, and defeat; existing one-wave leakage regression updated to assert advancement to wave 2.
- **Verification:** GitHub Actions CI, Vercel build/preview, and browser interaction are tracked by their exact head and results; no successful test or deployment is claimed here until evidence is checked.
- **Production:** main and original production remain unchanged pending reviewed gameplay verification. Do not merge until checks pass.
