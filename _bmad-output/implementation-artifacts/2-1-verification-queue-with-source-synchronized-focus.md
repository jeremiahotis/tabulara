# Story 2.1: Verification Queue with Source-Synchronized Focus

Status: ready-for-dev

## Story

As an operations user,
I want queue selection to jump directly to source evidence,
so that I can validate each value quickly without manual searching.

## Acceptance Criteria

1.
**Given** unresolved review items,
**When** I select the next queue item by mouse or keyboard,
**Then** the corresponding source region is focused, highlighted, and centered in the evidence viewport,
**And** queue position and active context remain stable across navigation.

2.
**Given** continuous verification workflow,
**When** I resolve an item,
**Then** the next unresolved item becomes active without blocking dialogs,
**And** the interaction remains keyboard-operable with visible focus and no traps.

## Tasks / Subtasks

- [ ] Implement deterministic queue-item selection and evidence-focus sync for mouse and keyboard flows (AC: 1)
- [ ] Implement auto-advance to next unresolved item without blocking dialogs (AC: 2)
- [ ] Add API/E2E coverage for focus stability, keyboard operability, and queue orientation continuity (AC: 1, 2)

## Dev Notes

- Keep verification navigation deterministic across queue actions.
- Preserve active item and context during evidence jumps and resolve actions.
- Ensure accessibility semantics for focus visibility and keyboard-only operation.

### Project Structure Notes

- Implement queue/evidence synchronization through command/event-driven state updates.
- Keep viewport-focus behavior in verification UI modules, with deterministic state sourced from backend.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/ux-design-specification.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
