---
id: T6
title: "Update CLAUDE.md and README.md to document pause/resume"
layer: "docs"
deps: ["T3", "T4", "T5"]
blocks: []
acs: []
files_hint: ["CLAUDE.md", "README.md"]
owner: "Vitalii"
estimate: "S"
context_budget: "S"
status: "todo"
---

# T6 — Update CLAUDE.md and README.md to document pause/resume

## Place in the sequence

- **Blocked by:** T3 — exit-path handling, T4 — PAUSED indicator (dashboard), T5 — PAUSED indicator (compact). **Blocks:** none — last task. **Wave:** 4.
- **Lane:** own lane — only task touching `CLAUDE.md`/`README.md`.

## Why (user story)

This task has no single owning user story — it closes a documentation gap flagged during `design`: `CLAUDE.md`'s own "Destination" paragraph currently states flatly "no pause/resume," which becomes stale the moment this feature ships. It supports every user story in this feature indirectly, by keeping the project's own governing doc accurate for future work (including the next v2 steps, configurable-durations and session-history, which will hit the same staleness otherwise).

## Inlined context

> `pomodoro` runs a fixed 25/5/15 work/break cycle with no pause ... There is currently no way to freeze progress and resume exactly where it was left off.
>
> — `spec.md §1, ¶1, abridged` · full text: [spec.md](../spec.md)

> Session history/logging, configurable durations, and pause/resume were reopened for v2 — see steps 4-6 and Decisions so far. They are no longer out of scope.
>
> — `docs/roadmap.md, Out of scope section comment, verbatim` · full text: [docs/roadmap.md](../../../roadmap.md)

**Current stale text to replace** (in the project root, not this feature folder):

> A single-purpose CLI Pomodoro timer. Running `pomodoro` walks the classic 25 min work / 5 min short break / 15 min long break (every 4th round) cycle, alerting with a terminal bell + printed message at each transition, and exits immediately and cleanly on Ctrl+C. No history, no task binding, no configurable durations, no background/daemon mode, no OS notifications, no pause/resume, no Do-Not-Disturb integration — see `docs/idea-brief.md` §5 for the full list and why each was dropped.
>
> — `CLAUDE.md, opening paragraph, verbatim` · full text: [CLAUDE.md](../../../../CLAUDE.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full
([spec.md](../spec.md) · [README.md](../../../../README.md) · [CLAUDE.md](../../../../CLAUDE.md)) and follow it. Do not guess.

## Data delta

No DB changes.

## API contract

Internal — no API surface.

## Acceptance criteria

No acceptance criteria apply — this is a documentation-only task with no `acs` entries. Its own Definition of Done (below) is the testable bar.

## Checklist

- [ ] `CLAUDE.md`: remove "no pause/resume" from the opening paragraph's exclusion list; add one sentence describing the spacebar pause/resume behavior (dashboard/compact only, Ctrl+C still exits immediately) — `CLAUDE.md`
- [ ] `README.md`: add a line to the Usage section documenting the spacebar keybinding — `README.md`
- [ ] Leave the "no task binding, no configurable durations [until shipped], no background/daemon mode, no OS notifications, no Do-Not-Disturb integration" parts of `CLAUDE.md`'s exclusion list untouched — only pause/resume is resolved by this feature — `CLAUDE.md`

## Edge cases

| Case | Behaviour |
|---|---|
| n/a | This task has no runtime behavior — documentation only |

## Definition of Done

- [ ] `CLAUDE.md`'s Destination paragraph no longer lists "no pause/resume" and accurately describes the shipped behavior
- [ ] `README.md`'s Usage section documents the spacebar keybinding
- [ ] Both files still read coherently alongside the unchanged parts of their exclusion lists
