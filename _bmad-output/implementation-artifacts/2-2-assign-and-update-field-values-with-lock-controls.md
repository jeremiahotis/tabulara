# Story 2.2: Assign and Update Field Values with Lock Controls

Status: ready-for-dev

## Story

As an operations user,
I want to assign, update, and lock field values from evidence,
so that critical document fields are captured accurately and protected once confirmed.

## Acceptance Criteria

1.
**Given** an extracted or empty field target,
**When** I issue `AssignFieldValue`,
**Then** field state is written through command handlers and relevant review updates run,
**And** `FieldValueAssigned` (or `FieldValueUpdated`) is appended with valid `caused_by`.

2.
**Given** a confirmed field,
**When** I lock or unlock the field,
**Then** field mutability state changes are enforced consistently,
**And** `FieldLocked`/`FieldUnlocked` events are appended with deterministic behavior.

## Tasks / Subtasks

- [ ] Implement `AssignFieldValue` and update paths with atomic state/event persistence (AC: 1)
- [ ] Implement `FieldLocked` and `FieldUnlocked` command paths with deterministic mutability enforcement (AC: 2)
- [ ] Add API/E2E tests for causal linkage (`caused_by`), review-task updates, and lock-state correctness (AC: 1, 2)

## Dev Notes

- Route all field mutations through command handlers only.
- Enforce lock controls via guard layer, not UI-only checks.
- Keep error contracts deterministic for prohibited mutation attempts.

### Project Structure Notes

- Reuse command dispatcher and transition/guard policies established in Epic 1.
- Store lock-state transitions and field updates in audit-linked event flow.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
