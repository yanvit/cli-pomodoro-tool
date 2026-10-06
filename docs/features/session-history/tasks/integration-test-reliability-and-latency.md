---
id: T4
title: "Integration-test latency and full-cycle default-behavior guarantees"
layer: "tests"
deps: ["T3"]
blocks: []
acs: ["AC-01", "AC-02", "AC-03"]
files_hint: ["src/io/timer.test.ts", "src/history/record.test.ts"]
owner: "Vitalii"
estimate: "M"
context_budget: "M"
status: "todo"
---

# T4 — Integration-test latency and full-cycle default-behavior guarantees

## Place in the sequence

- **Blocked by:** T3 — Wire completed-phase recording into `io/timer.ts` (the real call site must exist to time it end-to-end). **Blocks:** none — this is a leaf task. **Wave:** 4, parallel with T5 (different files, no shared lane).
- **Lane:** own lane, shares no `files_hint` with T5.

## Why (user story)

> **As a** developer
> **I want** `pomodoro` to keep running normally even if the history file can't be written
> **So that** a logging problem (permissions, a missing directory, a full disk) never breaks my actual timer
>
> — `spec.md §4, US-06, verbatim` · full text: [spec.md](../spec.md)

T2's unit tests already prove `recordCompletedPhase` itself never throws; this task proves the *integrated* path (real temp-file I/O through the actual `io/timer.ts` call site, not a fake double) meets the NFR timing bound and that the zero-footprint default genuinely holds end-to-end.

## Inlined context

> | History-write added latency | ≤ 5ms added to the existing phase-transition write path, measured as real wall-clock time for the synchronous append (the countdown waits for this write — see AC-01/AC-03) | integration test timing the write call against a real temp-file write, not a fake double |
> | Write-failure isolation | 100% of simulated write failures leave the countdown running, unaffected | unit test simulating a failing write, asserting ticks continue uninterrupted |
>
> — `spec.md §6, NFR table rows 1–2, verbatim` · full text: [spec.md](../spec.md)

> **QG-4. History-write added latency** — **How verify:** integration test timing the write call against a real temp-file write, not a fake double.
>
> — `sad.md §10, QG-4, abridged` · full text: [sad.md](../sad.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md)) and follow it. Do not substitute a mocked `fs` for this task's latency assertion — the NFR explicitly requires "a real temp-file write, not a fake double."

## Data delta

No DB changes. This task only exercises the existing `CompletedPhaseRecord` write path (`data-model.md`) through real temp-file I/O; it does not alter the entity.

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-01 — happy path

> **Given** a developer has set the opt-in environment variable before running `pomodoro`
> **When** a work or break phase's countdown reaches zero naturally (including a deferred transition flushed on resume)
> **Then** the system synchronously appends one record for that completed phase to the developer's history — the append completes, or fails per AC-03, before the next phase's countdown begins — identifying exactly three things: which phase it was, which round, and an ISO-8601 UTC timestamp of when it completed; no additional fields
>
> — `spec.md §5, AC-01, verbatim` · full text: [spec.md](../spec.md)

### AC-02 — happy path

> **Given** a developer has not set the opt-in environment variable
> **When** they run `pomodoro` through a full work/break cycle
> **Then** no history file is created or written to, and `pomodoro`'s printed output and behavior are identical to a version of the tool with no session-history capability at all
>
> — `spec.md §5, AC-02, verbatim` · full text: [spec.md](../spec.md)

### AC-03 — error

> **Given** a developer has opted in
> **When** a phase completes and the system attempts to append a record
> **Then** the system first ensures the conventional per-user data location exists, creating it if absent, independently on every completed phase; only if the write still can't succeed after that (e.g. a permissions problem, a full disk) is the failure silently absorbed and the countdown continues normally — the developer's timer is never interrupted, delayed, or crashed by a history-write problem, and the next completed phase independently attempts its own write regardless of whether this one failed
>
> — `spec.md §5, AC-03, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Integration test (real temp dir, not mocked `fs`): run a fake-clock cycle with `POMODORO_HISTORY=1` and a redirected `HOME`/`XDG_DATA_HOME` pointing at a temp dir; measure wall-clock time of the write call; assert it adds ≤5ms (NFR row 1 / QG-4).
- [ ] Integration test: full fake-clock cycle with `POMODORO_HISTORY` unset; assert no file is created anywhere under the temp data dir, and stdout matches the pre-feature baseline byte-for-byte (AC-02).
- [ ] Integration test: point the resolved data dir at a path with no write permission (or a file where a directory is expected); run a full cycle; assert the countdown completes all ticks uninterrupted and no exception propagates (AC-03, QG-2).
- [ ] Run all three against the real `io/timer.ts` call site added in T3 — no fake double standing in for the write.

## Edge cases

| Case | Behaviour |
|---|---|
| Temp dir cleanup fails after a test run | Not this task's concern functionally, but tests must clean up their own temp dirs in an `afterEach` to avoid cross-test pollution. |
| CI environment has a slower disk than ≤5ms allows | Flag as a known CI-timing risk in the test comment, not a reason to loosen the assertion silently — the NFR number is `spec.md`'s own, not negotiable by this task. |

## Definition of Done

- [ ] All three integration tests pass locally.
- [ ] The latency assertion uses a real temp-file write, never a mocked `fs` call (NFR row 1's own constraint).
- [ ] lint + vet clean.
