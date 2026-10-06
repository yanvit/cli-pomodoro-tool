# Changelog — session-history

## session-history — opt-in, append-only record of completed pomodoros

**What:** Setting `POMODORO_HISTORY=1` before running `pomodoro` makes the tool append one line
to a JSON-lines history file every time a work or break phase's countdown reaches zero naturally.
Without that variable set, `pomodoro` behaves exactly as it always has — no file, no directory, no
behavioral or output difference.

**Why:** `pomodoro` previously kept no trace of a session once the process exited, so a developer
had no way to see how many pomodoros they'd actually completed. Session history was one of three
v1 exclusions deliberately reopened for v2 ([spec.md §1](spec.md), `docs/roadmap.md` §Decisions so
far). Persisting anything at all required revisiting the project's "no persistence" foundation —
tracked by [ADR-0001](adr/0001-introduce-a-new-history-module-called-directly-from-io.md), which
scopes the new `src/history/` module to a single direct call site (`io/timer.ts`) and keeps it an
isolated, append-only file writer rather than a datastore.

**How to use:**

```sh
POMODORO_HISTORY=1 pomodoro
```

Each completed phase appends one line like:

```json
{"phase":"work","round":1,"completedAt":"2026-10-06T15:05:26.211Z"}
```

to `history.jsonl` in the OS's conventional per-user data directory — `$XDG_DATA_HOME` or
`~/.local/share/pomodoro-timer/` on Linux, `~/Library/Application Support/pomodoro-timer/` on
macOS, `%LOCALAPPDATA%\pomodoro-timer\` on Windows (documented in `README.md`). Interrupted phases
(Ctrl+C, a signal, a crash) are never recorded. Write failures (permissions, full disk, an
unresolvable base directory) are absorbed silently — the timer itself is never interrupted or
crashed by a logging problem.

**Operational notes:**
- Migration: none — no schema, no database; a flat append-only file.
- Feature flag / config: the `POMODORO_HISTORY=1` environment variable is the only toggle; no CLI
  flag, no config file (consistent with the project's existing no-config-file convention).
- Rollback: unset `POMODORO_HISTORY` (or deploy a prior build) — no state migration needed; any
  existing `history.jsonl` is simply not appended to further, and can be deleted by the developer
  at any time since nothing in the tool reads it back.

**Acceptance criteria delivered:** AC-01 (happy-path capture, exactly 3 fields), AC-02 (zero
footprint when not opted in), AC-03 (write failures never interrupt the timer), AC-04 (interrupted
phases are never recorded), AC-05 (OS-conventional, non-cwd location on every platform branch),
AC-06 (only this invocation's own environment decides).
