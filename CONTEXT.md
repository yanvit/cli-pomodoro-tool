---
status: Living
updated_at: "2026-10-01"
---

# Domain Context — cli-pomodoro-timer

<!--
CONTEXT.md is the domain glossary — not a spec and not a scratch pad. NO implementation
detail here (no datastore/broker/framework names, no API contracts) — only domain words
and the boundaries between them. Implementation choices live in the SAD and ADRs; behaviour
lives in spec.md.

Terms get fixed inline, the moment they surface in an interview / spec / review — never
batched «I'll consolidate later». Empty H2 → prune before commit; keep only the sections
that carry real content. ## Glossary is mandatory; the other two are optional.
-->

## Glossary

<!-- One line per term: name · one-sentence canonical definition · one-sentence boundary
     (what it is NOT / the concept it gets confused with). Alphabetical once there are a few. -->
- developer — the person running `pomodoro` in their own terminal: the owner primarily, plus other developers who informally try the tool shared via GitHub; exactly one developer per running process, acting on their own session. NOT a registered user/account — the tool has no auth, no accounts, no multi-user concept.
- paused — a boolean state orthogonal to Phase (work / short_break / long_break) that suspends tick/countdown progression and defers phase transitions (and the bell) without changing which phase is current. NOT a 4th Phase value, and NOT the same as the process exiting — Ctrl+C still exits immediately while paused.
- session history — the opt-in, append-only record of completed work/break phases, written to the platform's conventional data directory. NOT task tracking, analytics, or a dashboard — just a flat per-phase log; the tool itself never reads, queries, or summarizes it.
- completed phase — a work/break phase whose countdown reached zero naturally (including a pause/resume's deferred transition flushing on resume). NOT a phase ended by Ctrl+C, a terminate/hang-up signal, or a hard kill — those produce no history record at all, by design (see `docs/features/session-history/spec.md` §3).
