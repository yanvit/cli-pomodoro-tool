---
id: T1
title: "Implement OS-conventional history-directory resolution"
layer: "infra"
deps: []
blocks: ["T2"]
acs: ["AC-05"]
files_hint: ["src/history/paths.ts", "src/history/paths.test.ts"]
owner: "Vitalii"
estimate: "S"
context_budget: "S"
status: "todo"
---

# T1 — Implement OS-conventional history-directory resolution

## Place in the sequence

- **Blocked by:** none — this is the first task, a pure function with no dependency on the writer. **Blocks:** T2 — Implement opt-in gate + isolated append-only writer. **Wave:** 1 (can start immediately, in parallel with nothing else this feature needs first).
- **Lane:** own lane — `src/history/paths.ts` is touched by no other task.

## Why (user story)

> **As a** developer
> **I want** my session history written to the same conventional location every time, on whichever OS I'm on
> **So that** I can point my own tools at it without guessing or configuring a path
>
> — `spec.md §4, US-04, verbatim` · full text: [spec.md](../spec.md)

This task delivers the path-resolution function that makes that location deterministic per OS — the one piece US-04 needs that nothing else in the feature depends on.

## Inlined context

> `history/paths.ts` — resolves the OS-conventional per-user data dir; pure function of `process.platform` + env (`XDG_DATA_HOME` / `HOME` / `LOCALAPPDATA`), paths already settled by `docs/roadmap.md`
>
> — `sad.md §5, Internal decomposition, verbatim` · full text: [sad.md](../sad.md)

> history is append-only JSONL at the OS's conventional data dir (`$XDG_DATA_HOME`/`~/.local/share/pomodoro-timer/` on Linux, `~/Library/Application Support/pomodoro-timer/` on macOS, `%LOCALAPPDATA%\pomodoro-timer\` on Windows — added during `sdd:clarify session-history`, 2026-10-06, to close a gap where AC-05 implied Windows support with no path settled) rather than a bare dotfile
>
> — `docs/roadmap.md §Decisions so far, "v2 scope reopened", abridged` · full text: [../../../roadmap.md](../../../roadmap.md)

> Zero new runtime dependencies (spec §6 NFR row 3) — forces hand-rolled OS-conventional path resolution (no `env-paths`-style package) and Node's built-in `fs.mkdirSync`/`fs.appendFileSync`, not a library.
>
> — `sad.md §2, Technical constraints, verbatim` · full text: [sad.md](../sad.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [roadmap.md](../../../roadmap.md)) and follow it. Do not guess the Windows path or invent a fourth OS branch.

## Data delta

No DB changes. This task resolves a filesystem *path*; it does not construct or write the `CompletedPhaseRecord` entity (`data-model.md`).

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-05 — cross-context

> **Given** a developer is running `pomodoro` with history enabled on a given operating system
> **When** a phase completes
> **Then** the record is written to that operating system's own conventional per-user data location — the same developer gets a consistent location on a given machine, and a different convention is honored on a different OS, with nothing for the developer to configure
>
> — `spec.md §5, AC-05, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Write `resolveHistoryDir(): string` in `src/history/paths.ts` — pure function of `process.platform` + `process.env`.
- [ ] Linux branch: `$XDG_DATA_HOME/pomodoro-timer` if `XDG_DATA_HOME` set, else `~/.local/share/pomodoro-timer`.
- [ ] macOS branch: `~/Library/Application Support/pomodoro-timer`.
- [ ] Windows branch: `%LOCALAPPDATA%\pomodoro-timer`.
- [ ] Unit tests in `src/history/paths.test.ts` covering all three `process.platform` values with controlled env vars (per `sad.md` QG-3's own verification method).

## Edge cases

| Case | Behaviour |
|---|---|
| `XDG_DATA_HOME` unset on Linux | Fall back to `~/.local/share/pomodoro-timer` — never throw, never return an empty path. |
| `LOCALAPPDATA` unset on Windows | Out of this task's contract — `paths.ts` assumes a standard Windows user profile; `record.ts` (T2) owns catching any resulting write failure. |
| An unrecognized `process.platform` (e.g. `freebsd`) | Not specified by AC-05 (only Linux/macOS/Windows are named) — fall back to the Linux branch rather than throwing, so T2's writer still has *some* path to try. |

## Definition of Done

- [ ] `src/history/paths.test.ts` passes, with all three `process.platform` branches covered (QG-3's own verification method, `sad.md §10`).
- [ ] `resolveHistoryDir()` is a pure function — no `fs` calls, no side effects.
- [ ] lint + vet clean.
