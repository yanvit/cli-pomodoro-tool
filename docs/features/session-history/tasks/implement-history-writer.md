---
id: T2
title: "Implement opt-in gate + isolated append-only writer"
layer: "infra"
deps: ["T1"]
blocks: ["T3"]
acs: ["AC-01", "AC-03", "AC-06"]
files_hint: ["src/history/record.ts", "src/history/record.test.ts"]
owner: "Vitalii"
estimate: "M"
context_budget: "M"
status: "todo"
---

# T2 — Implement opt-in gate + isolated append-only writer

## Place in the sequence

- **Blocked by:** T1 — Implement OS-conventional history-directory resolution (`resolveHistoryDir()` is this task's only collaborator). **Blocks:** T3 — Wire completed-phase recording into `io/timer.ts`. **Wave:** 2.
- **Lane:** own lane — `src/history/record.ts` is touched by no other task; it only *calls* `paths.ts` from T1.

## Why (user story)

> **As a** developer
> **I want** `pomodoro` to keep running normally even if the history file can't be written
> **So that** a logging problem (permissions, a missing directory, a full disk) never breaks my actual timer
>
> — `spec.md §4, US-06, verbatim` · full text: [spec.md](../spec.md)

This task delivers the writer whose entire contract is never letting a filesystem failure escape — the opt-in check and the record shape ride along in the same module because both are cheap, pure gates in front of the one risky operation (the write).

## Inlined context

> `history/record.ts` — `isHistoryEnabled()` reads `POMODORO_HISTORY` once; `recordCompletedPhase(completedPhase, completedRound)` ensures the dir exists (`mkdirSync`, independently every call) and appends one JSON line `{phase: completedPhase, round: completedRound, completedAt}`; both the mkdir and the append are independently try/catch'd — any failure is silently absorbed, never thrown (AC-03)
>
> — `sad.md §5, Internal decomposition, verbatim` · full text: [sad.md](../sad.md)

> **Opt-in toggle: `POMODORO_HISTORY=1`, exact-match, read fresh from `process.env` on each completed phase** — ... Unset, empty, or any value other than the literal `1` leaves history off (AC-06). Write-failure handling stays fully silent, no trace, ever.
>
> — `sad.md §4, item 4, abridged` · full text: [sad.md](../sad.md)

> **Write mechanism: synchronous `fs.mkdirSync`(recursive) + `fs.appendFileSync`, each independently wrapped in try/catch** — forced by spec §6 NFR's "0 new runtime dependencies" ... and AC-01's "the append completes... before the next phase's countdown begins" (rules out an async/fire-and-forget write).
>
> — `sad.md §4, item 3, abridged` · full text: [sad.md](../sad.md)

> **Hard rule:** failures are isolated and never surface as an error — a write-failure path accidentally crashing the tool or leaking an internal error to the developer is explicitly prevented by AC-03.
>
> — `spec.md §6.1, Abuse cases, abridged` · full text: [spec.md](../spec.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md)) and follow it. Do not add a retry, a queue, or any trace of a failed write — the spec's §8 default (confirmed in `sad.md §4` item 4) is fully silent, forever.

## Data delta

| Field | Type | Constraints | Change |
|---|---|---|---|
| `phase` | string | one of `work` / `short_break` / `long_break` | constructed, not persisted in a DB — written as a JSON-line field |
| `round` | integer | ≥ 1 | constructed, written as a JSON-line field |
| `completedAt` | string | ISO-8601, UTC | constructed at append time, written as a JSON-line field |

— `data-model.md §Entities, table CompletedPhaseRecord, abridged` · full text: [data-model.md](../data-model.md)

No SQL schema — `data-model.md` is explicit this entity has no migration, no PK, no FK; `recordCompletedPhase` constructs the object directly.

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-01 — happy path

> **Given** a developer has set the opt-in environment variable before running `pomodoro`
> **When** a work or break phase's countdown reaches zero naturally (including a deferred transition flushed on resume)
> **Then** the system synchronously appends one record for that completed phase to the developer's history — the append completes, or fails per AC-03, before the next phase's countdown begins — identifying exactly three things: which phase it was, which round, and an ISO-8601 UTC timestamp of when it completed; no additional fields
>
> — `spec.md §5, AC-01, verbatim` · full text: [spec.md](../spec.md)

### AC-03 — error

> **Given** a developer has opted in
> **When** a phase completes and the system attempts to append a record
> **Then** the system first ensures the conventional per-user data location exists, creating it if absent, independently on every completed phase; only if the write still can't succeed after that (e.g. a permissions problem, a full disk) is the failure silently absorbed and the countdown continues normally — the developer's timer is never interrupted, delayed, or crashed by a history-write problem, and the next completed phase independently attempts its own write regardless of whether this one failed
>
> — `spec.md §5, AC-03, verbatim` · full text: [spec.md](../spec.md)

### AC-06 — authorization

> **Given** a developer has not set the opt-in environment variable in their own shell session
> **When** they run `pomodoro`
> **Then** only the environment this specific invocation reads at its own startup decides whether history is written for it — no history is written for this run
>
> — `spec.md §5, AC-06, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `isHistoryEnabled(): boolean` in `src/history/record.ts` — reads `process.env.POMODORO_HISTORY` fresh on each call, returns true iff it is exactly the string `"1"`; no startup-time caching.
- [ ] `recordCompletedPhase(completedPhase: Phase, completedRound: number): void` — no-ops immediately if `isHistoryEnabled()` is false (AC-06/AC-02's no-op half lives here).
- [ ] Inside: call `resolveHistoryDir()` (T1), `fs.mkdirSync(dir, { recursive: true })` wrapped in its own try/catch — on throw, return silently (AC-03).
- [ ] Then `fs.appendFileSync(path, JSON.stringify({ phase: completedPhase, round: completedRound, completedAt: new Date().toISOString() }) + "\n")` wrapped in its own try/catch — on throw, return silently (AC-03).
- [ ] Unit tests in `src/history/record.test.ts`: opted-in happy path writes exactly one line with the three fields; opted-out no-ops (no `fs` call at all); simulated `mkdirSync` failure and simulated `appendFileSync` failure both leave the function returning normally (QG-2's own verification method, `sad.md §10`).

## Edge cases

| Case | Behaviour |
|---|---|
| `POMODORO_HISTORY=0` or any value other than `"1"` | Treated as opted-out — no dir created, no file touched (AC-06). |
| Directory already exists | `mkdirSync({ recursive: true })` is idempotent — no error, write proceeds. |
| `mkdirSync` throws (permissions, full disk) | Caught locally; function returns; no record attempted this call (AC-03). |
| `appendFileSync` throws after a successful `mkdirSync` | Caught locally; function returns; no exception escapes to the caller (AC-03). |
| Two phases complete back-to-back, the first write failed | The second call independently re-attempts both `mkdirSync` and `appendFileSync` — no shared "give up" state (AC-03, verbatim: "the next completed phase independently attempts its own write regardless of whether this one failed"). |

## Definition of Done

- [ ] `src/history/record.test.ts` passes: happy path, opt-out no-op, and both failure-isolation cases (AC-01, AC-03, AC-06).
- [ ] No exception from `recordCompletedPhase` is observable to its caller under any simulated failure.
- [ ] every Hard Rule inlined above still holds — no trace of a failed write is ever surfaced.
- [ ] lint + vet clean.
