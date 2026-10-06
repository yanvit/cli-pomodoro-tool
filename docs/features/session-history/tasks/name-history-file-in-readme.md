---
id: T9
title: "Name the history file and its format in README"
layer: "docs"
deps: ["T5"]
acs: []
owner: "Vitalii"
estimate: "XS"
status: "todo"
origin: "review-2026-10-06 finding #4 (sdd:review)"
---

# T9 — Name the history file in README

## Why

Review finding #4: README names the three OS directories but never names the actual file
(`history.jsonl`) or its one-JSON-object-per-line format, so T5's DoD ("sufficient on its own to
… find the file") is only partly met.

## Checklist

- [ ] Add one sentence to the "Session history (opt-in)" section naming `history.jsonl` and the
      JSON-lines format.

## Definition of Done

- [ ] A reader can locate and parse the history file using only the README.
