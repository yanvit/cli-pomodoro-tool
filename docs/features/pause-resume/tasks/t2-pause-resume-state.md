---
id: T2
title: "Wire pause/resume state into src/io/timer.ts (skip-tick + resume-flush)"
layer: "app"
deps: ["T1"]
blocks: ["T4", "T5"]
acs: ["AC-01", "AC-02", "AC-05"]
files_hint: ["src/io/timer.ts", "src/io/timer.test.ts"]
owner: "Vitalii"
estimate: "M"
context_budget: "M"
status: "todo"
---

# T2 — Wire pause/resume state into src/io/timer.ts (skip-tick + resume-flush)

## Place in the sequence

- **Blocked by:** T1 — Build src/io/keypress.ts. **Blocks:** T4 — PAUSED indicator (dashboard), T5 — PAUSED indicator (compact). **Wave:** 2.
- **Lane:** shares `src/io/timer.ts` with T3 — serialized with it (same file, both depend only on T1, not on each other); either order is correct as long as they don't land in the same commit without care.

## Why (user story)

> **As a** developer
> **I want** to pause the countdown mid-phase
> **So that** I don't lose track of where I was when I get pulled away
>
> — `spec.md §4, US-01, verbatim` · full text: [spec.md](../spec.md)

> **As a** developer
> **I want** to resume a paused countdown from exactly where it left off
> **So that** the interruption doesn't cost me any of the phase's remaining time
>
> — `spec.md §4, US-02, verbatim` · full text: [spec.md](../spec.md)

This task implements both: the pause/resume toggle itself, and the correctness guarantee that no time or transition is lost across it.

## Inlined context

> **Pause state is confined entirely to `io`** — `core/cycle.ts` stays a pure, untouched state machine; pausing means the `setInterval` callback in `io/timer.ts` conditionally skips calling `core.tick()`. Resuming calls `core.tick()` once immediately, synchronously, on the resume keypress itself — not waiting for the next 1s interval — which is what lets spec AC-05's "deferred transition fires immediately at the moment of resume" hold even when the phase was already due to end while paused; the interval is then re-armed for subsequent ticks.
>
> — `sad.md §4, item 2, verbatim` · full text: [sad.md](../sad.md)

> ```
> Developer->>io: presses spacebar
> io->>io: set paused = true, skip next tick() calls
> io->>Developer: repaint — PAUSED indicator shown (same keypress turn)
> Note over io,core: core.tick() is not called while paused — core state is frozen exactly
> Developer->>io: presses spacebar again
> io->>core: tick() called once immediately, synchronously, on this keypress
> core-->>io: a due transition fires right here if the phase had already ended while paused (AC-05) — otherwise an ordinary tick
> io->>Developer: repaint — reflects any flushed transition/bell, PAUSED indicator cleared
> io->>io: re-arm the 1s interval for subsequent ticks
> ```
>
> — `sad.md §6, "Pause and resume mid-phase" (Critical flow 1), verbatim` · full text: [sad.md](../sad.md)

> **Chosen:** Option 1 (pause lives entirely in `io`)... `core/cycle.ts` and `core/cycle.test.ts` need zero changes — the existing fake-clock unit tests keep covering exactly what they cover today.
>
> — `adr/0001-confine-pause-state-to-io.md §Decision outcome + §Consequences, abridged` · full text: [adr/0001-confine-pause-state-to-io.md](../adr/0001-confine-pause-state-to-io.md)

> | Pause/resume visual responsiveness | The display repaints once, immediately, on the triggering keypress — not on a periodic interval while paused | a thin `io` smoke test asserting the PAUSED marker appears in the write triggered by the pause keypress, and clears in the write triggered by the resume keypress |
> | Paused-time accuracy | Time spent paused is never counted against the remaining phase duration — the remaining time is preserved exactly (not rounded) | unit test in `io` with a fake timer |
>
> — `spec.md §6, NFR rows 1–2, verbatim` · full text: [spec.md](../spec.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full
([spec.md](../spec.md) · [sad.md](../sad.md) · [adr/0001-confine-pause-state-to-io.md](../adr/0001-confine-pause-state-to-io.md)) and follow it. Do not guess.

## Data delta

No DB changes.

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-01 — happy path

> **Given** a developer is running `pomodoro` in dashboard or compact mode, mid-phase
> **When** the developer presses spacebar
> **Then** the countdown freezes at its current remaining time and the display shows a clear "PAUSED" indicator
>
> — `spec.md §5, AC-01, verbatim` · full text: [spec.md](../spec.md)

### AC-02 — happy path

> **Given** a developer has a paused session showing "PAUSED" with some remaining time
> **When** the developer presses spacebar again
> **Then** the countdown resumes counting down from exactly the remaining time it was paused at — preserved exactly, never rounded up — so no number of pause/resume cycles can ever grow a phase beyond its nominal duration, and the "PAUSED" indicator clears
>
> — `spec.md §5, AC-02, verbatim` · full text: [spec.md](../spec.md)

### AC-05 — domain invariant

> **Given** a developer's session is paused, at any point in the countdown including the instant a phase would otherwise have ended
> **When** any amount of real time elapses while paused
> **Then** no phase transition occurs and no bell sounds for as long as the session stays paused — "no phase transition while paused" holds regardless of timing, and the display continues showing "PAUSED" against the phase and remaining time captured at the moment of pausing. If the remaining time had reached zero while paused, the deferred transition (and its bell) fires immediately at the moment of resume, before the next countdown begins — paused time is frozen, never banked as extra time in the phase that was ending.
>
> — `spec.md §5, AC-05, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Add a `paused` boolean to `startTimer()`'s local state in `src/io/timer.ts` (do not add anything to `core/cycle.ts` — see ADR-0001) — `src/io/timer.ts`
- [ ] Instantiate `keypress.ts` (T1) from `startTimer()`; wire its `onTogglePause` callback to flip `paused` — `src/io/timer.ts`
- [ ] In the existing `setInterval` callback: when `paused` is `true`, return immediately without calling `tick(state)` and without redrawing — `src/io/timer.ts`
- [ ] On the pause-triggering keypress itself (not the interval): set `paused = true`, then immediately redraw once showing the PAUSED state (no change to `state` — `tick()` is not called) — `src/io/timer.ts`
- [ ] On the resume-triggering keypress: set `paused = false`, call `tick(state)` once synchronously right there (flushing any transition that was already due), update `state`, fire the bell if that call returned a `"phase-change"` transition, then redraw — `src/io/timer.ts`
- [ ] Gate pause/resume to dashboard and compact modes only — if `pickRenderMode` resolved to `"plain"`, never instantiate keypress capture at all (ties into T1's AC-03, confirmed here at the call site) — `src/io/timer.ts`
- [ ] Unit tests with `vi.useFakeTimers()`: pressing pause freezes `secondsRemaining`; advancing fake time while paused does not change state; resuming with no time elapsed continues from the exact same `secondsRemaining`; resuming when the phase was already due (simulate by pausing at `secondsRemaining: 1`) fires the transition/bell immediately on the resume keypress, not on the next interval tick — `src/io/timer.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| Spacebar pressed while `secondsRemaining` was already due to transition (paused at the `0:01`→`0:00` boundary) | Resume synchronously calls `tick()` once, firing the transition + bell immediately, before any further countdown (AC-05) |
| Multiple pause/resume cycles in quick succession | `secondsRemaining` is only ever changed by an explicit `tick()` call on resume or by the normal interval — never decremented while `paused` — so no cycle count can shrink or grow the remaining time (AC-02) |
| Render mode is `"plain"` | Pause/resume is never wired up at all — handled by the gate in this task's checklist, verified by T1's AC-03 coverage |

## Definition of Done

- [ ] Unit tests in `src/io/timer.test.ts` pass, including the fake-timer pause/resume and the resume-flush-at-boundary case
- [ ] `npm run build` and `npm test` pass
- [ ] every Hard Rule inlined above still holds (`core/cycle.ts` has zero diff)
- [ ] lint + vet clean
