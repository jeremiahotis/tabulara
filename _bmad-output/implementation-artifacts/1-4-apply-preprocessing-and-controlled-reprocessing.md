# Story 1.4: Apply Preprocessing and Controlled Reprocessing

Status: ready-for-dev

## Story

As an operations user,
I want preprocessing and reprocessing to run as explicit commands,
so that image quality improves without hidden or unsafe state changes.

## Acceptance Criteria

1.
**Given** imported documents in a session,
**When** I issue `ApplyPreprocessing`,
**Then** derived artifacts are created and linked to source pages,
**And** `PreprocessingApplied` is appended in the same command transaction.

2.
**Given** already processed documents,
**When** I issue `ReprocessDocument`,
**Then** only permitted lifecycle state changes occur with deterministic transition validation,
**And** `DocumentReprocessed` is appended while preserving existing audit history.

## Tasks / Subtasks

- [ ] Implement preprocessing command handler with artifact linkage to source pages (AC: 1)
- [ ] Implement reprocessing command handler with lifecycle transition guards (AC: 2)
- [ ] Add tests for transactional append behavior and transition rejection paths (AC: 1, 2)

## Dev Notes

- Ensure each command execution remains atomic with rollback on failure.
- Preserve existing history and do not mutate prior events.
- Keep transition policy deterministic with stable error codes.

### Project Structure Notes

- Place lifecycle transition checks in guard/policy layer reused by mutation commands.
- Keep preprocessing/reprocessing outputs linked to document/page provenance.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
