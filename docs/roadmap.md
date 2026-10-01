---
status: living
updated_at: "2026-10-01"
---

# Roadmap — cli-pomodoro-timer

> **A decomposition, not a promise.** The overall idea broken into incremental steps: what each
> step is, where it comes from, how big it is — or that nobody has looked at it yet — and in which
> order, and parallel lanes, we walk them. **No dates** (except shipped history), **no scores** —
> order is the prioritization. The *solution* for any step lives in its `docs/features/<slug>/`
> spec, not here.

## Destination

Running `pomodoro` in a terminal walks you through the classic 25/5/15 work/break cycle (long break every 4th round) with a bell + printed alert at each transition, and exits cleanly on Ctrl+C — nothing persisted, nothing configured.

## Steps

| # | Step | Source | Size | Status |
|---|---|---|:---:|---|
| 1 | Scaffold the project skeleton | `docs/architecture-map.md` (mode: greenfield-bootstrap) | XS | shipped |
| 2 | Build the CLI Pomodoro timer | `docs/idea-brief.md §7 Recommendation` | S | shipped |
| 3 | Harden for distribution: `io/timer.ts` smoke test, README, npm packaging metadata, D2 resolution | this conversation | XS | shipped |

## Not yet specified

<!-- none — this pass surfaced zero fog; every step above is sized. -->

## Out of scope

- Session history / logging — `docs/idea-brief.md §5`
- Task binding — `docs/idea-brief.md §5`
- Configurable durations (flags/config file) — `docs/idea-brief.md §5`
- Background/daemon mode — `docs/idea-brief.md §5`
- OS system notifications — `docs/idea-brief.md §5`
- Pause/resume — `docs/idea-brief.md §5`
- Do-Not-Disturb / attention enforcement — `docs/idea-brief.md §5`; confirmed **permanent** via D1 (see Decisions so far), not a v1-only deferral

## Open decisions

<!-- none — D1 and D2 are both resolved; see Decisions so far. -->

## Decisions so far

- Node.js/TypeScript, no framework or datastore → [`docs/adr/0001-use-nodejs-typescript-with-no-framework-or-datastore.md`](adr/0001-use-nodejs-typescript-with-no-framework-or-datastore.md)
- Thin `cli / core / io` module split → [`docs/adr/0002-thin-cli-core-io-module-split.md`](adr/0002-thin-cli-core-io-module-split.md)
- Minimal single-command timer: fixed 25/5/15 cycle, bell+text alert, no persistence → [`docs/idea-brief.md §7`](idea-brief.md)
- **D2 resolved:** the bell (`\x07`) is a raw control character, not an ANSI sequence — it works on every Windows terminal host including legacy `cmd.exe`, so no fallback is needed there. The actual portability risk is the dashboard's ANSI color/cursor-control escapes garbling on legacy conhost without VT processing enabled; resolved by documenting it in `README.md` rather than adding platform-detection code, consistent with this project's minimalism (the user base is Mac/Linux-primary per `idea-brief.md §3`).
- **D1 resolved — permanently closed, not deferred:** no v2 accountability/Do-Not-Disturb mechanism will be built. Grilled 2026-10-01: chose to keep the tool a pure clock+bell rather than add enforcement. Reinforced by research showing no stable public API exists for toggling Focus/DND on macOS, Windows, or Linux — every known path is an unofficial workaround requiring manual one-time setup (e.g. a hand-built macOS Shortcut) and OS permission grants, and has broken across past OS updates. "Do-Not-Disturb / attention enforcement" in Out of scope below is now a permanent exclusion, not a v1-only deferral.

## Dependency graph

```mermaid
flowchart LR
  s1["1 · Scaffold skeleton"] -->|needs module structure + test harness to build into| s2["2 · Build the timer"]
```

## Execution path

| Wave | Steps | Zone per step (why parallel-safe) | Unlocks |
|:---:|---|---|---|
| 1 | 1 | whole repo (new) | 2 |
| 2 | 2 | `src/` (new) | — |

## Shipped

| Step | Shipped | Link |
|---|---|---|
| 1 · Scaffold skeleton | 2026-09-30 | `2730b76` |
| 2 · Build the timer | 2026-09-30 | `9251e83` |
| 2 · Dashboard UI polish (big-digit countdown, anti-scroll fix, non-TTY/narrow-terminal degradation, warm color shift) | 2026-09-30 | `686e7f3`, `de897ef`, `85444bb`, `e80e9d5` |
| 3 · Harden for distribution | 2026-10-01 | `f89a258` |
