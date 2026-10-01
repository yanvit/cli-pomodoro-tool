# Tracker — pause-resume

> Status of every task in the epic. `implement` updates `done` as it commits each task.
> States: `todo` · `in_progress` · `blocked` · `review` · `done`.

| # | Task | Layer | Owner | Estimate | Blocked by | Status |
|---|---|---|---|---|---|---|
| T1 | Build src/io/keypress.ts: capability-gated keystroke capture | app | Vitalii | M | — | done |
| T2 | Wire pause/resume state into src/io/timer.ts | app | Vitalii | M | T1 | done |
| T3 | Wire exit-path handling into src/io/timer.ts | app | Vitalii | M | T1 | done |
| T4 | Show PAUSED indicator in dashboard render mode | app | Vitalii | S | T2 | done |
| T5 | Show PAUSED indicator in compact render mode | app | Vitalii | S | T2 | done (no-op — fully covered by T2, see tracker note) |
| T6 | Update CLAUDE.md and README.md to document pause/resume | docs | Vitalii | S | T3, T4, T5 | done |
| T7 | Fix-forward: move PAUSED indicator into render.ts/compactLine.ts (review 2026-10-01 #1/#2/#3) | app | Vitalii | S | — | done |
| T8 | Fix-forward: real-time-aware resume-flush + interval re-arm (review 2026-10-01 #4/#7) | app | Vitalii | S | — | done |
| T9 | Fix-forward: remove production removeAllListeners workaround (review 2026-10-01 #8) | app | Vitalii | S | — | done |
| T10 | Fix-forward: AC-03/AC-06 exit-path + plain-mode test coverage (review 2026-10-01 #9) | app | Vitalii | S | T9 | todo |
| T11 | Fix-forward: sync docs to as-shipped architecture (review 2026-10-01 #5/#6/#10/#11) | docs | Vitalii | S | T7, T8 | todo |

**Total:** 11 tasks, ~1 person-week + review-driven fix-forward pass.
