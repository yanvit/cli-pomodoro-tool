---
id: T6
title: "Strengthen AC-01 round-capture test to discriminate pre/post-tick round"
layer: "tests"
deps: ["T3"]
acs: ["AC-01"]
owner: "Vitalii"
estimate: "S"
status: "todo"
origin: "review-2026-10-06 finding #1 (sdd:review)"
---

# T6 — Strengthen AC-01 round-capture test

## Why

The independent review (`_review/review-2026-10-06.md` finding #1) proved by mutation that
`timer.test.ts`'s only phase-change assertion (`work` round 1 → `short_break`) can't tell correct
pre-tick round capture apart from the exact post-tick bug `sad.md §5` warns against, because both
rounds are `1`. Moving the capture after the tick in `src/io/timer.ts` still passes the full suite.

## Checklist

- [ ] Add a test case that advances through the `short_break → work` edge (where `nextPhase()`
      increments `round`), and asserts `recordCompletedPhase` was called with `("short_break", 1)`
      — the pre-tick round — not `("short_break", 2)`.
- [ ] Confirm by mutation (temporarily moving the capture after the tick) that the new test fails,
      then revert the mutation.

## Definition of Done

- [ ] New assertion in `src/io/timer.test.ts` passes against current code.
- [ ] Lint clean.
