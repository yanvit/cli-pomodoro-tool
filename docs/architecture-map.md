---
status: current
mode: greenfield-bootstrap
updated_at: "2026-09-30"
reflects_commit: "2730b76"
language: "typescript (node.js, node >=18 lts)"
build_cmd: "npm run build"
test_cmd: "npm test"
lint_cmd: "npm run lint"
migration_tool: ""
frontend: ""
---

# Architecture map — cli-pomodoro-timer

> The **target foundation** for this project (nothing is built yet), fixed with the owner during
> `survey`'s greenfield pass and read by `specify` / `design` / `tasks` / `implement` /
> `scaffold`. Refresh with `survey` once real code lands and drifts past `reflects_commit`.

## Stack

- Language / runtime: TypeScript on Node.js (>=18 LTS) — chosen for ease of sharing informally
  with other developers (`npx`/`node` run it directly, no separate install step to distribute a
  binary).
- Frameworks: none — no HTTP framework, no database. This is a single-purpose CLI with a fixed
  cycle; `argv` handling is limited to `--help`/`--version` (durations are fixed per the idea
  brief, so there is nothing else to parse).
- Build / test / lint: `npm run build` (tsc) / `npm test` (Vitest) / `npm run lint` (eslint).

## C4 — target baseline

```mermaid
C4Container
    title Target containers — cli-pomodoro-timer
    Person(dev, "Developer", "Runs the timer in a terminal to stay focused during work")
    Container(cli, "cli", "TypeScript (Node.js)", "Parses argv (--help/--version), starts the run")
    Container(core, "core", "TypeScript", "Pure cycle state machine: work -> short break -> ... -> long break, driven by an injectable clock")
    Container(io, "io", "TypeScript (Node.js)", "Real countdown loop, terminal bell, printed alerts, Ctrl+C exit handling")
    Rel(dev, cli, "invokes the command in a terminal")
    Rel(cli, core, "starts a cycle")
    Rel(core, io, "emits transition events (work-start, break-start, cycle-complete)")
    Rel(io, dev, "countdown output, bell + message at each transition")
```

## Module inventory

| Module | Path | Layers | Wired at | Responsibility |
|---|---|---|---|---|
| cli | `src/cli.ts` | entry point | `src/cli.ts` (to be created) | Parses `--help`/`--version`, invokes `core` with the fixed 25/5/15 cycle config |
| core | `src/core/` | domain (pure) | `src/core/cycle.ts` (to be created) | The work/short-break/long-break state machine; no timers, no I/O — takes a clock, returns transitions, fully unit-testable |
| io | `src/io/` | infra | `src/io/timer.ts` (to be created) | Drives `core` in real time (`setInterval`), prints the countdown, fires the terminal bell (`\a`) + message on each transition, handles `SIGINT` for a clean immediate exit |

## Conventions (cited — the rules a new feature must match)

<!-- N/A: no existing code yet — these are the rules being FIXED for the scaffold and every
feature after it, per G4/G5 of the greenfield foundation session. Nothing to cite until scaffold
materializes the skeleton; re-survey after that to add real file:line citations. -->

- **Module wiring / registration:** `cli` is the only entry point; it composes `core` + `io` directly (no DI container — the project is too small to need one).
- **Error handling:** uncaught errors print to `stderr` and exit non-zero; `SIGINT` (Ctrl+C) exits immediately with code `0` (per the idea brief — no confirm, no pause), following standard Node process conventions.
- **IDs:** not applicable — the tool has no persisted entities.
- **Persistence / DB access:** none — deliberately out of scope (no history, no config file, per `docs/idea-brief.md` §5).
- **Migrations:** not applicable — no datastore.
- **Tests:** Vitest; `core`'s state machine is unit-tested with a fake clock (no real 25-minute waits); `io` gets a thin smoke test only, since it's mostly timers/process I/O.
- **Inter-module communication:** direct function calls / callbacks in-process — no events bus, no network calls (single local process).

## Datastores

| Store | Engine | Accessed via | Notes |
|---|---|---|---|
| — | — | — | None. No persistence layer by design (see `docs/idea-brief.md` §5 Out of scope). |

## Frontend / UI foundation

<!-- N/A: no frontend — this is a terminal-only CLI, not a web/mobile/desktop app. -->

## Where things live / closest precedents

- A new CLI behavior (e.g. a future flag) → `src/cli.ts`, following the argv-parsing shape set up in scaffold task S1.
- Cycle/state-machine logic → `src/core/cycle.ts`, modeled on the same pure-function, fake-clock-testable style.
- Real-time/I-O behavior (timers, printing, signals) → `src/io/timer.ts`.

## Constraints & known tech-debt

- No code exists yet — this map is the **target** the `scaffold` skill will materialize, not a description of a current repo.
- The foundation deliberately excludes persistence, config files, and background/daemon mode (per `docs/idea-brief.md` §5) — a future feature that needs any of these requires revisiting ADR 0001/0002 or adding a new ADR, not silently bolting it on.

## Reconciliation with the authored architecture doc

No authored architecture doc exists (no `docs/architecture.md`, no root `CLAUDE.md` yet — `scaffold` will write the conventions doc from this map). This map is the current reference.
