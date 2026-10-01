---
status: Draft
owner: "Vitalii"
reviewers: ["Vitalii"]
updated_at: "2026-10-01"
feature_size: "S"
---

# Spec — pause-resume

> **Glossary:** [CONTEXT](../../../CONTEXT.md)
> **Reference module / docs / channels used:** None — only the interview + CONTEXT + `docs/architecture-map.md` + `docs/roadmap.md`.

## 1. Context

`pomodoro` runs a fixed 25/5/15 work/break cycle with no pause — if a developer (CONTEXT glossary) running it is pulled away mid-phase (a call, a colleague, the doorbell), the countdown keeps running, the phase-transition bell can fire while they're away, and when they return the tool has already moved on to the next phase without them. There is currently no way to freeze progress and resume exactly where it was left off.

v1 shipped and was hardened for distribution (`docs/roadmap.md` step 3). The owner then deliberately reopened three of v1's original exclusions for a v2 via a grilling session, naming pause/resume as the first and most self-contained of the three to land (`docs/roadmap.md` §Decisions so far).

The committed approach: bind the spacebar to toggle pause/resume in the dashboard and compact render modes. While paused, the countdown and phase transitions freeze and a clear "PAUSED" indicator is shown; Ctrl+C still exits immediately and cleanly whether the session is paused or running.

Grounding for this approach: competitive research confirms spacebar + indefinite (non-time-limited) pause is the settled convention among comparable CLI pomodoro timers, so the keybinding and no-timeout choices are low-risk — but no competitor clearly documents that the phase-transition alert itself is suppressed during a pause, which is the differentiator this spec locks in as a hard guarantee rather than leaving it as an implementation detail. A failure-mode review of the naive implementation (capturing every keystroke directly) found it would silently break the existing Ctrl+C/SIGINT guarantee, crash on startup whenever stdin isn't a TTY, and risk leaving a developer's shell in raw mode after an external kill signal — all three are folded into §5 below as mandatory acceptance criteria, not left as an implementation risk to discover later. The feature is implemented with zero new runtime dependencies, consistent with this project's existing convention (tracked numerically in §6 NFR and §7 KPI).

**Decision amendment (critic finding, resolved with the owner):** the roadmap's "byte-for-byte identical / opt-in" commitment (`docs/roadmap.md` §Decisions so far) is read here as applying to bare `pomodoro`'s default **output** — no new flags required, no new printed behavior when spacebar is never pressed. It does not extend to the terminal's input-capture mode: enabling keystroke capture by default is a deliberate, scoped exception, not a silent violation. Its real costs are already named explicitly rather than hidden — §3 accepts that it swallows other keystrokes (stray-keystroke non-goal), and §5 AC-07 mandates that Ctrl+C must still be hand-detected and must still exit exactly as before.

## 2. Goals

- A developer interrupted mid-phase can freeze the countdown and resume later with zero lost phase time and no missed or false bell alerts.
- The existing Ctrl+C clean-exit guarantee (`docs/architecture-map.md` Conventions) holds identically whether or not a session is currently paused.

## 3. Non-goals

- Restoring the terminal's input mode *while actively suspended* (the window between Ctrl+Z and `fg` — the process has not exited, only paused at the OS level) and re-arming pause/resume's keystroke capture afterward — accepted limitation; the terminal may stay in its special input mode for that window, and spacebar may stop toggling pause once foregrounded, until the process is restarted. Reason: fixing it needs additional signal-handling disproportionate to an S-sized feature; accepted as a known limitation per the owner's review, same posture as the D1 decision. (Distinct from §5 AC-06, which covers the process actually *exiting* via a terminate or similar — that is a correctness floor, not excluded here; US-06's "after the timer exits" never claimed to cover a mid-session suspend, only termination.)
- Repainting a stale frame after a terminal resize that happens while paused — accepted limitation; the tool has no terminal-resize handling today and this feature doesn't add one. Reason: fixing resize handling tool-wide is a separate, pre-existing concern, not something pause/resume introduces.
- Guarding against an accidental pause triggered by a stray keystroke or a pasted block of text containing a space — accepted; any single-key toggle has this tradeoff. Reason: self-correcting (pressing space again un-pauses), and adding confirmation UX would contradict the tool's zero-friction philosophy.
- Auto-resuming a paused session after a timeout — explicitly not built. Reason: indefinite pause is a deliberate choice, consistent with this tool's "track time, don't enforce it" posture already established by the D1 decision (`docs/roadmap.md` §Decisions so far).

## 4. User stories

### US-01: Pause an interrupted session

**As a** developer
**I want** to pause the countdown mid-phase
**So that** I don't lose track of where I was when I get pulled away

### US-02: Resume a paused session

**As a** developer
**I want** to resume a paused countdown from exactly where it left off
**So that** the interruption doesn't cost me any of the phase's remaining time

### US-03: Stay silent while paused

**As a** developer
**I want** no phase-transition bell to fire while I'm paused
**So that** I'm not alerted about a transition I wasn't present for

### US-04: See an unambiguous paused state

**As a** developer
**I want** a clear "PAUSED" indicator while paused
**So that** I don't mistake a frozen screen for one that's still counting down

### US-05: Exit cleanly even while paused

**As a** developer
**I want** Ctrl+C to still exit immediately and cleanly while paused
**So that** I'm never stuck with no way to quit

### US-06: Keep my terminal usable no matter how the timer ends

**As a** developer
**I want** my terminal's input mode restored to normal after the timer exits for any reason, and pause/resume to respond only to my own keystrokes
**So that** this feature can never leave my shell broken or be triggered by something other than me

### US-07: Keep piped/non-interactive use working

**As a** developer
**I want** `pomodoro` to still run normally when stdin isn't a terminal (e.g. redirected or piped input)
**So that** scripted or redirected invocations don't crash just because pause/resume exists

## 5. Acceptance criteria

### AC-01 (US-01) — happy path

**Given** a developer is running `pomodoro` in dashboard or compact mode, mid-phase
**When** the developer presses spacebar
**Then** the countdown freezes at its current remaining time and the display shows a clear "PAUSED" indicator

### AC-02 (US-02) — happy path

**Given** a developer has a paused session showing "PAUSED" with some remaining time
**When** the developer presses spacebar again
**Then** the countdown resumes counting down from exactly the remaining time it was paused at — preserved exactly, never rounded up — so no number of pause/resume cycles can ever grow a phase beyond its nominal duration, and the "PAUSED" indicator clears

### AC-03 (US-07) — error (environment lacks the capability)

**Given** a developer invokes `pomodoro` in an environment that cannot support keystroke capture — including, but not limited to, stdin not being a terminal, or any other failure to enable it
**When** the process starts
**Then** the countdown starts normally — the render mode (dashboard/compact/plain) is chosen exactly as it already is today, unaffected by this — and pause/resume simply isn't available; any such failure degrades gracefully to this same no-pause path rather than crashing or exiting early. This is also always the case whenever the render mode itself is plain, even if stdin happens to be a terminal — pause/resume is scoped to dashboard and compact mode only, per §1.

### AC-04 (US-06) — authorization (who/what may trigger pause)

**Given** a developer is running `pomodoro` interactively in their own terminal
**When** anything other than a keystroke read from that process's own stdin occurs (e.g. another process, an unrelated terminal, or a signal that is not a keypress) — or the developer types something other than spacebar
**Then** the pause/resume state is not affected — only the spacebar, read from this process's own stdin, can toggle it — and no keystroke, pause-triggering or not, is ever echoed to the screen; the display stays exactly as it was until the next scheduled redraw

### AC-05 (US-03, US-04) — domain invariant

**Given** a developer's session is paused, at any point in the countdown including the instant a phase would otherwise have ended
**When** any amount of real time elapses while paused
**Then** no phase transition occurs and no bell sounds for as long as the session stays paused — "no phase transition while paused" holds regardless of timing, and the display continues showing "PAUSED" against the phase and remaining time captured at the moment of pausing. If the remaining time had reached zero while paused, the deferred transition (and its bell) fires immediately at the moment of resume, before the next countdown begins — paused time is frozen, never banked as extra time in the phase that was ending.

### AC-06 (US-06) — cross-context (internal pause state vs. the OS process-lifecycle context)

**Given** a developer's `pomodoro` process is running, paused or not, with the terminal in its special input-reading mode
**When** the process exits by any path it can actually detect and react to — a normal Ctrl+C keypress, a terminate signal, a closed terminal/hung-up session, normal completion, or an unhandled internal error
**Then** the owning shell's terminal input mode is always restored to what it was before `pomodoro` started. (Out of reach by construction, not by choice: a path no process can intercept — an unconditional kill signal, or the whole process group being torn down at once — cannot run any cleanup code, in this tool or any other; §6/§7's "100% of exit paths" is scoped to the detectable paths listed above.)

### AC-07 (US-05) — happy path (existing guarantee preserved)

**Given** a developer's session is paused
**When** the developer presses Ctrl+C
**Then** the process exits immediately and cleanly, identically to how Ctrl+C already behaves on an unpaused session

### AC-08 (US-04) — happy path

**Given** a developer's session is paused
**When** the display repaints on the keypress that paused it
**Then** the "PAUSED" indicator is visible in both the dashboard and the compact render modes (not only one of them)

## 6. Non-functional requirements

| Aspect | Target | Measurement |
|---|---|---|
| Pause/resume visual responsiveness | The display repaints once, immediately, on the triggering keypress — not on a periodic interval while paused (consistent with §3's accepted resize-staleness limitation, which only holds if nothing repaints while paused) | a thin `io` smoke test asserting the PAUSED marker appears in the write triggered by the pause keypress, and clears in the write triggered by the resume keypress |
| Paused-time accuracy | Time spent paused is never counted against the remaining phase duration — the remaining time is preserved exactly (not rounded), so no number of pause/resume cycles can grow a phase beyond its nominal duration | unit test in `io` with a fake timer (pausing withholds the tick entirely, so the existing `core` state machine needs no change — this feature stays inside `src/io/`, matching its declared roadmap zone) |
| Terminal-restoration reliability | 100% of the exit paths AC-06 is accountable for (Ctrl+C keypress, terminate signal, hang-up, normal completion, unhandled error — not an unconditional kill signal, which no process can intercept) leave the terminal's input mode exactly as it was before `pomodoro` started | tests covering each exit path from AC-06 |
| Dependency footprint | 0 new runtime dependencies added | `package.json` `dependencies` stays absent/empty |

## 6.1 Security / privacy

- **Data classification:** N/A — this feature creates, stores, or transmits no data.
- **Personal data touched:** None.
- **AuthZ/AuthN impact:** None — no identity, accounts, or permission checks exist in this tool. AC-04's "authorization" coverage is about which physical input channel (this process's own stdin) may trigger pause, not an identity-based access boundary.
- **Abuse cases:**
  - A stray keystroke or pasted text containing a space accidentally pauses the session: business response — self-correcting, pressing space again resumes; no data or state is at risk (also tracked as an accepted non-goal in §3).
  - The process is killed by an external signal while paused: business response — explicitly prevented from corrupting the terminal by AC-06; the shell is always left usable.
  - A non-interactive/piped invocation attempts to use pause: business response — safely ignored per AC-03; the tool runs in its normal degraded mode instead of crashing.
- **Security review:** N/A — no new data, no new permission boundary, no network surface; purely local terminal I/O within a single process.

## 7. Metrics / KPIs

- **Terminal left in a broken state after any exit path** — baseline: N/A (feature doesn't exist yet), target: 0% across the exit-path tests in AC-06, maintained indefinitely (regression-checked by the test suite, not telemetry — this tool collects none).
- **Ctrl+C responsiveness while paused** — baseline: N/A, target: 100% of Ctrl+C presses exit within one tick interval (≤1s) of the keypress, verified by test.
- **New runtime dependencies added by this feature** — baseline: 0 (current project state), target: remains 0.

## 8. Open questions

- [x] Should any of the three accepted-risk non-goals (§3: Ctrl+Z/SIGTSTP re-arming, resize-during-pause stale frame, stray-keystroke pause) get a dedicated follow-up fix in a later pass, or stay permanently accepted like the D1 decision? Resolved at `sdd:review` (2026-10-01), owner Vitalii: accepted, no fix planned — the default stands; none of the review's findings touched these three non-goals.
- [x] Exact visual treatment of the "PAUSED" indicator — resolved in `sad.md` §5: reuses `phaseColor.ts` as-is (no new color), appended to the dashboard header line and prepended to the compact line.
- [x] Whether pause/resume means anything beyond a single running process — resolved in `sad.md` §4: `target_surfaces: [cli]`, single existing surface, no multi-process/daemon topology introduced.
