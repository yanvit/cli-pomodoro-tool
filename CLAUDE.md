# cli-pomodoro-timer

A single-purpose CLI Pomodoro timer. Running `pomodoro` walks the classic 25 min work / 5 min
short break / 15 min long break (every 4th round) cycle, alerting with a terminal bell + printed
message at each transition, and exits immediately and cleanly on Ctrl+C. No history, no task
binding, no configurable durations, no background/daemon mode, no OS notifications, no
pause/resume, no Do-Not-Disturb integration — see `docs/idea-brief.md` §5 for the full list and
why each was dropped.

## Stack

- TypeScript on Node.js (>=18 LTS), no framework, no database.
- Build: `npm run build` (tsc). Test: `npm test` (Vitest). Lint: `npm run lint` (eslint).

## Module structure

- `src/cli.ts` — entry point. Parses `--help`/`--version`; invokes `core` with the fixed 25/5/15
  cycle config. The only module that touches `process.argv`.
- `src/core/` — pure domain state machine (work → short break → ... → long break). No timers, no
  I/O. Takes an injectable clock, returns transitions. Fully unit-testable without real waits.
- `src/io/` — real-time driver. Runs `core` against `setInterval`, prints the countdown, fires the
  terminal bell (`\a`) + message on each transition, handles `SIGINT` for immediate clean exit.

`cli` is the only entry point and composes `core` + `io` directly — no DI container, the project
is too small to need one. Inter-module communication is direct function calls, in-process; no
event bus, no network calls.

## Conventions

- **Error handling:** uncaught errors print to `stderr` and exit non-zero. `SIGINT` (Ctrl+C) exits
  immediately with code `0` — no confirm, no pause, no saved state.
- **Persistence:** none, deliberately. No datastore, no config file, no migrations directory.
- **Tests:** Vitest. `core`'s state machine is unit-tested with a fake clock (no real waits). `io`
  gets a thin smoke test only, since it's mostly timers/process I/O.
- **New CLI behavior** (e.g. a future flag) → `src/cli.ts`.
- **Cycle/state-machine logic** → `src/core/`.
- **Real-time/I-O behavior** (timers, printing, signals) → `src/io/`.

Full rationale and target C4 diagram: `docs/architecture-map.md`. Product intent and explicit
out-of-scope list: `docs/idea-brief.md`. Decisions: `docs/adr/`.
