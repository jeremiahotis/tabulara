# Story 2.6: Run Validation and Managed Overrides

Status: ready-for-dev

## Story

As an operations user,
I want validation to run continuously with explicit override controls,
so that export readiness is trustworthy and exceptions are auditable.

## Acceptance Criteria

1.
**Given** mutable session data changes,
**When** `RunValidation` executes,
**Then** field/cross-field/dataset validation results are persisted and visible with cause and location,
**And** `ValidationCompleted` is appended with deterministic status output.

2.
**Given** blocking validation issues requiring business exception,
**When** `OverrideValidation` is submitted with reason,
**Then** override intent and rationale persist with visible exception markers,
**And** `ValidationOverridden` is appended and reflected in export-facing metadata.

## Tasks / Subtasks

- [ ] Implement `RunValidation` command path with persisted results and deterministic output envelopes (AC: 1)
- [ ] Implement `OverrideValidation` command path with rationale capture and export-facing exception markers (AC: 2)
- [ ] Add API/E2E tests for visibility of cause/location and deterministic override behavior (AC: 1, 2)

## Dev Notes

- Treat validation findings as first-class persisted state linked to command/event lineage.
- Require explicit override reasons and expose override state downstream.
- Keep validation status deterministic for export gate consumption.

### Project Structure Notes

- Keep validation execution behind command dispatcher path; avoid side-channel writes.
- Align override metadata contracts with export/finalization pipelines.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
