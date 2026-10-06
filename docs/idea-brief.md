---
status: Draft
owner: "Vitalii"
updated_at: "2026-09-30"
depth: "medium"
---

# Idea brief — cli-pomodoro-timer

## 1. Raw idea

"I want to create a Pomodoro timer that is running in a CLI. This interesting design will help me to stay focused on my current tasks."

## 2. Problem

Staying focused on a current task is hard without an external cadence forcing work/break boundaries. Existing phone or menu-bar Pomodoro apps live outside the terminal, which pulls attention away from where the work (and the person) already is.

## 3. Users

The owner, primarily, plus other developers who might informally try the tool (shared via a GitHub repo, not published as a package). Not aimed at a general/non-technical audience.

## 4. Why now

No incident or deadline — this is a personal productivity tool the owner wants to build for their own workflow. "It would be nice" is the honest trigger here.

## 5. Out of scope (v1)

These were the original v1 exclusions. **Session history/logging, configurable durations, and
pause/resume were reopened for v2** per `docs/roadmap.md` §Decisions so far ("v2 scope
reopened") — see that file's steps 4-6 — and are no longer out of scope; this section is kept
as the historical record of the v1 decision, not the current scope boundary.

- **Session history / logging** *(reopened for v2 — see `docs/features/session-history/spec.md`)* — no record of completed pomodoros was kept in v1; the tool didn't answer "how much did I focus today." Deliberately dropped to keep the first version minimal.
- **Task binding** — pomodoros are not tied to a specific task/label. Follows from dropping history.
- **Configurable durations** *(reopened for v2 — see `docs/roadmap.md` step 5)* — work/break lengths were fixed to the classic 25/5/15 cycle in v1; no flags, no config file. Chosen for zero-setup simplicity over flexibility.
- **Background/daemon mode** — the timer blocks the terminal tab it runs in; it does not detach or survive terminal close. Chosen for simplicity over being able to use the terminal while it runs.
- **OS system notifications** — alerts are a terminal bell + printed message only, not a native desktop notification. Chosen to keep the tool dependency-free and portable.
- **Pause/resume** *(reopened for v2 — see `docs/features/pause-resume/spec.md`)* — Ctrl+C exits the session immediately with no state saved in v1; there was no pause key.
- **Do-Not-Disturb / attention enforcement** — **confirmed permanent** via D1 in `docs/roadmap.md` §Decisions so far, not a v1-only deferral. The tool does not suppress other apps' notifications during a work session; it only tracks time and alerts at transitions.

## 6. Risks

- **Weakest spot: no accountability mechanism.** The tool is a timer with a bell, not an attention guard — nothing stops the owner from ignoring the alert, working through it, or abandoning a session early. The actual "stay focused" outcome still depends on the owner's discipline outside the tool, not on anything the tool enforces.
- **Assumes the alert will be noticed.** A terminal bell + printed line is easy to miss if the owner isn't looking at or listening near that terminal tab; false if the owner is, e.g., wearing headphones with bell/visual-bell disabled, or has stepped away.
- **Assumes one dedicated terminal tab is acceptable.** Blocking design means that tab can't be reused for other work until the cycle ends; false if the owner's actual workflow needs that terminal for something else mid-session.

## 7. Recommendation

Build the minimal version: a single blocking CLI command running the fixed classic Pomodoro cycle (25 min work / 5 min short break / 15 min long break every 4th cycle), alerting via terminal bell + printed message at each transition, with Ctrl+C exiting immediately and cleanly. No history, no config, no background mode, no DND integration. This is the fastest path to something usable, it's consistent with every tradeoff made during the interview (simplicity chosen over flexibility, portability, and multitasking at every turn), and it can be shared informally with other developers as-is. A real focus-enforcement mechanism (e.g., toggling OS Do Not Disturb during work sessions) was considered and explicitly deferred — it targets the stated goal more directly than a bare timer, but it's a second version, not the first.

## 8. Open questions

- Should a later version add OS Do Not Disturb toggling during work sessions to actually enforce focus, not just track time? — owner, revisit after v1 ships.
- If shared informally with other devs, does the blocking/no-config design hold up on Windows terminals (ANSI bell support varies), or does that need a fallback? — owner, revisit before sharing beyond macOS/Linux.
