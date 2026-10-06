# Tracker — session-history

> Status of every task in the epic. `implement` updates `done` as it commits each task.
> States: `todo` · `in_progress` · `blocked` · `review` · `done`.

| # | Task | Layer | Owner | Estimate | Blocked by | Status |
|---|---|---|---|---|---|---|
| T1 | Implement OS-conventional history-directory resolution | infra | Vitalii | S | — | todo |
| T2 | Implement opt-in gate + isolated append-only writer | infra | Vitalii | M | T1 | todo |
| T3 | Wire completed-phase recording into io/timer.ts | wiring | Vitalii | M | T2 | todo |
| T4 | Integration-test latency and full-cycle default-behavior guarantees | tests | Vitalii | M | T3 | todo |
| T5 | Document the opt-in variable and history file location in README | docs | Vitalii | S | T3 | todo |

**Total:** 5 tasks, ~1 person-week (matches `.size` = S, ≤1 week per `sad.md §2` Organisational).
