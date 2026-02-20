# Story 1.3: Import Documents with Duplicate Handling

Status: done

## Story

As an operations user,
I want to import source documents with duplicate detection,
so that I avoid redundant processing and preserve clean audit lineage.

## Acceptance Criteria

1.
**Given** a selected session,
**When** I import one or more PDF/image files,
**Then** document metadata and blob references are persisted through command handlers,
**And** `DocumentImported` events are appended for each accepted import command.

2.
**Given** a detected duplicate candidate,
**When** I confirm duplicate handling,
**Then** duplicate state is persisted and linked to the original import context,
**And** `DuplicateMarked` is appended with deterministic correlation fields.

## Tasks / Subtasks

- [x] Implement import command flow for document metadata and content references (AC: 1)
- [x] Implement duplicate handling command flow with deterministic correlation (AC: 2)
- [x] Add tests covering import success and duplicate confirmation flows (AC: 1, 2)

## Dev Notes

- Maintain append-only event behavior for all accepted commands.
- Keep session scoping and correlation fields explicit for forensic traceability.
- Enforce command idempotency/conflict rules from architecture where applicable.

### Project Structure Notes

- Keep import and duplicate command handlers in session/domain command modules.
- Avoid adding non-authoritative local caches outside the vault model.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test:api -- --project=api tests/api/story-1-3-import-documents-with-duplicate-handling.spec.ts --grep "\[AC1\]"` (red -> green)
- `npm run test:api -- --project=api tests/api/story-1-3-import-documents-with-duplicate-handling.spec.ts --grep "\[AC2\]"` (red -> green)
- `npm run test:e2e -- --project=chromium-e2e tests/e2e/story-1-3-import-documents-with-duplicate-handling.spec.ts` (red -> green)
- `npm run test:api -- --project=api tests/api/story-1-3-import-documents-with-duplicate-handling.spec.ts tests/api/story-1-3-import-documents-with-duplicate-handling.automation.spec.ts` (review-remediation pass)
- `npm run test:e2e -- --project=chromium-e2e tests/e2e/story-1-3-import-documents-with-duplicate-handling.spec.ts tests/e2e/story-1-3-import-documents-with-duplicate-handling.automation.spec.ts` (review-remediation pass)
- `npm run test:api`
- `npm run test:e2e`
### Completion Notes List

- Added `ImportDocument` command support in `scripts/command-dispatcher.mjs` with payload validation, atomic persistence of document metadata/blob references, and append-only `DocumentImported` event emission linked by `caused_by`.
- Added `ConfirmDuplicate` command support in `scripts/command-dispatcher.mjs` with deterministic correlation derivation (`pair_key`, `deterministic_key`, `source_import_command_id`) and append-only `DuplicateMarked` event emission.
- Extended the in-memory mutation model to keep command-driven updates atomic across sessions, documents, duplicates, and audit log state.
- Updated `src/App.tsx` to dispatch Story 1.3 command envelopes (`ImportDocument`, `ConfirmDuplicate`) and render all required traceability surfaces (`document-last-imported-blob-id`, duplicate linkage fields, and latest audit event metadata).
- Activated Story 1.3 API and E2E ATDD specs by removing `test.skip()` and verified end-to-end acceptance behavior.
- Aligned Story 1.3 automation specs to post-implementation expectations (acceptance flows rather than unsupported-command rejections) to keep regression coverage consistent with implemented command support.
- Hardened `ConfirmDuplicate` preconditions so duplicate confirmation now rejects fabricated lineage (`source_import_command_id` must reference an `ImportDocument` command in the same session and linked document context).
- Added payload validation that rejects self-duplicate submissions (`document_id === duplicate_of_document_id`) with deterministic validation errors.
- Canonicalized duplicate correlation derivation so `deterministic_key` and `pair_key` are direction-independent across reversed document ordering.
- Prevented re-import overwrite by generating unique document IDs for repeated blob imports in the same session (`:reimport-N` suffix), preserving prior import traceability.
- Expanded Story 1.3 API coverage with AC2 negative-path assertions (missing source import command, self-duplicate, and missing referenced document) and updated API/E2E automation flows to seed valid import context before duplicate confirmation.

### File List

- `_bmad-output/implementation-artifacts/1-3-import-documents-with-duplicate-handling.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/command-dispatcher.mjs`
- `src/App.tsx`
- `tests/api/story-1-3-import-documents-with-duplicate-handling.spec.ts`
- `tests/api/story-1-3-import-documents-with-duplicate-handling.automation.spec.ts`
- `tests/e2e/story-1-3-import-documents-with-duplicate-handling.spec.ts`
- `tests/e2e/story-1-3-import-documents-with-duplicate-handling.automation.spec.ts`
- `tests/support/fixtures/document-import-command-data.ts`
- `tests/support/fixtures/factories/document-import-command-factory.ts`

## Change Log

- 2026-02-19: Implemented `ImportDocument` and `ConfirmDuplicate` command handlers with append-only audit events and deterministic duplicate correlation; added Story 1.3 UI command wiring/traceability surfaces; enabled and passed Story 1.3 API/E2E acceptance + automation coverage.
- 2026-02-19: Resolved Story 1.3 code-review findings by enforcing duplicate lineage/session preconditions, rejecting self-duplicates, canonicalizing duplicate deterministic keys, preserving re-import traceability (no overwrite), and adding AC2 negative-path regression coverage.
