# Story 1.5: Run Extraction and Persist Derived Data Updates

Status: done

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

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Enforce preprocess-ready preconditions by validating session/document existence before `RunExtraction` persists outputs. [/Users/jeremiahotis/projects/tabulara/scripts/command-dispatcher.mjs:1269]
- [x] [AI-Review][HIGH] Validate extraction source lifecycle from authoritative document state instead of trusting client-provided `source_state`. [/Users/jeremiahotis/projects/tabulara/scripts/command-dispatcher.mjs:1360]
- [x] [AI-Review][HIGH] Normalize rollback failure envelope for `persistence-before-commit` to deterministic extraction failure contract used by AC2. [/Users/jeremiahotis/projects/tabulara/scripts/command-dispatcher.mjs:1395]
- [x] [AI-Review][HIGH] Add API coverage for `force_fail_stage: persistence-before-commit` proving rollback with zero state/event side effects. [/Users/jeremiahotis/projects/tabulara/tests/api/story-1-5-run-extraction-and-persist-derived-data-updates.automation.spec.ts:179]
- [x] [AI-Review][MEDIUM] Reconcile story File List and change records with current git evidence to maintain traceable review artifacts. [/Users/jeremiahotis/projects/tabulara/_bmad-output/implementation-artifacts/1-5-run-extraction-and-persist-derived-data-updates.md:63]
- [x] [AI-Review][LOW] Strengthen E2E AC1 assertion to require non-zero extraction output counts instead of generic digit checks. [/Users/jeremiahotis/projects/tabulara/tests/e2e/story-1-5-run-extraction-and-persist-derived-data-updates.automation.spec.ts:48]

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
- `npm run test:api -- story-1-5-run-extraction-and-persist-derived-data-updates.automation.spec.ts` (pass; 5 passed)
- `npm run test:e2e -- story-1-5-run-extraction-and-persist-derived-data-updates.automation.spec.ts` (pass; 2 passed)

### Completion Notes List
- Implemented `RunExtraction` in `scripts/command-dispatcher.mjs` with payload validation, atomic persistence of deterministic extraction outputs, and `ExtractionCompleted` + `DerivedDataUpdated` events linked by `caused_by`.
- Added deterministic extraction failure handling (`EXTRACTION_FAILED` with `payload_stability: deterministic`) and rollback path (`run_extraction: transaction_rolled_back`) for pre-commit failure simulation.
- Extended shell command UI in `src/App.tsx` with `RunExtraction` input fields and telemetry/error bindings required for operator-visible extraction counts and failure stability feedback.
- Updated Story 1.5 API and E2E automation tests to validate accepted extraction flow, event append linkage, rollback semantics, and deterministic failure envelopes.
- Tightened `RunExtraction` preconditions to require persisted session/document context and preprocess-ready lifecycle state before extraction persistence can occur.
- Enforced canonical extraction source provenance from persisted document lifecycle (`source_state: preprocess-ready`) instead of client-controlled state.
- Added Story 1.5 rollback coverage proving `persistence-before-commit` failures return deterministic `EXTRACTION_FAILED` payloads and do not commit command side effects.
- Updated Story 1.5 E2E setup to provision import + preprocessing before extraction, and strengthened extraction count assertions to require non-zero values.

### File List
- scripts/command-dispatcher.mjs
- tests/api/story-1-5-run-extraction-and-persist-derived-data-updates.automation.spec.ts
- tests/e2e/story-1-5-run-extraction-and-persist-derived-data-updates.automation.spec.ts
- tests/support/fixtures/story-1-5-red-phase-data.ts
- _bmad-output/implementation-artifacts/1-5-run-extraction-and-persist-derived-data-updates.md

## Senior Developer Review (AI)

- Date: 2026-02-19
- Reviewer: Jeremiah
- Outcome: Follow-up fixes applied; ready for re-review
- Findings summary: 6 follow-up items resolved (4 HIGH, 1 MEDIUM, 1 LOW) across dispatcher preconditions, deterministic rollback contract, test coverage, and story/git traceability.
- Validation runs: `npm run test:api -- story-1-5-run-extraction-and-persist-derived-data-updates.automation.spec.ts` passed (5/5). `npm run test:e2e -- story-1-5-run-extraction-and-persist-derived-data-updates.automation.spec.ts` passed (2/2) after serial rerun to avoid transient `EADDRINUSE` contention on `127.0.0.1:4174`.

## Change Log

- 2026-02-19: Implemented Story 1.5 extraction command flow with transactional persistence, deterministic rollback/failure handling, and updated Story 1.5 automation coverage.
- 2026-02-19: Senior Developer Review (AI) logged 6 follow-up action items and moved status to in-progress pending remediation.
- 2026-02-19: Applied all 6 AI review follow-up fixes, updated Story 1.5 automation coverage for rollback and precondition-aware E2E setup, and returned story to review.
