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

**Total:** 6 tasks, ~1 person-week.
