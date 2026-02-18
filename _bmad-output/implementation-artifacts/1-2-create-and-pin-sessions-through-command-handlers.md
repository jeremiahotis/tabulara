# Story 1.2: Create and Pin Sessions Through Command Handlers

Status: ready-for-dev

## Story

As an operations user,
I want to create and pin sessions through explicit commands,
so that each work session is traceable and operationally organized.

## Acceptance Criteria

1.
**Given** an active project context,
**When** I issue `CreateSession`,
**Then** a new session record is created through command handlers only,
**And** `SessionCreated` is appended to `audit_log` with valid `caused_by` linkage.

2.
**Given** an existing session,
**When** I issue `PinSession` or unpin behavior,
**Then** session pin state updates are persisted atomically,
**And** corresponding events (`SessionPinned`/`SessionUnpinned`) are appended in the same transaction.

## Tasks / Subtasks

- [ ] Implement `CreateSession` command path with atomic state + event append (AC: 1)
- [ ] Implement pin/unpin command paths and paired domain events (AC: 2)
- [ ] Add tests for command-only mutation and valid `caused_by` linkage (AC: 1, 2)

## Dev Notes

- No direct writes from route handlers; all mutation must go through command dispatcher.
- Persist command and event records atomically to satisfy auditability and rollback guarantees.
- Use deterministic error handling for invalid transitions or preconditions.

### Project Structure Notes

- Keep command handlers and event append logic in backend command layer modules.
- Ensure API route maps to command invocation only.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
