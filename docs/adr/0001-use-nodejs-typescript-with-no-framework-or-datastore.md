---
status: Accepted
owner: "Vitalii"
reviewers: []
updated_at: "2026-09-30"
feature_size: "N/A — foundational, not a feature"
ticket: "N/A"
---

# 0001 — Use Node.js/TypeScript with no framework or datastore

- **Status:** Accepted
- **Date:** 2026-09-30
- **Deciders:** Vitalii (with `survey`'s greenfield foundation session)

## Context

`cli-pomodoro-timer` is a minimal, blocking CLI Pomodoro timer for personal use, informally
shared with other developers (`docs/idea-brief.md`). It needs a language/runtime pick before any
code can be scaffolded. The idea brief deliberately scopes out persistence, config files, and
background mode, so the stack choice only needs to serve a single blocking command with a
fixed cycle.

## Decision drivers

- Audience is "me + other devs" (`docs/idea-brief.md` §3) — easy to share informally, not
  published as a package, so install friction for recipients matters more than binary polish.
- No persistence, no config, no background mode (`docs/idea-brief.md` §5) — the stack doesn't
  need to support a database, a config-file parser, or process daemonization.
- Owner comfort and speed of iteration for a small personal tool.

## Considered options

1. **Node.js/TypeScript** — ubiquitous runtime, easy to run directly (`node`/`tsx`) or publish
   as an npm-installable CLI; strong ecosystem for terminal output if ever needed.
2. **Python** — fast to write, `argparse`/`click` for CLI ergonomics, cross-platform.
3. **Go** — compiles to a single static binary; best "zero install step" story for recipients,
   at the cost of more ceremony to write.

## Decision outcome

**Chosen:** Node.js/TypeScript. It best fits "me + other devs" sharing (most developers already
have Node available) without requiring Go's extra build/distribution ceremony, and gives the
owner a fast, familiar iteration loop. No framework and no datastore are used — the tool is a
single blocking command with a fixed cycle and no persisted state.

## Consequences

**Positive**
- Fastest iteration loop for the owner; trivial to run directly with `node`/`tsx`.
- Recipients (other devs) already have Node in most cases — low friction to try it.
- No framework/DB to configure, version, or reason about.

**Negative**
- Distribution is not as frictionless as Go's single static binary — recipients need Node
  installed, not just a downloaded executable.
- Node's startup is marginally heavier than a compiled binary, though irrelevant for a tool whose
  runtime is a 25-minute countdown.

**Neutral**
- Switching to Go later (for a zero-dependency binary) is possible but is effectively a rewrite —
  revisit only if distribution friction becomes a real complaint.

## Links

- Spec: N/A — foundational decision, precedes any feature spec.
- SAD: N/A — greenfield foundation, not a feature SAD.
- Related ADR: [[0002-thin-cli-core-io-module-split]]
