---
id: T3
title: "Wire exit-path handling into src/io/timer.ts (keypress Ctrl+C + signals)"
layer: "app"
deps: ["T1"]
blocks: ["T6"]
acs: ["AC-06", "AC-07"]
files_hint: ["src/io/timer.ts", "src/io/timer.test.ts"]
owner: "Vitalii"
estimate: "M"
context_budget: "M"
status: "todo"
---

# T3 — Wire exit-path handling into src/io/timer.ts (keypress Ctrl+C + signals)

## Place in the sequence

- **Blocked by:** T1 — Build src/io/keypress.ts. **Blocks:** T6 — docs update. **Wave:** 2.
- **Lane:** shares `src/io/timer.ts` with T2 — serialized with it (same file, both depend only on T1, not on each other).

## Why (user story)

> **As a** developer
> **I want** Ctrl+C to still exit immediately and cleanly while paused
> **So that** I'm never stuck with no way to quit
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)

> **As a** developer
> **I want** my terminal's input mode restored to normal after the timer exits for any reason, and pause/resume to respond only to my own keystrokes
> **So that** this feature can never leave my shell broken or be triggered by something other than me
>
> — `spec.md §4, US-06, verbatim` · full text: [spec.md](../spec.md)

This task is the one that prevents the single worst failure mode this feature could introduce: a corrupted shell. Raw mode disables the terminal's native SIGINT delivery, so Ctrl+C has to be hand-wired from the keypress stream, and every other way the process can end has to run the same terminal-restoring cleanup.

## Inlined context

> **Signal handling is an explicit, enumerated set, not "catch everything"** — `SIGINT` (keypress-detected, since raw mode disables the OS's native SIGINT delivery), `SIGTERM`, `SIGHUP`, normal completion, and unhandled-error paths are covered; `SIGKILL` and process-group teardown are explicitly out of reach by construction (spec AC-06) — no process can intercept them, so there is no legitimate alternative to exclude them.
>
> — `sad.md §4, item 4, verbatim` · full text: [sad.md](../sad.md)

> One idempotent `cleanup()` restores raw-mode/alt-screen/cursor state, invoked from every exit path above — extends the existing `cleanedUp` guard pattern already in `timer.ts`.
>
> — `sad.md §8, Terminal-state management row, verbatim` · full text: [sad.md](../sad.md)

> ```
> alt Ctrl+C keypress
>     Developer->>io: presses Ctrl+C
> else terminate signal
>     io->>io: receives a terminate signal
> else hang-up — terminal closed
>     io->>io: receives a hang-up signal
> else normal completion
>     io->>io: all rounds complete
> else unhandled internal error
>     io->>io: an uncaught exception occurs
> end
> io->>io: run cleanup() — the same idempotent terminal-restoration path every time
> io->>Developer: process exits, shell usable
> Note over io: An unconditional kill signal or a whole-process-group teardown cannot run this cleanup — no process can intercept them. Out of reach by construction, not a gap (AC-06).
> ```
>
> — `sad.md §6, "Terminal restored across every detectable exit path" (Critical flow 4), verbatim` · full text: [sad.md](../sad.md)

**Existing code this task extends** (already in the repo, not written by this task):

> ```
> function cleanup(): void {
>   if (cleanedUp) return;
>   cleanedUp = true;
>   if (mode === "dashboard") {
>     process.stdout.write(SHOW_CURSOR + EXIT_ALT_SCREEN);
>   } else if (mode === "compact") {
>     process.stdout.write(SHOW_CURSOR + "\n");
>   }
> }
> process.on("exit", cleanup);
> ...
> process.on("SIGINT", () => {
>   clearInterval(interval);
>   process.exit(0);
> });
> ```
>
> — `src/io/timer.ts, current startTimer() implementation, verbatim` · full text: [src/io/timer.ts](../../../../src/io/timer.ts)

**Fallback:** insufficient or contradicted by the code → read the named file in full
([spec.md](../spec.md) · [sad.md](../sad.md) · [adr/0001-confine-pause-state-to-io.md](../adr/0001-confine-pause-state-to-io.md) · [src/io/timer.ts](../../../../src/io/timer.ts)) and follow it. Do not guess.

## Data delta

No DB changes.

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-06 — cross-context (internal pause state vs. the OS process-lifecycle context)

> **Given** a developer's `pomodoro` process is running, paused or not, with the terminal in its special input-reading mode
> **When** the process exits by any path it can actually detect and react to — a normal Ctrl+C keypress, a terminate signal, a closed terminal/hung-up session, normal completion, or an unhandled internal error
> **Then** the owning shell's terminal input mode is always restored to what it was before `pomodoro` started. (Out of reach by construction, not by choice: a path no process can intercept — an unconditional kill signal, or the whole process group being torn down at once — cannot run any cleanup code, in this tool or any other; §6/§7's "100% of exit paths" is scoped to the detectable paths listed above.)
>
> — `spec.md §5, AC-06, verbatim` · full text: [spec.md](../spec.md)

### AC-07 — happy path (existing guarantee preserved)

> **Given** a developer's session is paused
> **When** the developer presses Ctrl+C
> **Then** the process exits immediately and cleanly, identically to how Ctrl+C already behaves on an unpaused session
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Wire `keypress.ts`'s (T1) `onSigint` callback to run the same exit path the existing `process.on("SIGINT", ...)` handler runs today (`clearInterval(interval); process.exit(0)`) — this is now the *only* way Ctrl+C is detected once raw mode is active, since raw mode disables the OS's native SIGINT delivery — `src/io/timer.ts`
- [ ] Extend `cleanup()` to also call `keypress.ts`'s `restore()`/`stop()` (disabling raw mode), guarded by the same `cleanedUp` flag so it stays idempotent — `src/io/timer.ts`
- [ ] Add `process.on("SIGTERM", ...)` and `process.on("SIGHUP", ...)` handlers that call `process.exit(0)` (triggering the existing `process.on("exit", cleanup)` path) — neither handler exists today — `src/io/timer.ts`
- [ ] Confirm the existing `process.on("exit", cleanup)` registration already covers normal completion and uncaught exceptions (Node runs `exit` listeners on both) — add a note if an uncaught-exception path needs an explicit `process.on("uncaughtException", ...)` to call `process.exit()` first (Node does not auto-exit on every uncaught exception depending on version/config) — `src/io/timer.ts`
- [ ] Do **not** attempt to handle `SIGKILL` or process-group teardown — explicitly out of scope per AC-06 — `src/io/timer.ts`
- [ ] Unit tests: simulate each of Ctrl+C-via-keypress, `SIGTERM`, `SIGHUP`, and normal completion; assert `cleanup()` (and therefore `keypress.ts`'s `restore()`) runs exactly once per exit, even if a signal fires while already exiting — `src/io/timer.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| Ctrl+C pressed while paused | Exits immediately and cleanly, identical to unpaused Ctrl+C (AC-07) — handled via `onSigint`, independent of the `paused` flag from T2 |
| `SIGTERM`/`SIGHUP` arrives while paused | Same `cleanup()` path runs regardless of `paused` state — terminal is restored either way (AC-06) |
| Two exit signals arrive in quick succession (e.g. `SIGTERM` then Ctrl+C before the process has fully exited) | `cleanedUp` guard ensures `cleanup()`'s terminal-restoration code runs only once |
| `SIGKILL` / process-group teardown | Explicitly not handled — no process can intercept it (AC-06); not a gap, not a target for this task |

## Definition of Done

- [ ] Unit tests in `src/io/timer.test.ts` pass, covering Ctrl+C-via-keypress, `SIGTERM`, `SIGHUP`, and the idempotent-cleanup guarantee
- [ ] `npm run build` and `npm test` pass
- [ ] every Hard Rule inlined above still holds (no handling attempted for `SIGKILL`/process-group teardown)
- [ ] lint + vet clean
