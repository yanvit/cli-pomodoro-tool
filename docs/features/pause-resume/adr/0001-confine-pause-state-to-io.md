---
status: Accepted
owner: "Vitalii"
reviewers: ["Vitalii"]
updated_at: "2026-10-01"
feature_size: "S"
ticket: "docs/roadmap.md step 4"
---

# 0001 — Confine pause state to io, leave core untouched

- **Status:** Accepted
- **Date:** 2026-10-01
- **Deciders:** Vitalii (during `/sdd:design pause-resume`)

## Context

`pomodoro`'s domain logic lives in `src/core/cycle.ts` as a pure state machine (`CycleState`, `tick()`) with no I/O awareness — `src/io/timer.ts` drives it in real time via `setInterval`. The pause-resume feature needs to freeze the countdown and defer phase transitions while paused. Where that "paused" concept lives — inside the pure state machine, or entirely in the real-time driver — is the keystone architectural choice for this feature, and the spec's non-functional requirements and the roadmap's step-4 zone assignment already assume one answer without having formally decided it.

## Decision drivers

- `CONTEXT.md`'s "paused" glossary entry is already written as "a boolean state **orthogonal** to Phase... NOT a 4th Phase value" — a domain commitment made before this design pass.
- `docs/roadmap.md`'s execution-path wave assignment zones step 4 (pause-resume) to `src/io/` only, declared "disjoint" from step 5's `src/cli.ts` + `src/core/` zone specifically so the two can parallelize safely.
- `spec.md` §6 NFR "Paused-time accuracy" already states the measurement as "pausing withholds the tick entirely, so the existing `core` state machine needs no change."
- The project's own convention (`CLAUDE.md`, `docs/architecture-map.md`): `core` is pure, no timers, no I/O, fully unit-testable with a fake clock — a design goal worth preserving.

## Considered options

1. **Pause lives entirely in `io`** — the `setInterval` callback in `src/io/timer.ts` checks a local `paused` boolean before calling `core.tick()`; when paused, the callback simply returns without advancing state. `core/cycle.ts` is never touched.
2. **Pause becomes part of `CycleState`** — add a `paused: boolean` field to `core`'s `CycleState`, and have `core.tick()` itself become a no-op transition when paused. More "the state machine owns its own state" in a textbook domain-modeling sense.

## Decision outcome

**Chosen:** Option 1 (pause lives entirely in `io`). It keeps `core/cycle.ts` exactly as pure and timer-agnostic as every existing convention already commits to, avoids touching the one module this project is strictest about ("no timers, no I/O... fully unit-testable without real waits"), and matches three things already written down before this decision: the `CONTEXT.md` glossary entry, the roadmap's io-only zone claim, and the spec's own NFR measurement text. Option 2 is a legitimate alternative a reasonable engineer could reach for — "the state machine should know its own state" — but it would mean `tick()` stops being a pure function of elapsed time alone, and would contradict all three of those already-committed documents.

## Consequences

**Positive**
- `core/cycle.ts` and `core/cycle.test.ts` need zero changes — the existing fake-clock unit tests keep covering exactly what they cover today.
- The roadmap's wave-3 parallel-safety claim (pause-resume ∥ configurable-durations, disjoint zones) stays true in practice, not just on paper.
- Pause/resume is fully containable in one module (`src/io/`), consistent with the project's thin `cli`/`core`/`io` split.

**Negative**
- `io/timer.ts` (already the largest file in the project) gains the pause bookkeeping instead of it being modeled declaratively in `core`'s types — slightly less "the type system enforces it," slightly more "the driver loop enforces it."

**Neutral**
- If a future feature genuinely needs `core` to be pause-aware (e.g. a hypothetical non-interactive consumer of the state machine that also needs pause semantics), that would be a new decision superseding this one — not a cost paid today.

## Links

- Spec: [[../spec.md]] — US-01, US-02, AC-01, AC-02, AC-05
- SAD: [[../sad.md]] §4, §5
- Related ADR: none
