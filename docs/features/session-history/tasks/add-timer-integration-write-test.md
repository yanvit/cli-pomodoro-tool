---
id: T7
title: "Add real-filesystem integration test through the timer call site"
layer: "tests"
deps: ["T3"]
acs: ["AC-01"]
owner: "Vitalii"
estimate: "S"
status: "todo"
origin: "review-2026-10-06 finding #2 (sdd:review)"
---

# T7 — Real-filesystem integration test through the timer call site

## Why

Review finding #2: `timer.integration.test.ts` only covers the opt-out (AC-02) and unwritable-path
(AC-03) cases; no integration test opts in and exercises the real `io/timer.ts` call site, and no
test reads back real file content — only existence (`record.integration.test.ts`).

## Checklist

- [ ] Add a case to `src/io/timer.integration.test.ts`: `POMODORO_HISTORY=1`, `HOME`/`XDG_DATA_HOME`/
      `LOCALAPPDATA` redirected to a temp dir, `startTimer()` through two real phase-change edges
      (`work→short_break`, `short_break→work`).
- [ ] Read the real `history.jsonl` file under the resolved dir and assert exactly two lines whose
      parsed `{phase, round}` match the two completed phases.

## Definition of Done

- [ ] New integration test passes against real `fs`, no mocked `history` module.
- [ ] Lint clean.
