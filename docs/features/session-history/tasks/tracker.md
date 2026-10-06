# Tracker — session-history

> Status of every task in the epic. `implement` updates `done` as it commits each task.
> States: `todo` · `in_progress` · `blocked` · `review` · `done`.

| # | Task | Layer | Owner | Estimate | Blocked by | Status |
|---|---|---|---|---|---|---|
| T1 | Implement OS-conventional history-directory resolution | infra | Vitalii | S | — | done |
| T2 | Implement opt-in gate + isolated append-only writer | infra | Vitalii | M | T1 | done |
| T3 | Wire completed-phase recording into io/timer.ts | wiring | Vitalii | M | T2 | done |
| T4 | Integration-test latency and full-cycle default-behavior guarantees | tests | Vitalii | M | T3 | done |
| T5 | Document the opt-in variable and history file location in README | docs | Vitalii | S | T3 | done |
| T6 | Strengthen AC-01 round-capture test to discriminate pre/post-tick round | tests | Vitalii | S | T3 | done |
| T7 | Add real-filesystem integration test through the timer call site | tests | Vitalii | S | T3 | done |
| T8 | Update CLAUDE.md to document the history module and reflect shipped persistence | docs | Vitalii | XS | T3 | done |
| T9 | Name the history file and its format in README | docs | Vitalii | XS | T5 | done |
| T10 | Guard against relative-path cwd leak when HOME/XDG_DATA_HOME/LOCALAPPDATA are unset | infra | Vitalii | S | T1, T2 | done |
| T11 | Close round-2 review doc findings | docs | Vitalii | S | T3 | done |

**Total:** 11 tasks (T6-T9 added 2026-10-06 from round-1 `_review/review-2026-10-06.md` findings
#1-#4; T10-T11 added 2026-10-06 from round-2 findings #1-#7).
