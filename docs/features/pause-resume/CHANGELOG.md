# Changelog — pause-resume

## pause-resume — spacebar pause/resume for the countdown

**What:** Running `pomodoro` in dashboard or compact mode, pressing spacebar freezes the
countdown at its current remaining time and shows a clear "PAUSED" indicator; pressing it again
resumes counting down from exactly where it left off. No phase transition or bell fires while
paused, no matter how long the pause lasts. Ctrl+C still exits immediately and cleanly, paused or
not. Bare `pomodoro`'s default output is unchanged — this is a new keybinding, not a new flag.

**Why:** A developer interrupted mid-phase (a call, a colleague, the doorbell) previously had no
way to freeze progress — the countdown kept running and could bell/transition while they were
away. This was one of three v1 exclusions deliberately reopened for v2
([`docs/roadmap.md` §Decisions so far](../../roadmap.md)); see [spec](spec.md) §1/§2 and
[ADR-0001](adr/0001-confine-pause-state-to-io.md) (pause state lives entirely in `io`, `core`
stays untouched).

**How to use:** `pomodoro`, then press spacebar to pause/resume. No new flags, no config.

**Operational notes:**
- Migration: none.
- Feature flag / config: none — on by default in dashboard/compact mode; a no-op everywhere
  pause/resume can't apply (plain mode, non-TTY stdin — AC-03).
- Rollback: revert the feature-branch commits; no persisted state, no migration to undo.

**Acceptance criteria delivered:** AC-01 through AC-08 (spec §5) — pause/resume toggling, exact
time preservation across any number of cycles, no missed/false bell alerts while paused, a clear
PAUSED indicator in both render modes, the existing Ctrl+C guarantee preserved, terminal input
mode always restored on every detectable exit path, and graceful no-op degradation when
keystroke capture can't be enabled.
