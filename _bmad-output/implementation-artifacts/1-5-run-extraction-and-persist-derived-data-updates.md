# Story 1.5: Run Extraction and Persist Derived Data Updates

Status: ready-for-dev

## Story

As an operations user,
I want extraction runs to persist structured outputs with full traceability,
so that verification can begin from reproducible machine-generated candidates.

## Acceptance Criteria

1.
**Given** preprocess-ready documents,
**When** `RunExtraction` is executed,
**Then** extraction outputs (tokens/lines/table candidates and derived values) are persisted through transactional handlers,
**And** `ExtractionCompleted` plus required derived-data events are appended with command linkage.

2.
**Given** an extraction failure condition,
**When** the command pipeline encounters an error before completion,
**Then** state and events are rolled back per atomicity rules,
**And** failure outcomes are returned with deterministic error payloads for UI handling.

## Tasks / Subtasks

- [ ] Implement `RunExtraction` command flow and transactional persistence of derived outputs (AC: 1)
- [ ] Implement rollback and deterministic failure payloads for extraction pipeline errors (AC: 2)
- [ ] Add tests for successful extraction event append and rollback behavior (AC: 1, 2)

## Dev Notes

- Keep extraction side effects within transaction scope tied to command execution.
- Preserve deterministic outcomes for both success and failure paths.
- Ensure command-to-event causal chain remains queryable for audit and replay.

### Project Structure Notes

- Keep extraction orchestration behind command handlers, not direct route mutations.
- Record derived-data writes and event envelopes in audit-aligned modules.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
