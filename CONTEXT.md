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
- paused — a boolean state orthogonal to Phase (work / short_break / long_break) that suspends tick/countdown progression and defers phase transitions (and the bell) without changing which phase is current. NOT a 4th Phase value, and NOT the same as the process exiting — Ctrl+C still exits immediately while paused.
