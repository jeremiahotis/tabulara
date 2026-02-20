# Story 2.3: Map Item Rows and Extra Table Values

Status: ready-for-dev

## Story

As an operations user,
I want to maintain itemized and extra table data through commands,
so that structured outputs preserve full tabular detail and provenance.

## Acceptance Criteria

1.
**Given** item/table mapping context,
**When** I add/delete rows and assign values using item/extra-table commands,
**Then** row/value mutations are persisted atomically,
**And** mapped events (`ItemRowAdded`, `ItemRowDeleted`, `ItemValueAssigned`, `ExtraRowAdded`, `ExtraValueAssigned`) are appended.

2.
**Given** row-level lock actions,
**When** I lock item rows for finalized entries,
**Then** subsequent prohibited edits are rejected deterministically,
**And** lock state remains visible and non-color-only in verification surfaces.

## Tasks / Subtasks

- [ ] Implement item/extra-table row mutation commands with atomic persistence + append-only events (AC: 1)
- [ ] Implement row-lock controls with deterministic rejection for prohibited edits (AC: 2)
- [ ] Add coverage for accessibility-safe lock visibility and tabular provenance continuity (AC: 1, 2)

## Dev Notes

- Preserve table provenance while supporting row add/delete and value assignment.
- Keep lock enforcement authoritative in backend command processing.
- Maintain deterministic event naming and causal linkage for all row/value mutations.

### Project Structure Notes

- Keep table-mapping command handlers aligned with existing command/event envelope contracts.
- Surface row-lock and provenance state consistently in verification UI components.

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
