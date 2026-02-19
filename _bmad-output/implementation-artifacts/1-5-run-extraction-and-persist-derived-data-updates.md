# Story 1.5: Run Extraction and Persist Derived Data Updates

Status: review

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

- [x] Implement `RunExtraction` command flow and transactional persistence of derived outputs (AC: 1)
- [x] Implement rollback and deterministic failure payloads for extraction pipeline errors (AC: 2)
- [x] Add tests for successful extraction event append and rollback behavior (AC: 1, 2)

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
- `npm run test:api` (pass; 38 passed, 14 skipped)
- `npm run test:e2e` (pass; 19 passed, 7 skipped)

### Completion Notes List
- Implemented `RunExtraction` in `scripts/command-dispatcher.mjs` with payload validation, atomic persistence of deterministic extraction outputs, and `ExtractionCompleted` + `DerivedDataUpdated` events linked by `caused_by`.
- Added deterministic extraction failure handling (`EXTRACTION_FAILED` with `payload_stability: deterministic`) and rollback path (`run_extraction: transaction_rolled_back`) for pre-commit failure simulation.
- Extended shell command UI in `src/App.tsx` with `RunExtraction` input fields and telemetry/error bindings required for operator-visible extraction counts and failure stability feedback.
- Updated Story 1.5 API and E2E automation tests to validate accepted extraction flow, event append linkage, rollback semantics, and deterministic failure envelopes.

### File List
- scripts/command-dispatcher.mjs
- src/App.tsx
- tests/api/story-1-5-run-extraction-and-persist-derived-data-updates.automation.spec.ts
- tests/e2e/story-1-5-run-extraction-and-persist-derived-data-updates.automation.spec.ts
- tests/support/fixtures/story-1-5-red-phase-data.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/1-5-run-extraction-and-persist-derived-data-updates.md

## Change Log

- 2026-02-19: Implemented Story 1.5 extraction command flow with transactional persistence, deterministic rollback/failure handling, and updated Story 1.5 automation coverage.
