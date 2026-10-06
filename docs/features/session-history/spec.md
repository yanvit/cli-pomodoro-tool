---
status: Draft
owner: "Vitalii"
reviewers: ["Vitalii"]
updated_at: "2026-10-06"
feature_size: "S"
---

# Spec — session-history

> **Glossary:** [CONTEXT](../../../CONTEXT.md)
> **Reference module / docs / channels used:** None — only the interview + CONTEXT + `docs/architecture-map.md` + `docs/roadmap.md`.

## 1. Context

`pomodoro` runs its 25/5/15 work/break cycle entirely in memory — the moment the process exits, every trace of the session is gone. A developer (CONTEXT glossary) who wants to know how many pomodoros they actually finished today, or over the past week, has no way to find out short of manually tallying as they go; the tool itself keeps nothing.

Session history is one of three v1 exclusions the owner deliberately reopened for v2 via a grilling session (`docs/roadmap.md` §Decisions so far) — pause/resume (step 4) is spec'd, not yet shipped (no implementation exists in `src/` yet); this is the last of the three (the roadmap's execution path orders it after step 5, durations, in wave 4). AC-01 below is written against `core`'s single "phase completed naturally" signal, not against pause/resume's internals, so this feature needs no rework once pause/resume actually ships — whatever triggers that signal (an immediate countdown-to-zero today, or a resume-triggered deferred flush later) is already covered.

The committed approach: when a developer opts in via an environment variable, `pomodoro` appends one record to a log file in the platform's conventional per-user data location every time a work or break phase's countdown reaches zero naturally. Nothing else changes — bare `pomodoro` (no opt-in) is byte-for-byte identical to the tool without this feature. The storage format and the exact OS-specific paths are settled by the roadmap's own grilling session (`docs/roadmap.md` §Decisions so far — "append-only... rather than a bare dotfile", with the Linux/macOS/Windows paths named — Windows's own per-user data folder, `%LOCALAPPDATA%\pomodoro-timer\`, is this spec's addition, kept in sync with the roadmap) — this spec does not re-decide them, only the behavior around them.

**Decision narrowing (resolved with the owner, during this spec's interview):** the idea-capture step's framing considered recording whether a phase was "interrupted" as well as completed. This spec narrows that to completed-only: a phase that doesn't run to natural completion — Ctrl+C, a terminate/hang-up signal, or a hard kill — produces no record at all, for any reason. The deciding factor: some of those exit paths (a hard kill, a torn-down process group) can't run any code at all, so no mechanism could ever promise to capture them; treating every non-completion uniformly (never attempt to record it) is a simpler, more honest contract than partial coverage with an inconsistent edge no developer could predict.

**Traceability note:** `docs/architecture-map.md` §Constraints is explicit that this project's foundation "deliberately excludes persistence... a future feature that needs any of these requires revisiting ADR 0001/0002 or adding a new ADR, not silently bolting it on." This feature is exactly that case — `design` for this slug must revisit or add an ADR for persistence before building, not treat the writer as a bolt-on detail.

## 2. Goals

- A developer can opt into recording of completed work/break phases with a single environment-variable toggle — no code change, no install step, no config file.
- A developer who does not opt in sees zero difference in `pomodoro`'s behavior, output, or file footprint.
- A developer's history survives across runs — stored in the platform's own conventional per-user location, not the current working directory, so it isn't lost or scattered.

## 3. Non-goals

- Reading, querying, or summarizing the history from within `pomodoro` itself — explicitly out of scope. Reason: this is a write-only log for the developer's own tooling to consume later; keeps the feature to its smallest useful unit, consistent with its S sizing. A future feature could add a way to view it, but that is a separate decision.
- Recording anything about interrupted or abandoned phases — explicitly out of scope, per the decision narrowing in §1. Reason: several exit paths can't run any code to write a record, so promising partial coverage would be a contract the tool can't actually keep.
- A CLI flag or a config file to control the opt-in — explicitly out of scope; the only mechanism is an environment variable. Reason: matches the project's existing "no config file" convention and needs zero changes to the existing `--help`/`--version` argv handling.
- File rotation, size limits, or alternative output formats — explicitly out of scope; the log is a single, ever-growing append-only file. Reason: simplest contract for this feature's size; revisit only if real usage shows it's a problem.

## 4. User stories

### US-01: Turn session history on

**As a** developer
**I want** to opt into session history with a single environment-variable toggle
**So that** I can start building up a record of my completed pomodoros without any extra setup

### US-02: See my completed phases recorded

**As a** developer
**I want** each work or break phase that finishes naturally to be appended to my history
**So that** I can later see how many pomodoros I actually completed

### US-03: Keep the default behavior unchanged

**As a** developer who has not opted in
**I want** `pomodoro` to behave exactly as it does today
**So that** this feature never surprises me, or anyone else running the tool without it

### US-04: Find my history in a predictable place

**As a** developer
**I want** my session history written to the same conventional location every time, on whichever OS I'm on
**So that** I can point my own tools at it without guessing or configuring a path

### US-05: Keep interrupted sessions out of my history

**As a** developer
**I want** phases I didn't finish — cut short by Ctrl+C, a signal, or a crash — to simply not appear in my history
**So that** the log only reflects pomodoros I actually completed, with no partial or misleading entries

### US-06: Never let logging break my timer

**As a** developer
**I want** `pomodoro` to keep running normally even if the history file can't be written
**So that** a logging problem (permissions, a missing directory, a full disk) never breaks my actual timer

## 5. Acceptance criteria

### AC-01 (US-01, US-02) — happy path

**Given** a developer has set the opt-in environment variable before running `pomodoro`
**When** a work or break phase's countdown reaches zero naturally (including a deferred transition flushed on resume)
**Then** the system synchronously appends one record for that completed phase to the developer's history — the append completes, or fails per AC-03, before the next phase's countdown begins — identifying exactly three things: which phase it was, which round, and an ISO-8601 UTC timestamp of when it completed; no additional fields

### AC-02 (US-03) — happy path

**Given** a developer has not set the opt-in environment variable
**When** they run `pomodoro` through a full work/break cycle
**Then** no history file is created or written to, and `pomodoro`'s printed output and behavior are identical to a version of the tool with no session-history capability at all

### AC-03 (US-06) — error

**Given** a developer has opted in
**When** a phase completes and the system attempts to append a record
**Then** the system first ensures the conventional per-user data location exists, creating it if absent, independently on every completed phase; only if the write still can't succeed after that (e.g. a permissions problem, a full disk) is the failure silently absorbed and the countdown continues normally — the developer's timer is never interrupted, delayed, or crashed by a history-write problem, and the next completed phase independently attempts its own write regardless of whether this one failed

### AC-04 (US-05) — domain invariant

**Given** a developer has opted in and a phase is interrupted — by Ctrl+C, a terminate/hang-up signal, or any other exit before the countdown reaches zero
**When** that interruption happens, at any point in the phase
**Then** no record is ever written for that phase — "only phases that run to natural completion are recorded" holds regardless of how, or how late, the interruption occurs

### AC-05 (US-04) — cross-context

**Given** a developer is running `pomodoro` with history enabled on a given operating system
**When** a phase completes
**Then** the record is written to that operating system's own conventional per-user data location — the same developer gets a consistent location on a given machine, and a different convention is honored on a different OS, with nothing for the developer to configure

### AC-06 (US-01) — authorization

**Given** a developer has not set the opt-in environment variable in their own shell session
**When** they run `pomodoro`
**Then** only the environment this specific invocation reads at its own startup decides whether history is written for it — no history is written for this run

## 6. Non-functional requirements

| Aspect | Target | Measurement |
|---|---|---|
| History-write added latency | ≤ 5ms added to the existing phase-transition write path, measured as real wall-clock time for the synchronous append (the countdown waits for this write — see AC-01/AC-03) | integration test timing the write call against a real temp-file write, not a fake double |
| Write-failure isolation | 100% of simulated write failures leave the countdown running, unaffected | unit test simulating a failing write, asserting ticks continue uninterrupted |
| Dependency footprint | 0 new runtime dependencies | `package.json` `dependencies` stays absent/empty |

## 6.1 Security / privacy

- **Data classification:** internal/personal — each record is a timestamp + phase/round tied to the developer's own usage pattern; stored only on the developer's own machine, never transmitted anywhere.
- **Personal data touched:** the developer's own usage timestamps (when they work/break) — potentially revealing of their schedule in aggregate, but local-only and entirely under the developer's own control (they can delete the file at any time).
- **AuthZ/AuthN impact:** None — no identity, accounts, or permission checks exist in this tool. AC-06's "authorization" coverage is about which invocation's own environment may trigger logging, not an identity-based access boundary.
- **Abuse cases:**
  - Another process or user sets the opt-in variable without the developer's knowledge, silently enabling logging: business response — prevented by AC-06 (only this invocation's own environment, read fresh on each completed phase, decides); documented in the README so it's never a silent surprise.
  - The history file grows indefinitely over long-term use, becoming a disk-space or stale-data concern: business response — accepted as a known limitation (§3 non-goal: no rotation); the developer can delete the file themselves at any time, and the tool never reads or depends on it.
  - A write-failure path accidentally crashes the tool or leaks an internal error to the developer: business response — explicitly prevented by AC-03; failures are isolated and never surface as an error.
- **Security review:** N/A — no network surface, no new permission boundary; purely local file I/O under the developer's own OS-level file permissions.
- **Definition of Done note:** documenting the opt-in variable's name/value and the history file's conventional location in `README.md` is part of this feature's Definition of Done — a docs deliverable, not a separately-tested acceptance criterion, since it's documentation rather than runtime behavior.

## 7. Metrics / KPIs

- **History records written per completed phase (when opted in)** — baseline: 0 (feature doesn't exist yet), target: exactly 1 per completed phase, 0 when not opted in, verified by test, maintained indefinitely.
- **Countdown disruption caused by a history-write failure** — baseline: N/A, target: 0% — no crash, hang, or missed tick, verified by test.
- **New runtime dependencies added by this feature** — baseline: 0 (current project state), target: remains 0.

## Test plan

> Size S / route `quick` → inline per the size matrix (no separate `test-plan.md`). Integration
> tests use a real, ephemeral temp directory (never a mocked `fs`) — created per test, cleaned up
> in an `afterEach`; this is the "ephemeral real dependency" this feature's one external boundary
> (the local filesystem) calls for, in place of a throwaway DB/queue container.

### Coverage table

| AC | Test | Level(s) |
|---|---|---|
| AC-01 | record construction carries exactly `{phase, round, completedAt}`, no additional fields | unit |
| AC-01 | the synchronous append completes before the next phase's countdown begins, against a real temp-file | integration |
| AC-02 | a full fake-clock cycle with `POMODORO_HISTORY` unset creates no file under the resolved data dir and leaves stdout/exit behavior unchanged | integration |
| AC-03 | simulated `mkdirSync`/`appendFileSync` throws leave `recordCompletedPhase` returning normally, no exception observable | unit |
| AC-03 | a real unwritable resolved path leaves the countdown's ticks running uninterrupted end-to-end | integration |
| AC-04 | `recordCompletedPhase` is never called when the fake clock stops mid-countdown instead of reaching zero (matches this repo's existing `io` fake-timer smoke-test convention) | unit |
| AC-05 | `resolveHistoryDir()` returns the correct path for each of the three `process.platform` branches, with controlled env vars | unit |
| AC-05 | `recordCompletedPhase` no-ops (no `mkdirSync`/`appendFileSync` call, nothing written under `process.cwd()`) when `resolveHistoryDir()` returns a non-absolute path — `HOME`/`XDG_DATA_HOME`/`LOCALAPPDATA` all unset | unit + integration |
| AC-06 | `isHistoryEnabled()` returns true only for the exact string `"1"`; false for unset, empty, or any other value | unit |

Zero acceptance criteria are left without a test row; AC-03 and AC-04 (the error / domain-invariant
criteria) each carry their own dedicated row rather than being folded into a happy-path test.

### Integration strategy

- **Dependency:** the local filesystem — this feature's only external boundary (no DB, no queue,
  no network surface; `sad.md §2` Regulatory/external, `spec.md §6.1`).
- **Ephemeral setup:** each integration test redirects `HOME` / `XDG_DATA_HOME` / `LOCALAPPDATA`
  (whichever the running platform reads) to a freshly created temp directory — never the
  developer's real per-user data directory.
- **Cleanup boundary:** per-test, in an `afterEach` that removes the temp directory recursively —
  per-test rather than per-suite, since the write-failure test (AC-03) deliberately leaves a path
  in a broken state that must not leak into the next test.
- **No mocked `fs`.** Mocking the one write path this feature has would make the integration tests
  indistinguishable from the unit tests already covering the same logic with a fake — the NFR
  (latency ≤5ms) is explicit that it wants "a real temp-file write, not a fake double."

### Load

<!-- NFR row 1 (history-write latency ≤5ms) is a single-operation bound, not a sustained-throughput
or concurrency number — confirmed with the owner: it is already the timing assertion inside the
AC-01 integration test row above, not a separate load/concurrency scenario. -->

N/A — no sustained-throughput or concurrency NFR exists for this feature; the one numeric NFR
(history-write latency ≤5ms) is a single-operation bound, covered by the AC-01 integration test
row above, not a dedicated load scenario.

### CI placement

- **Every PR:** all unit tests (AC-01 construction, AC-03 simulated failures, AC-04 fake-timer,
  AC-05 path branches, AC-06 opt-in gate) — fast, no real I/O beyond temp-file writes.
- **Every PR (still fast):** the integration tests (AC-01 timing, AC-02 zero-footprint, AC-03 real
  unwritable path) — each uses a throwaway temp directory, no network, no slow external dependency,
  so there's no reason to defer them to a schedule.

## 8. Open questions

- [x] Exact environment-variable name, AND its value semantics (presence-only vs. an exact value vs. truthy-string matching) — **resolved**: `POMODORO_HISTORY=1` as the toggle name/value, read as an exact match — only the literal value `1` opts in; unset, empty, or any other value (including `0`) does not. Decided in `sad.md` §4 item 4; implemented in `src/history/record.ts`'s `isHistoryEnabled()` and locked in by `src/history/record.test.ts`. — owner: Vitalii.
- [x] Whether AC-03's "silently absorbed" write failure leaves any trace at all — **resolved**: fully silent, no trace, ever, in every mode — consistent with the project's zero-friction philosophy. Decided in `sad.md` §4 item 4; implemented in `src/history/record.ts`'s `try`/`catch` blocks and locked in by `src/history/record.test.ts`. — owner: Vitalii.
- [ ] `src/history/record.integration.test.ts`'s cwd-leak regression test (T10) uses `process.chdir()`, which relies on vitest's default `forks` test-isolation pool (unpinned in `vitest.config.ts`) — a future pool change (e.g. to `threads`) would silently break this test rather than fail loudly. Raised by round-3 review (`_review/review-2026-10-06.md` round 3, N7), deferred as low-priority hardening, not a current bug. — owner: Vitalii, due: before `vitest.config.ts`'s `pool` setting is next touched.
- [ ] `resolveHistoryDir()` (`src/history/paths.ts`) still hands back a relative path when its base env var is unset; the cwd-leak guard (T10) lives only in `record.ts`, the one production call site today. A second caller would reintroduce the leak with no failing test. Raised by round-3 review (N8), deferred — no live bug while `record.ts` is the only caller. — owner: Vitalii, due: before a second caller of `resolveHistoryDir()` is added.
