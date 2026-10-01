---
id: T5
title: "Show PAUSED indicator in compact render mode"
layer: "app"
deps: ["T2"]
blocks: ["T6"]
acs: ["AC-08"]
files_hint: ["src/io/compactLine.ts", "src/io/compactLine.test.ts"]
owner: "Vitalii"
estimate: "S"
context_budget: "S"
status: "todo"
---

# T5 — Show PAUSED indicator in compact render mode

## Place in the sequence

- **Blocked by:** T2 — pause/resume state must exist before it can be rendered. **Blocks:** T6 — docs update. **Wave:** 3 (parallel with T4 — different files).
- **Lane:** own lane — only task touching `src/io/compactLine.ts`.

## Why (user story)

> **As a** developer
> **I want** a clear "PAUSED" indicator while paused
> **So that** I don't mistake a frozen screen for one that's still counting down
>
> — `spec.md §4, US-04, verbatim` · full text: [spec.md](../spec.md)

This task delivers the compact-mode half of that indicator (T4 delivers the dashboard half).

## Inlined context

> `compactLine.ts` — modified — PAUSED indicator prepended to the compact line
>
> — `sad.md §5, Internal decomposition, verbatim` · full text: [sad.md](../sad.md)

> PAUSED label reuses the existing `phaseColor.ts` per-phase color (no new color) — appended to the dashboard header line and prepended to the compact line.
>
> — `spec.md §8, OQ resolved, abridged` · full text: [spec.md](../spec.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full
([spec.md](../spec.md) · [sad.md](../sad.md) · [src/io/compactLine.ts](../../../../src/io/compactLine.ts)) and follow it. Do not guess.

## Data delta

No DB changes.

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-08 — happy path

> **Given** a developer's session is paused
> **When** the display repaints on the keypress that paused it
> **Then** the "PAUSED" indicator is visible in both the dashboard and the compact render modes (not only one of them)
>
> — `spec.md §5, AC-08, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Give `renderCompactLine()` (or its caller in `timer.ts`) a way to know the paused state — same `paused: boolean` signal T4 adds for `render.ts`, kept out of `CycleState` per ADR-0001 — `src/io/compactLine.ts`
- [ ] When paused, prepend `"PAUSED "` to the existing compact line output, reusing the phase's existing color from `phaseColor.ts` — no new color — `src/io/compactLine.ts`
- [ ] Unit test: `renderCompactLine` called with `paused: true` includes `"PAUSED"` in its output, prepended; called with `paused: false` (or omitted) does not — `src/io/compactLine.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| Very narrow terminal where the compact line is already tight | `"PAUSED "` prefix takes priority — the existing compact-line width logic already handles truncation/clearing via `CLEAR_TO_EOL` in `timer.ts`'s `drawCompact` |

## Definition of Done

- [ ] Unit test in `src/io/compactLine.test.ts` passes for both paused and unpaused states
- [ ] `npm run build` and `npm test` pass
- [ ] lint + vet clean
