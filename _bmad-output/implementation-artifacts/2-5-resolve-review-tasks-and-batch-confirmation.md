# Story 2.5: Resolve Review Tasks and Batch Confirmation

Status: ready-for-dev

## Story

As an operations user,
I want to resolve review tasks individually or in batches,
so that I can clear high-volume queues efficiently while preserving auditability.

## Acceptance Criteria

1.
**Given** open review tasks,
**When** I resolve, skip, or batch confirm by field context,
**Then** task status updates persist atomically with domain state,
**And** `ReviewTaskResolved`, `ReviewTaskSkipped`, and `FieldBatchConfirmed` events are appended as applicable.

2.
**Given** queue filter and navigation state,
**When** review updates occur,
**Then** user orientation is preserved (active item, position, context),
**And** completed items do not reappear unless explicitly invalidated by later changes.

3.
**Given** unresolved items in their current sequence,
**When** I perform batch resolution actions,
**Then** only targeted items transition state,
**And** unresolved item ordering remains unchanged.

## Tasks / Subtasks

- [ ] Implement review-task resolve/skip/batch-confirm command handling with atomic event append (AC: 1)
- [ ] Implement queue-orientation preservation across task updates and filters (AC: 2)
- [ ] Implement targeted batch-transition logic that preserves unresolved ordering invariants (AC: 3)
- [ ] Add API/E2E coverage for ordering, invalidation rules, and deterministic task transitions (AC: 1, 2, 3)

## Dev Notes

- Batch actions must be explicit and non-destructive to non-targeted unresolved tasks.
- Keep queue ordering deterministic before/after task transitions.
- Ensure post-update orientation remains stable for keyboard and mouse workflows.

### Project Structure Notes

- Reuse queue-state domain model for orientation continuity checks.
- Persist review-task transitions and domain effects in a single transactional command flow.

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
