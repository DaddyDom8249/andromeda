# Andromeda Project Log

## 2026-10-17 — Earth Core wave progression

- Baseline: `main` at `f7935a34a9241566c823a7dbcffe686ef5e3238c`. Source inspection confirms a single wave, terminal `resolved` phase, and no restart. `AGENTS.md` read. No prior `PROJECT_LOG.md` was present.
- Branch: `fix/earth-core-five-wave-progression-20261017`. `main` not modified.
- Implemented: five escalating magma crawler waves (5/7/9/12/15 enemies); original 60-second preparation; 15 seconds between later waves; terminal victory after wave 5 and defeat at zero lives; restart via UI and runtime; preserve lives/towers/cores across waves and clear them on restart.
- Regression coverage: wave definitions, countdowns, progression, preservation, defeat, victory, terminal lockout, restart reset; game tests now included in `npm test`.
- Verification: source edits and commits recorded. Full dependency install, local build, live browser, and production behavior **not yet verified** in this environment because direct GitHub clone/network access is unavailable. GitHub Actions CI workflow was added to run `npm ci`, typecheck, `npm test`, and production build on pull requests.
- Follow-up: review GitHub CI results and browser behavior before merging/deploying. Next bounded subsystem after stable waves: connect world resource collection to the active battlefield, then add kill rewards.
