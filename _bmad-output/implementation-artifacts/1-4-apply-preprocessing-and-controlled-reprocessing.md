# Story 1.4: Apply Preprocessing and Controlled Reprocessing

Status: review

## Story

As an operations user,
I want preprocessing and reprocessing to run as explicit commands,
so that image quality improves without hidden or unsafe state changes.

## Acceptance Criteria

1.
**Given** imported documents in a session,
**When** I issue `ApplyPreprocessing`,
**Then** derived artifacts are created and linked to source pages,
**And** `PreprocessingApplied` is appended in the same command transaction.

2.
**Given** imported or preprocessed documents,
**When** I issue `ReprocessDocument`,
**Then** only permitted lifecycle state changes occur with deterministic transition validation,
**And** `DocumentReprocessed` is appended while preserving existing audit history.

## Tasks / Subtasks

- [x] Implement preprocessing command handler with artifact linkage to source pages (AC: 1)
- [x] Implement reprocessing command handler with lifecycle transition guards (AC: 2)
- [x] Add tests for transactional append behavior and transition rejection paths (AC: 1, 2)

## Dev Notes

- Ensure each command execution remains atomic with rollback on failure.
- Preserve existing history and do not mutate prior events.
- Keep transition policy deterministic with stable error codes.

### Project Structure Notes

- Place lifecycle transition checks in guard/policy layer reused by mutation commands.
- Keep preprocessing/reprocessing outputs linked to document/page provenance.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test:api -- --project=api tests/api/story-1-4-apply-preprocessing-and-controlled-reprocessing.spec.ts --grep "\[AC1\]"`
- `npm run test:e2e -- --project=chromium-e2e tests/e2e/story-1-4-apply-preprocessing-and-controlled-reprocessing.spec.ts --grep "\[AC1\]"`
- `npm run test:api -- --project=api tests/api/story-1-4-apply-preprocessing-and-controlled-reprocessing.spec.ts --grep "\[AC2\]"`
- `npm run test:e2e -- --project=chromium-e2e tests/e2e/story-1-4-apply-preprocessing-and-controlled-reprocessing.spec.ts --grep "\[AC2\]"`
- `npm run test:api -- --project=api tests/api/story-1-4-apply-preprocessing-and-controlled-reprocessing.automation.spec.ts`
- `npm run test:e2e -- --project=chromium-e2e tests/e2e/story-1-4-apply-preprocessing-and-controlled-reprocessing.automation.spec.ts`
- `npm run test:api`
- `npm run test:e2e`

### Completion Notes List

- Added `ApplyPreprocessing` command support in `scripts/command-dispatcher.mjs` with payload validation, deterministic precondition failures, atomic derived artifact creation linked to source document/page provenance, and append-only `PreprocessingApplied` event emission.
- Added `ReprocessDocument` command support in `scripts/command-dispatcher.mjs` with deterministic lifecycle transition guards, explicit transition policy checks, and append-only `DocumentReprocessed` event emission while preserving prior audit history.
- Extended dispatcher state to track derived artifacts and document lifecycle state transitions (including direct `imported` -> `reprocessed` and `imported` -> `preprocessed` -> `reprocessed`) without mutating prior audit entries.
- Updated `src/App.tsx` to dispatch Story 1.4 command envelopes (`ApplyPreprocessing`, `ReprocessDocument`) and render operator-visible traceability fields for derived artifacts, latest error detail reasons, and audit-history preservation.
- Activated Story 1.4 API/E2E acceptance tests by removing `test.skip()` and aligning envelope shape to existing dispatcher contracts (`type` + actor + timestamp).
- Updated Story 1.4 automation coverage to assert implemented deterministic rejection paths (`document_not_found`, `transition_not_allowed`) and preserve fixture-level envelope determinism checks.
- Maintained backward-compatible UI rejection indicators for earlier-story E2E expectations (`none` for 400 validation failures, `not-applied`/`not-appended` for 409 precondition failures).

### File List

- `_bmad-output/implementation-artifacts/1-4-apply-preprocessing-and-controlled-reprocessing.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/command-dispatcher.mjs`
- `src/App.tsx`
- `tests/api/story-1-4-apply-preprocessing-and-controlled-reprocessing.spec.ts`
- `tests/api/story-1-4-apply-preprocessing-and-controlled-reprocessing.automation.spec.ts`
- `tests/e2e/story-1-4-apply-preprocessing-and-controlled-reprocessing.spec.ts`
- `tests/e2e/story-1-4-apply-preprocessing-and-controlled-reprocessing.automation.spec.ts`

## Change Log

- 2026-02-19: Clarified Story 1.4 acceptance criteria and implementation notes to explicitly allow `ReprocessDocument` from either `imported` or `preprocessed` lifecycle states.
- 2026-02-19: Implemented Story 1.4 preprocessing/reprocessing command handlers with atomic mutation + append-only events, lifecycle transition guards, derived artifact provenance linkage, UI support for new command paths, and full API/E2E acceptance + automation regression coverage.
