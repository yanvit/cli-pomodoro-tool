---
id: T3
title: "Wire completed-phase recording into io/timer.ts"
layer: "wiring"
deps: ["T2"]
blocks: ["T4", "T5"]
acs: ["AC-01", "AC-02", "AC-04"]
files_hint: ["src/io/timer.ts", "src/io/timer.test.ts"]
owner: "Vitalii"
estimate: "M"
context_budget: "M"
status: "todo"
---

# T3 — Wire completed-phase recording into io/timer.ts

## Place in the sequence

- **Blocked by:** T2 — Implement opt-in gate + isolated append-only writer (`recordCompletedPhase` must exist before anything can call it). **Blocks:** T4 — Integration-test latency + full-cycle guarantees, T5 — Document the opt-in variable in README (both need the real call site to exist/stabilize first). **Wave:** 3.
- **Lane:** own lane — `src/io/timer.ts` is touched by no other task; T4 and T5 only *read* its behavior, they don't co-edit this file, so they can run in parallel with each other once this task lands.

## Why (user story)

> **As a** developer
> **I want** each work or break phase that finishes naturally to be appended to my history
> **So that** I can later see how many pomodoros I actually completed
>
> — `spec.md §4, US-02, verbatim` · full text: [spec.md](../spec.md)

This task delivers the one call site that actually triggers US-02 — `io/timer.ts`'s existing `setInterval` callback gains the call to `history.recordCompletedPhase`, right next to where it already fires the bell.

## Inlined context

> `io/timer.ts` — modified — on `transition.type === "phase-change"`, calls `history.recordCompletedPhase(transition.from, completedRound)` synchronously, alongside the existing bell. `completedRound` MUST be captured from the pre-tick `state.round` before the local `state` variable is reassigned to `transition.state` — `nextPhase()` (`core/cycle.ts`) advances round on the `short_break→work` and `long_break→work` edges, so by the time the post-tick state is in hand, its round no longer identifies the phase that just completed
>
> — `sad.md §5, Internal decomposition, verbatim` · full text: [sad.md](../sad.md)

> **Hard rule:** `core/cycle.ts` and `cli.ts` are both completely untouched — the strongest possible proof that bare `pomodoro` stays byte-for-byte identical (AC-02).
>
> — `sad.md §4, item 2, abridged` · full text: [sad.md](../sad.md)

> **Chosen: Option 1.** [`history` called directly from `io`] ... keeps `core/cycle.ts` exactly as pure and timer-agnostic as ADR-0002 already committed to, keeps `cli.ts` completely untouched (the strongest available proof that AC-02's "byte-for-byte identical" claim holds for the no-opt-in path)
>
> — `adr/0001-introduce-a-new-history-module-called-directly-from-io.md, Decision outcome, abridged` · full text: [adr/0001-introduce-a-new-history-module-called-directly-from-io.md](../adr/0001-introduce-a-new-history-module-called-directly-from-io.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [adr/0001-introduce-a-new-history-module-called-directly-from-io.md](../adr/0001-introduce-a-new-history-module-called-directly-from-io.md)) and follow it. Do not touch `src/cli.ts` or `src/core/cycle.ts` under any circumstance — that is the one rule this task cannot trade off against convenience.

## Data delta

No DB changes. This task passes `transition.from` and the pre-tick `round` into `recordCompletedPhase` (T2) — it does not alter the `CompletedPhaseRecord` shape itself.

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-01 — happy path

> **Given** a developer has set the opt-in environment variable before running `pomodoro`
> **When** a work or break phase's countdown reaches zero naturally (including a deferred transition flushed on resume)
> **Then** the system synchronously appends one record for that completed phase to the developer's history — the append completes, or fails per AC-03, before the next phase's countdown begins — identifying exactly three things: which phase it was, which round, and an ISO-8601 UTC timestamp of when it completed; no additional fields
>
> — `spec.md §5, AC-01, verbatim` · full text: [spec.md](../spec.md)

### AC-02 — happy path

> **Given** a developer has not set the opt-in environment variable
> **When** they run `pomodoro` through a full work/break cycle
> **Then** no history file is created or written to, and `pomodoro`'s printed output and behavior are identical to a version of the tool with no session-history capability at all
>
> — `spec.md §5, AC-02, verbatim` · full text: [spec.md](../spec.md)

### AC-04 — domain invariant

> **Given** a developer has opted in and a phase is interrupted — by Ctrl+C, a terminate/hang-up signal, or any other exit before the countdown reaches zero
> **When** that interruption happens, at any point in the phase
> **Then** no record is ever written for that phase — "only phases that run to natural completion are recorded" holds regardless of how, or how late, the interruption occurs
>
> — `spec.md §5, AC-04, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] In `src/io/timer.ts`'s `setInterval` callback: capture `const completedRound = state.round` **before** reassigning `state = transition.state`.
- [ ] Immediately after the existing `transition.type === "phase-change"` branch that fires the bell, add `history.recordCompletedPhase(transition.from, completedRound)`.
- [ ] Import `history` from `../history/record` (T2) — a single direct function call, no DI, per `docs/adr/0002-thin-cli-core-io-module-split.md`.
- [ ] Confirm by inspection (and a diff review) that `src/cli.ts` and `src/core/cycle.ts` have zero line changes from this task.
- [ ] Extend `src/io/timer.test.ts`'s existing fake-timer smoke tests: assert `recordCompletedPhase` is called with the correct `(phase, round)` pair on a natural phase-change tick, and is never called when `SIGINT` fires mid-countdown (AC-04).

## Edge cases

| Case | Behaviour |
|---|---|
| `SIGINT` (Ctrl+C) fires mid-countdown | The existing signal handler exits the process immediately; `tick()` never returns a phase-change transition for this phase, so `recordCompletedPhase` is never called (AC-04) — no new signal-handling code is needed, only *not* calling the writer from any path but the natural phase-change branch. |
| A deferred transition flushed on pause/resume's resume | AC-01 explicitly includes this case ("including a deferred transition flushed on resume") — out of this task's own scope today (pause/resume is spec'd, not shipped, per `spec.md §1`), but the call site added here (hooked to `transition.type === "phase-change"`, not to the tick's timing) already covers it once pause/resume lands, per `spec.md §1`'s own traceability note. |
| History disabled (`POMODORO_HISTORY` unset) | `recordCompletedPhase` no-ops (T2's contract) — this task's wiring still calls it every phase-change; the no-op is what makes AC-02's "byte-for-byte identical" hold without an `if` in `timer.ts` itself. |

## Definition of Done

- [ ] `src/io/timer.test.ts` passes with the new assertions (AC-01, AC-04).
- [ ] A full-cycle smoke test with `POMODORO_HISTORY` unset shows identical stdout/exit behavior to the pre-feature baseline (AC-02).
- [ ] `git diff` shows zero changes to `src/cli.ts` and `src/core/cycle.ts`.
- [ ] every Hard Rule inlined above still holds.
- [ ] lint + vet clean.
