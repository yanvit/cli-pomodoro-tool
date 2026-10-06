---
id: T5
title: "Document the opt-in variable and history file location in README"
layer: "docs"
deps: ["T3"]
blocks: []
acs: []
files_hint: ["README.md"]
owner: "Vitalii"
estimate: "S"
context_budget: "S"
status: "todo"
---

# T5 — Document the opt-in variable and history file location in README

## Place in the sequence

- **Blocked by:** T3 — Wire completed-phase recording into `io/timer.ts` (the feature must be real before documenting it as shipped). **Blocks:** none — this is a leaf task. **Wave:** 4, parallel with T4 (different files, no shared lane).
- **Lane:** own lane, shares no `files_hint` with T4.

## Why (user story)

> **As a** developer
> **I want** to opt into session history with a single environment-variable toggle
> **So that** I can start building up a record of my completed pomodoros without any extra setup
>
> — `spec.md §4, US-01, verbatim` · full text: [spec.md](../spec.md)

This task closes US-01's "no extra setup" promise — without documentation, the opt-in variable's name and the history file's location are undiscoverable, which is itself a form of setup friction.

## Inlined context

> **Definition of Done note:** documenting the opt-in variable's name/value and the history file's conventional location in `README.md` is part of this feature's Definition of Done — a docs deliverable, not a separately-tested acceptance criterion, since it's documentation rather than runtime behavior.
>
> — `spec.md §6.1, Security / privacy, verbatim` · full text: [spec.md](../spec.md)

> Another process or user sets the opt-in variable without the developer's knowledge, silently enabling logging: business response — prevented by AC-06 ... documented in the README so it's never a silent surprise.
>
> — `spec.md §6.1, Abuse cases, abridged` · full text: [spec.md](../spec.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md)) and follow it. Use the exact variable name and value `POMODORO_HISTORY=1` (confirmed in `sad.md §4` item 4) and the exact three OS paths from `sad.md §10` QG-3 — do not approximate or abbreviate them.

## Data delta

No DB changes.

## API contract

Internal — no API surface.

## Acceptance criteria

<!-- This task satisfies spec §6.1's Definition-of-Done note, not a numbered §5 AC — it is
explicitly called out there as "a docs deliverable, not a separately-tested acceptance
criterion." No AC id is listed in this task's `acs` for that reason. -->

None — this task's obligation is the `spec.md §6.1` Definition-of-Done note quoted above, not a numbered acceptance criterion.

## Checklist

- [ ] Add a "Session history (opt-in)" section to `README.md`.
- [ ] Document `POMODORO_HISTORY=1` as the exact opt-in toggle (unset, empty, or any other value leaves it off).
- [ ] List the three OS-conventional paths verbatim from `sad.md §10` QG-3: `$XDG_DATA_HOME`/`~/.local/share/pomodoro-timer/` (Linux), `~/Library/Application Support/pomodoro-timer/` (macOS), `%LOCALAPPDATA%\pomodoro-timer\` (Windows).
- [ ] State plainly that only phases that complete naturally are recorded, and that a write failure is always silent and never affects the timer (spec §6.1's own framing, so a developer reading it isn't surprised either way).
- [ ] Note that another process/user could set the variable without the developer's knowledge (spec §6.1 abuse case) — this is why it's documented, not a reason to add detection code.

## Edge cases

| Case | Behaviour |
|---|---|
| A developer reads only the README, never the spec | The README alone must be enough to know the toggle name/value and where the file lands — that's this task's whole purpose. |

## Definition of Done

- [ ] `README.md` names the exact env var, its exact opt-in value, and all three OS paths.
- [ ] A reviewer can opt in and locate the history file using only the README, with no other doc open.
