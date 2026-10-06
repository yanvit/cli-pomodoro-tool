---
status: Accepted
owner: "Vitalii"
reviewers: ["Vitalii"]
updated_at: "2026-10-06"
feature_size: "S"
ticket: "docs/roadmap.md step 6"
---

# 0001 — Introduce a new history module, called directly from io

- **Status:** Accepted
- **Date:** 2026-10-06
- **Deciders:** Vitalii (during `/sdd:design session-history`)

## Context

`pomodoro`'s foundation deliberately excluded persistence: ADR-0001 (project-level) chose "no framework, no datastore," and `docs/architecture-map.md` §Constraints is explicit that "a future feature that needs any of these requires revisiting ADR 0001/0002 or adding a new ADR, not silently bolting it on." `session-history` (`docs/roadmap.md` step 6) is exactly that feature — it needs to append one record per completed work/break phase to a file on the developer's own disk. A real scan of `src/io/timer.ts` shows the exact hook point already exists: the `setInterval` callback already branches on `transition.type === "phase-change"` to fire the bell, which is precisely the "phase completed naturally" signal `spec.md` AC-01 needs. Where the new write-logic lives, and how it's wired into that existing branch, is the architectural choice this ADR records.

## Decision drivers

- `docs/architecture-map.md` §Constraints requires this feature to formally revisit ADR-0001/0002 rather than bolt persistence on silently.
- spec.md AC-02 / AC-06: bare `pomodoro` (no opt-in) must stay byte-for-byte identical in output and behavior — the fewer files touched outside the new capability, the stronger that guarantee.
- `docs/adr/0002-thin-cli-core-io-module-split.md`: `core` is pure, zero I/O, fully unit-testable with a fake clock — a design goal worth preserving; this feature must not compromise it.
- `docs/adr/0002-thin-cli-core-io-module-split.md` also explicitly chose no dependency-injection container, "the project is too small to need one" — any new wiring should not quietly reintroduce one.

## Considered options

1. **New `src/history/` module, called directly from `io`** — `io/timer.ts` imports `history/record.ts` and calls `recordCompletedPhase()` synchronously, right where it already detects a phase-change; `core` and `cli` stay untouched.
2. **Fold the write logic directly into `io/timer.ts`** — no new module; the env-check, path-resolution, and append-with-fallback code live as extra functions inside the existing file.
3. **`cli.ts` composes a history writer and injects it into `startTimer()`** — an explicit dependency-injection style, extending "cli composes core+io directly" to "cli composes core+io+history."

## Decision outcome

**Chosen:** Option 1. It keeps `core/cycle.ts` exactly as pure and timer-agnostic as ADR-0002 already committed to, keeps `cli.ts` completely untouched (the strongest available proof that AC-02's "byte-for-byte identical" claim holds for the no-opt-in path), and matches the project's existing pattern of small, single-purpose modules (`io/render.ts`, `io/compactLine.ts`, `io/phaseColor.ts`) rather than growing `io/timer.ts` — already the project's largest file — further. Option 2 is a legitimate alternative (fewest files) but mixes OS-path-resolution and file-I/O concerns into the file that already owns rendering/signals/keystrokes, and makes the write-failure-isolation unit test (spec §6 NFR) harder to isolate from the timer's own fake-clock tests. Option 3 is also legitimate — it's the most explicit composition-root shape — but ADR-0002 deliberately rejected a DI container "because the project is too small to need one," and Option 3 reintroduces that style through parameter-passing; it's also the only option that touches `cli.ts` at all, which is otherwise the easiest file to prove is unchanged.

## Consequences

**Positive**
- `core/cycle.ts` and `cli.ts` both need zero changes — the strongest possible proof that bare `pomodoro` stays byte-for-byte identical (AC-02).
- `io`'s existing thin-smoke-test convention stays intact; the new `history` module gets its own focused unit tests (mkdir/append failure simulation) without entangling them with `io`'s fake-timer tests.
- Matches the project's existing small-single-purpose-module pattern in `src/io/`.

**Negative**
- A third top-level module alongside `cli`/`core`/`io` — `docs/architecture-map.md`'s module inventory and `CLAUDE.md`'s module-structure section both need a follow-up update to mention `history/` (not done by this ADR; flagged in this feature's SAD §11 as a reason to re-run `survey` after shipping).
- `io/timer.ts` now has an explicit dependency on `history`, a module it didn't need to know about before — a small increase in `io`'s fan-out, though still a single direct function call, consistent with how `io` already depends on `core`.

**Neutral**
- If a future feature needs `cli.ts` to compose history explicitly (e.g. a CLI flag that overrides the env var), that would be a new decision superseding this one, not a cost paid today.

## Links

- Spec: [[../spec.md]] — US-01, US-02, US-03, AC-01, AC-02, AC-03, AC-06
- SAD: [[../sad.md]] §4, §5
- Related ADR: [[../../../adr/0001-use-nodejs-typescript-with-no-framework-or-datastore]], [[../../../adr/0002-thin-cli-core-io-module-split]]
