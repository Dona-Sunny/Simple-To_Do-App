## Parent PRD

TBD

## What to build

Establish a small, behavior-focused smoke test baseline for the proof of concept so the core interactions can be changed more safely over time. This slice should validate user-visible behavior around task creation, validation, completion, deletion, counters, and persistence without overfitting to implementation details.

## Acceptance criteria

- [ ] A repeatable test setup exists for the static app or its extracted task-state behavior.
- [ ] The baseline checks cover add, invalid empty submission, completion toggle, deletion, active-count updates, and reload persistence.
- [ ] The tests focus on observable behavior rather than DOM structure or styling internals unless that visual behavior is the feature under test.

## Blocked by

- Blocked by TBD

## User stories addressed

- User story 35
