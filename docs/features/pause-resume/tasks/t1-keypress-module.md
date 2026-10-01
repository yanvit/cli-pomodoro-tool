---
id: T1
title: "Build src/io/keypress.ts: capability-gated keystroke capture"
layer: "app"
deps: []
blocks: ["T2", "T3"]
acs: ["AC-03", "AC-04"]
files_hint: ["src/io/keypress.ts", "src/io/keypress.test.ts"]
owner: "Vitalii"
estimate: "M"
context_budget: "M"
status: "todo"
---

# T1 — Build src/io/keypress.ts: capability-gated keystroke capture

## Place in the sequence

- **Blocked by:** none — first task. **Blocks:** T2 — wire pause/resume state, T3 — wire exit-path handling. **Wave:** 1 (foundation every other task consumes).
- **Lane:** own lane — the only task touching `src/io/keypress.ts`.

## Why (user story)

> **As a** developer
> **I want** `pomodoro` to still run normally when stdin isn't a terminal (e.g. redirected or piped input)
> **So that** scripted or redirected invocations don't crash just because pause/resume exists
>
> — `spec.md §4, US-07, verbatim` · full text: [spec.md](../spec.md)

This task builds the module that makes that guarantee possible: it owns capability detection, so every other task can assume keystroke events either exist or don't — never a crash.

## Inlined context

> A failure-mode review of the naive implementation (capturing every keystroke directly) found it would silently break the existing Ctrl+C/SIGINT guarantee, crash on startup whenever stdin isn't a TTY, and risk leaving a developer's shell in raw mode after an external kill signal — all three are folded into §5 below as mandatory acceptance criteria, not left as an implementation risk to discover later.
>
> — `spec.md §1, ¶3, verbatim` · full text: [spec.md](../spec.md)

> **Keystroke capture via a new, focused `io/keypress.ts` module** — follows the existing pattern of small single-purpose helpers already in `src/io/` (`render.ts`, `renderMode.ts`, `compactLine.ts`, `phaseColor.ts`) rather than growing `timer.ts` (already the project's largest file) further.
>
> — `sad.md §4, item 3, verbatim` · full text: [sad.md](../sad.md)

> `keypress.ts` — new — wraps `node:readline` `emitKeypressEvents` + `setRawMode`; emits `"toggle-pause"` / `"sigint"` events; owns raw-mode enable/restore and the capability-detection fallback (spec AC-03)
>
> — `sad.md §5, Internal decomposition, verbatim` · full text: [sad.md](../sad.md)

> **Hard rule — zero new runtime dependencies:** `node:readline`'s `emitKeypressEvents(process.stdin)` combined with `process.stdin.setRawMode(true)` is the standard, dependency-free Node.js idiom for per-keystroke stdin input (incl. spacebar) in a TTY, unchanged through Node 18+.
>
> — `docs/roadmap.md §Decisions so far, v2 scope reopened, abridged` · full text: [docs/roadmap.md](../../../roadmap.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full
([spec.md](../spec.md) · [sad.md](../sad.md) · [adr/0001-confine-pause-state-to-io.md](../adr/0001-confine-pause-state-to-io.md)) and follow it. Do not guess.

## Data delta

No DB changes.

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-03 — error (environment lacks the capability)

> **Given** a developer invokes `pomodoro` in an environment that cannot support keystroke capture — including, but not limited to, stdin not being a terminal, or any other failure to enable it
> **When** the process starts
> **Then** the countdown starts normally — the render mode (dashboard/compact/plain) is chosen exactly as it already is today, unaffected by this — and pause/resume simply isn't available; any such failure degrades gracefully to this same no-pause path rather than crashing or exiting early. This is also always the case whenever the render mode itself is plain, even if stdin happens to be a terminal — pause/resume is scoped to dashboard and compact mode only, per §1.
>
> — `spec.md §5, AC-03, verbatim` · full text: [spec.md](../spec.md)

### AC-04 — authorization (who/what may trigger pause)

> **Given** a developer is running `pomodoro` interactively in their own terminal
> **When** anything other than a keystroke read from that process's own stdin occurs (e.g. another process, an unrelated terminal, or a signal that is not a keypress) — or the developer types something other than spacebar
> **Then** the pause/resume state is not affected — only the spacebar, read from this process's own stdin, can toggle it — and no keystroke, pause-triggering or not, is ever echoed to the screen; the display stays exactly as it was until the next scheduled redraw
>
> — `spec.md §5, AC-04, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `src/io/keypress.ts`: export a function (e.g. `startKeypressCapture(onTogglePause, onSigint): { stop(): void }` or an `EventEmitter`-based equivalent) that attempts `emitKeypressEvents(process.stdin)` + `process.stdin.setRawMode(true)` inside a `try/catch` — `src/io/keypress.ts`
- [ ] On any capture-enable failure (including `process.stdin.setRawMode` not being a function, which is what happens on a non-TTY stdin), return a no-op handle — never throw — `src/io/keypress.ts`
- [ ] On a successful `keypress` event: if the key is spacebar, call `onTogglePause()`; if it's Ctrl+C (`{ctrl: true, name: 'c'}`), call `onSigint()`; anything else is read and discarded with no further effect — `src/io/keypress.ts`
- [ ] Ensure raw mode produces no terminal echo for any keystroke (Node's raw mode already suppresses local echo by default — verify this holds, don't add a second suppression layer) — `src/io/keypress.ts`
- [ ] Expose a `restore()`/`stop()` method that disables raw mode and removes the `keypress` listener, idempotent (safe to call twice) — `src/io/keypress.ts`
- [ ] Unit tests: capability-detection failure path returns a no-op handle and doesn't throw; a spacebar keypress event calls `onTogglePause`; a Ctrl+C keypress event calls `onSigint`; any other key calls neither — `src/io/keypress.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| `process.stdin.setRawMode` is `undefined` (non-TTY stdin) | Capability detection fails gracefully; returns a no-op handle, no throw (AC-03) |
| `setRawMode` throws for any other reason (e.g. a pseudo-TTY that rejects the mode switch) | Same graceful no-op fallback — the `try/catch` must not be narrowed to only the `undefined` case (AC-03) |
| A key other than spacebar or Ctrl+C is pressed | Read and discarded; no callback fires, no echo (AC-04) |
| A multi-character paste containing a space | Each character arrives as its own `keypress` event under raw mode; only the space character(s) trigger `onTogglePause` — out of this task's scope to prevent (spec §3 accepted non-goal), but must not throw or echo |

## Definition of Done

- [ ] Unit tests in `src/io/keypress.test.ts` pass, covering the capability-failure fallback and both recognized keys
- [ ] `npm run build` and `npm test` pass
- [ ] every Hard Rule inlined above still holds (zero new runtime dependencies — `package.json` `dependencies` stays absent/empty)
- [ ] lint + vet clean
