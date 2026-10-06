---
id: T8
title: "Update CLAUDE.md to document the history module and reflect shipped persistence"
layer: "docs"
deps: ["T3"]
acs: []
owner: "Vitalii"
estimate: "XS"
status: "todo"
origin: "review-2026-10-06 finding #3 (sdd:review)"
---

# T8 — Update CLAUDE.md

## Why

Review finding #3: `CLAUDE.md` still says "Persistence: none, deliberately" and its module list
omits `src/history/`, contradicting `sad.md §11`'s own instruction to update it once this feature
ships.

## Checklist

- [ ] Add a `src/history/` bullet to §Module structure (opt-in append-only writer + OS-path
      resolution, called only from `io`, per ADR-0001).
- [ ] Amend the Persistence convention line to reflect the opt-in history writer.
- [ ] Add a routing rule: "History/persistence logic → `src/history/`".

## Definition of Done

- [ ] `CLAUDE.md` no longer claims zero persistence.
- [ ] No other section's meaning drifts.
