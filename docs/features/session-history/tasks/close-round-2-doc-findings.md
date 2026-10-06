---
id: T11
title: "Close round-2 review doc findings"
layer: "docs"
deps: ["T3"]
acs: []
owner: "Vitalii"
estimate: "S"
status: "done"
origin: "review-2026-10-06 round 2, findings #2, #3, #4, #6, #7 (sdd:review)"
---

# T11 — Close round-2 review doc findings

## Why

Round-2 review (`_review/review-2026-10-06.md` round 2) found five doc-only findings left over
from the round-1 fix pass: a stale "read at its own startup" claim in `sad.md` §11 that `d9d3123`
missed when correcting §4/§5; `docs/architecture-map.md`'s "no persistence/history" claims going
stale the moment this feature shipped; `spec.md` §8's two open questions left unchecked despite
being decided and locked in by tests; unfilled `sad.md` §6 Flow 2/3 template placeholders; and a
`data-model.md` test-fixture bullet documenting a helper that was never implemented.

## Checklist

- [x] `sad.md` §11: fix the last "read at its own startup" occurrence.
- [x] `architecture-map.md`: point the persistence claims at `src/history/` and the feature docs.
- [x] `spec.md` §8: tick both open questions closed, citing where each was decided/implemented/tested.
- [x] `sad.md` §6 Flows 2/3: replace `<service>`/`<data-store>`/`<client>` placeholders with the
      real `history`/`filesystem`/`io`/`Developer` participant names Flow 1 already uses.
- [x] `data-model.md`: fix the owner field (was "Backend Lead") and drop the
      `buildCompletedPhaseRecord` test-fixture bullet — no such helper exists or is needed.

## Definition of Done

- [x] All five findings resolved with no new contradictions introduced within the touched lines.
- [x] Committed as `e910ac5`.

## Note (round 3)

The independent round-3 re-review found this commit's doc fixes correct where cited, but
incomplete in scope: `sad.md` §1 still referenced spec.md §8 as open (fixed separately, see
`_review/review-2026-10-06.md` round 3 N1), and `architecture-map.md` had further stale
"no persistence" claims outside the two lines this task touched (N2). Both closed directly as
part of the round-3 doc-only fix pass — no new task opened, bundled with this one's trail.
