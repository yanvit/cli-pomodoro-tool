---
status: Accepted
owner: "Vitalii"
reviewers: []
updated_at: "2026-09-30"
feature_size: "N/A — foundational, not a feature"
ticket: "N/A"
---

# 0002 — Split the code into cli / core / io modules

- **Status:** Accepted
- **Date:** 2026-09-30
- **Deciders:** Vitalii (with `survey`'s greenfield foundation session)

## Context

With Node.js/TypeScript chosen ([[0001-use-nodejs-typescript-with-no-framework-or-datastore]]),
the project needs an internal code layout before scaffolding. The tool is small (a fixed
25/5/15 cycle, blocking terminal, bell + printed alerts, immediate exit on Ctrl+C — per
`docs/idea-brief.md`), so the layout choice is really "one file" vs. "separate the pure logic
from the real-time I/O."

## Decision drivers

- The cycle math (work → short break → ... → long break every 4th cycle) should be testable
  without waiting on real 25-minute timers.
- The project is intentionally small — the split must not introduce ceremony disproportionate
  to the tool's size.
- `tdd: true` in `.claude/sdd.local.md` — the per-task gate expects unit-testable units; a
  state machine tangled with `setInterval`/process signals is hard to unit-test.

## Considered options

1. **Single file** — everything (argv, the loop, printing) in one `index.ts`. Fastest to write,
   but the cycle logic and the real-time loop are tangled, so testing the cycle math means either
   real waits or awkward inline `setTimeout` mocking.
2. **Thin split: cli / core / io** — `cli` handles argv (`--help`/`--version` only, since
   durations are fixed), `core` is the pure cycle state machine driven by an injectable clock,
   `io` is the real countdown loop, bell, and printed alerts.

## Decision outcome

**Chosen:** Option 2, the thin cli/core/io split. It keeps the state machine (`core`) a pure,
fast-testable unit driven by a fake clock in tests, while isolating the real-time/process
concerns (`io`) that are inherently harder to unit-test. `cli` stays trivial since there are no
configurable durations to parse.

## Consequences

**Positive**
- `core`'s cycle logic is unit-tested with a fake clock — no real 25-minute waits in the test
  suite.
- Adding a future capability (e.g. the deferred Do-Not-Disturb toggle from
  `docs/idea-brief.md` §8) has an obvious home (`io`) without touching `core`.

**Negative**
- Three small files instead of one — mild extra navigation for a tool this size.

**Neutral**
- No dependency-injection container is introduced; `cli` just composes `core` + `io` directly —
  the project is too small to need one, and this ADR doesn't change if that remains true.

## Links

- Spec: N/A — foundational decision, precedes any feature spec.
- SAD: N/A — greenfield foundation, not a feature SAD.
- Related ADR: [[0001-use-nodejs-typescript-with-no-framework-or-datastore]]
