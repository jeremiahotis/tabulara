# Story 1.3: Import Documents with Duplicate Handling

Status: ready-for-dev

## Story

As an operations user,
I want to import source documents with duplicate detection,
so that I avoid redundant processing and preserve clean audit lineage.

## Acceptance Criteria

1.
**Given** a selected session,
**When** I import one or more PDF/image files,
**Then** document metadata and blob references are persisted through command handlers,
**And** `DocumentImported` events are appended for each accepted import command.

2.
**Given** a detected duplicate candidate,
**When** I confirm duplicate handling,
**Then** duplicate state is persisted and linked to the original import context,
**And** `DuplicateMarked` is appended with deterministic correlation fields.

## Tasks / Subtasks

- [ ] Implement import command flow for document metadata and content references (AC: 1)
- [ ] Implement duplicate handling command flow with deterministic correlation (AC: 2)
- [ ] Add tests covering import success and duplicate confirmation flows (AC: 1, 2)

## Dev Notes

- Maintain append-only event behavior for all accepted commands.
- Keep session scoping and correlation fields explicit for forensic traceability.
- Enforce command idempotency/conflict rules from architecture where applicable.

### Project Structure Notes

- Keep import and duplicate command handlers in session/domain command modules.
- Avoid adding non-authoritative local caches outside the vault model.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
