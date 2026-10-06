---
id: T10
title: "Guard against relative-path cwd leak when HOME/XDG_DATA_HOME/LOCALAPPDATA are unset"
layer: "infra"
deps: ["T1", "T2"]
acs: ["AC-05", "AC-03"]
owner: "Vitalii"
estimate: "S"
status: "done"
origin: "review-2026-10-06 round 2, finding #1 (sdd:review)"
---

# T10 — Guard against relative-path cwd leak

## Why

Round-2 review (`_review/review-2026-10-06.md` round 2, finding #1) found `resolveHistoryDir()`
returns a relative path when `HOME`/`XDG_DATA_HOME`/`LOCALAPPDATA` are all unset (`env -i`, cron,
containers), so `recordCompletedPhase` wrote `history.jsonl` into `process.cwd()` instead of the
per-user data directory — the exact "scattered" outcome AC-05 forbids, and a stage-1 (AC) gap.

## Checklist

- [x] Guard on `isAbsolute(dir)` in `src/history/record.ts` before any `fs` call; fold into the
      existing silent-absorb contract (AC-03) rather than throwing or falling back.
- [x] Add per-platform `paths.test.ts` cases pinning the relative-path fallback on linux/darwin/win32.
- [x] Add a `record.test.ts` case asserting `mkdirSync`/`appendFileSync` are never called when
      `resolveHistoryDir()` returns a non-absolute path.
- [x] Add a real-filesystem `record.integration.test.ts` case: unset all three env vars, `chdir`
      into a temp dir, assert nothing is written there.
- [x] Strengthen `record.integration.test.ts`'s existing write assertion from existence-only to
      real content (round-2 finding #5, same commit).

## Definition of Done

- [x] `src/history/record.ts:18-20` no-ops before any `fs` call on a non-absolute resolved dir.
- [x] Tests pin the fix by mutation (removing the guard fails the new cases).
- [x] Committed as `c71f6a0`.
