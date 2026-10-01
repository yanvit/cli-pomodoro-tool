---
id: T4
title: "Show PAUSED indicator in dashboard render mode"
layer: "app"
deps: ["T2"]
blocks: ["T6"]
acs: ["AC-08"]
files_hint: ["src/io/render.ts", "src/io/render.test.ts"]
owner: "Vitalii"
estimate: "S"
context_budget: "S"
status: "todo"
---

# T4 — Show PAUSED indicator in dashboard render mode

## Place in the sequence

- **Blocked by:** T2 — pause/resume state must exist before it can be rendered. **Blocks:** T6 — docs update. **Wave:** 3 (parallel with T5 — different files).
- **Lane:** own lane — only task touching `src/io/render.ts`.

## Why (user story)

> **As a** developer
> **I want** a clear "PAUSED" indicator while paused
> **So that** I don't mistake a frozen screen for one that's still counting down
>
> — `spec.md §4, US-04, verbatim` · full text: [spec.md](../spec.md)

This task delivers the dashboard-mode half of that indicator.

## Inlined context

> `render.ts` — modified — PAUSED indicator in the dashboard header line
> `phaseColor.ts` — unchanged — reused as-is for the PAUSED label's color, per the owner's confirmed default
>
> — `sad.md §5, Internal decomposition, verbatim` · full text: [sad.md](../sad.md)

**Existing code this task extends** (already in the repo, not written by this task):

> ```
> export function renderFrame(state: CycleState, terminalWidth?: number): string[] {
>   const header = `${PHASE_LABEL[state.phase]} · Round ${state.round}/4`;
>   ...
> }
> ```
>
> — `src/io/render.ts, renderFrame(), abridged` · full text: [src/io/render.ts](../../../../src/io/render.ts)

**Fallback:** insufficient or contradicted by the code → read the named file in full
([spec.md](../spec.md) · [sad.md](../sad.md) · [src/io/render.ts](../../../../src/io/render.ts)) and follow it. Do not guess.

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

- [ ] Give `renderFrame()` (or the caller in `timer.ts`) a way to know the paused state — e.g. an added `paused: boolean` parameter, kept out of `CycleState` per ADR-0001 — `src/io/render.ts`
- [ ] When paused, append `" · PAUSED"` to the existing header line (`${PHASE_LABEL[state.phase]} · Round ${state.round}/4`), reusing the phase's existing color from `phaseColor.ts` — no new color — `src/io/render.ts`
- [ ] Unit test: `renderFrame` called with `paused: true` includes `"PAUSED"` in its output; called with `paused: false` (or the parameter omitted) does not — `src/io/render.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| Header line width grows with `" · PAUSED"` appended | Existing `center()`/box-width logic in `renderFrame` already sizes the box from the longest content line — no separate width handling needed |
| Terminal too narrow for the dashboard | Out of this task's scope — `renderMode.ts` already falls back to compact mode before this function is reached |

## Definition of Done

- [ ] Unit test in `src/io/render.test.ts` passes for both paused and unpaused states
- [ ] `npm run build` and `npm test` pass
- [ ] lint + vet clean
