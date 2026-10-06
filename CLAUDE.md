# cli-pomodoro-timer

A single-purpose CLI Pomodoro timer. Running `pomodoro` walks the classic 25 min work / 5 min
short break / 15 min long break (every 4th round) cycle, alerting with a terminal bell + printed
message at each transition, and exits immediately and cleanly on Ctrl+C by default. No task
binding, no background/daemon mode, no OS notifications, no Do-Not-Disturb integration (the
last of these is a **permanent** exclusion, not deferred) — see `docs/idea-brief.md` §5 for the
full v1 list and why each was dropped. **Session history (opt-in), configurable durations, and
pause/resume were reopened for v2** per `docs/roadmap.md` §Decisions so far — see that file's
steps 4-6 and the per-feature specs under `docs/features/` — and are in scope, additive, and
opt-in: bare `pomodoro` with no opt-in stays byte-for-byte identical to the v1 behavior above.

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
- `src/history/` — opt-in, append-only session-history writer (v2, `docs/roadmap.md` step 6; see
  `docs/features/session-history/adr/0001-*.md`). `paths.ts` resolves the OS-conventional per-user
  data directory; `record.ts` gates on `POMODORO_HISTORY=1` and appends one JSON line per
  naturally-completed phase. Called only from `io` (never from `cli` or `core`) — same
  direct-function-call pattern as `io` calling into `core`.

`cli` is the only entry point and composes `core` + `io` directly — no DI container, the project
is too small to need one. Inter-module communication is direct function calls, in-process; no
event bus, no network calls.

## Conventions

- **Error handling:** uncaught errors print to `stderr` and exit non-zero. `SIGINT` (Ctrl+C) exits
  immediately with code `0` — no confirm, no pause, no saved state.
- **Persistence:** none by default. The only exception is the opt-in, append-only session-history
  writer in `src/history/` (v2) — off unless `POMODORO_HISTORY=1` is set, and even then it's a flat
  file, never a datastore: no query engine, no schema, no migrations directory.
- **Tests:** Vitest. `core`'s state machine is unit-tested with a fake clock (no real waits). `io`
  gets a thin smoke test only, since it's mostly timers/process I/O. `history` gets full unit +
  real-filesystem integration tests (its one external boundary).
- **New CLI behavior** (e.g. a future flag) → `src/cli.ts`.
- **Cycle/state-machine logic** → `src/core/`.
- **Real-time/I-O behavior** (timers, printing, signals) → `src/io/`.
- **History/persistence logic** → `src/history/`.

Full rationale and target C4 diagram: `docs/architecture-map.md`. Product intent and explicit
out-of-scope list: `docs/idea-brief.md`. Decisions: `docs/adr/`.
