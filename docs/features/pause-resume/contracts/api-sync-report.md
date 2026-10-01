---
status: Final
updated_at: "2026-10-01"
feature_size: "S"
---

# API sync report — pause-resume

## Interface kind

`sad.md` frontmatter `target_surfaces: [cli]` → the contract form for a `cli` surface is `contracts/cli.md` (commands/flags/exit-codes), per `../../../_shared/surfaces.md`'s gating table.

## Self-skip: no external interface change

This feature introduces **no change to the command/flag/exit-code surface**:

- `spec.md` §1 ¶3: "bind the spacebar to toggle pause/resume... No new CLI flag — it's a new keybinding, available by default."
- `spec.md` §1 ¶4 (Decision amendment): the roadmap's "byte-for-byte identical" commitment is scoped to bare `pomodoro`'s default output — explicitly, no new flags required.
- `spec.md` §3 Non-goals and all 8 acceptance criteria: zero mentions of a new command, flag, or exit code. AC-04's "authorization" coverage is about which *keystroke* may trigger pause during an already-running interactive session — not an invocation-level contract.
- No `docs/features/pause-resume/data-model.md` exists and none is needed (no schema change) — consistent with there being no new argv-level surface to type either.

Spacebar pause/resume is a **runtime keyboard interface** inside an already-invoked, already-running process — not a command, flag, or exit code a caller specifies when invoking `pomodoro`. It falls outside what `contracts/cli.md` is scoped to cover (per `../../../_shared/surfaces.md`: "commands/flags/exit-codes"). This matches `api`'s own documented self-skip condition: *"No external interface (pure internal logic) → skip to `tasks` with a one-line note in the report."*

**No `contracts/cli.md` is written.** There is no existing `contracts/cli.md` anywhere in this repo to update either (this is the first time `api` has run) — `pomodoro`'s actual invocation surface (`pomodoro`, `pomodoro --help`, `pomodoro --version`) is unchanged by this feature and remains undocumented as a formal contract until a future feature that does change it runs `api`.

## Drift check

N/A — no contract was generated, so there is nothing to check for drift against `sad.md` §6 or `spec.md` §5. The coverage question is moot in the usual field-origins sense; every AC's behavior is already covered by `sad.md` §6's sequence diagrams (confirmed in the `sequences` stage), not by an invocation-level contract.
