---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-02-19T09:25:48Z
---

# ATDD Checklist - Epic 1, Story 1.3: Import Documents with Duplicate Handling

**Date:** 2026-02-19
**Author:** Jeremiah
**Primary Test Level:** API (with E2E workflow coverage)

## Story Summary

Story 1.3 defines command-driven import and duplicate-confirmation behavior for session-bound documents. The quality bar is deterministic traceability: accepted commands must persist import/duplicate linkage data and append immutable events with causal correlation (`caused_by`) and deterministic duplicate-correlation fields.

**As an** operations user  
**I want** to import source documents with duplicate detection  
**So that** I avoid redundant processing and preserve clean audit lineage

## Acceptance Criteria

1. Given a selected session, when I import one or more PDF/image files, then document metadata and blob references are persisted through command handlers, and `DocumentImported` events are appended for each accepted import command.
2. Given a detected duplicate candidate, when I confirm duplicate handling, then duplicate state is persisted and linked to the original import context, and `DuplicateMarked` is appended with deterministic correlation fields.

## Failing Tests Created (RED Phase)

### E2E Tests (3 tests)

**File:** `tests/e2e/story-1-3-import-documents-with-duplicate-handling.spec.ts` (100 lines)

- ✅ **Test:** `[P0][AC1] should import document command payload and surface DocumentImported traceability`
  - **Status:** RED - import form fields and import traceability surfaces are not implemented.
  - **Verifies:** operator import workflow, mutation/event indicators, and latest `DocumentImported` rendering.
- ✅ **Test:** `[P0][AC2] should confirm duplicate candidate and persist duplicate linkage state`
  - **Status:** RED - duplicate confirmation UI + persistence surfaces are not implemented.
  - **Verifies:** duplicate confirmation flow, duplicate linkage display, and `DuplicateMarked` event visibility.
- ✅ **Test:** `[P1][AC2] should surface deterministic duplicate correlation evidence for operators`
  - **Status:** RED - deterministic correlation UI fields are not implemented.
  - **Verifies:** duplicate correlation key rendering and linked import command provenance.

### API Tests (4 tests)

**File:** `tests/api/story-1-3-import-documents-with-duplicate-handling.spec.ts` (126 lines)

- ✅ **Test:** `[P0][AC1] should persist import metadata and blob references through ImportDocument command handlers`
  - **Status:** RED - `ImportDocument` command branch/contract not implemented.
  - **Verifies:** accepted command mutation path for `blob_ids` + metadata persistence contract.
- ✅ **Test:** `[P0][AC1] should append DocumentImported with deterministic caused_by linkage`
  - **Status:** RED - event append semantics for import command not implemented.
  - **Verifies:** `DocumentImported` append, causal linkage (`caused_by`), and payload traceability fields.
- ✅ **Test:** `[P0][AC2] should persist duplicate linkage to original import context through ConfirmDuplicate command handlers`
  - **Status:** RED - `ConfirmDuplicate` command branch/contract not implemented.
  - **Verifies:** duplicate linkage persistence contract and import-context linkage.
- ✅ **Test:** `[P1][AC2] should append DuplicateMarked with deterministic correlation fields`
  - **Status:** RED - deterministic duplicate-correlation event payload contract not implemented.
  - **Verifies:** `DuplicateMarked` append and deterministic correlation fields (`pair_key`, `deterministic_key`, `source_import_command_id`).

### Component Tests (0 tests)

Not generated for Story 1.3. This scope is command contract integrity + operator workflow traceability.

## Data Factories Created

### Document Import Command Factory

**File:** `tests/support/fixtures/factories/document-import-command-factory.ts`

**Exports:**

- `createImportDocumentCommandEnvelope(options?)` - creates typed `ImportDocument` envelopes with blob/metadata defaults and override support.
- `createConfirmDuplicateCommandEnvelope(options?)` - creates typed `ConfirmDuplicate` envelopes with deterministic correlation defaults and override support.

## Fixtures Created

### Story 1.3 Command Data + Test IDs

**File:** `tests/support/fixtures/document-import-command-data.ts`

**Provides:**

- `story13RequiredTestIds` - canonical list of required test IDs for import + duplicate UI flows.
- `story13DeterministicCorrelationShape` - reference shape for deterministic correlation fields in UI/event contracts.

## Mock Requirements

No external third-party mock requirements are mandatory for Story 1.3 contract tests. Scope is local command-dispatch contract behavior and UI traceability rendering.

## Required data-testid Attributes

### Import Flow

- `command-type-input`
- `command-submit-button`
- `import-session-id-input`
- `import-blob-ids-input`
- `import-metadata-source-input`
- `import-file-name-input`
- `document-last-imported-blob-id`

### Duplicate Flow and Traceability

- `duplicate-session-id-input`
- `duplicate-document-id-input`
- `duplicate-of-document-id-input`
- `duplicate-source-command-id-input`
- `duplicate-state-latest`
- `duplicate-of-document-id-latest`
- `duplicate-correlation-key-latest`
- `duplicate-linked-import-command-latest`
- `audit-event-type-latest`
- `audit-event-caused-by-latest`
- `mutation-state`
- `event-append-state`

## Implementation Checklist

### Test: ImportDocument persistence contract

**File:** `tests/api/story-1-3-import-documents-with-duplicate-handling.spec.ts`

- [ ] Add `ImportDocument` command routing in dispatcher/handler.
- [ ] Persist `blob_ids` and document metadata in authoritative state model.
- [ ] Return accepted contract with session/document payload details.
- [ ] Remove `test.skip()` and run this test.

### Test: DocumentImported event append + caused_by linkage

**File:** `tests/api/story-1-3-import-documents-with-duplicate-handling.spec.ts`

- [ ] Emit `DocumentImported` for accepted import command.
- [ ] Ensure event envelope includes `caused_by = command_id`.
- [ ] Ensure event data contains session/blob/metadata traceability fields.
- [ ] Remove `test.skip()` and run this test.

### Test: ConfirmDuplicate persistence + import-context linkage

**File:** `tests/api/story-1-3-import-documents-with-duplicate-handling.spec.ts`

- [ ] Add `ConfirmDuplicate` command routing in dispatcher/handler.
- [ ] Persist duplicate relationship to original import context.
- [ ] Return duplicate linkage contract fields in response payload.
- [ ] Remove `test.skip()` and run this test.

### Test: DuplicateMarked deterministic correlation payload

**File:** `tests/api/story-1-3-import-documents-with-duplicate-handling.spec.ts`

- [ ] Emit `DuplicateMarked` for accepted duplicate confirmation command.
- [ ] Populate deterministic correlation fields (`pair_key`, `deterministic_key`, `source_import_command_id`).
- [ ] Preserve `caused_by` linkage to command envelope.
- [ ] Remove `test.skip()` and run this test.

### Test: Import workflow surfaces in UI

**File:** `tests/e2e/story-1-3-import-documents-with-duplicate-handling.spec.ts`

- [ ] Implement import input controls for Story 1.3 test IDs.
- [ ] Wire UI submission to `ImportDocument` payload contract.
- [ ] Render latest imported blob + latest import audit event metadata.
- [ ] Remove `test.skip()` and run this test.

### Test: Duplicate confirmation workflow surfaces in UI

**File:** `tests/e2e/story-1-3-import-documents-with-duplicate-handling.spec.ts`

- [ ] Implement duplicate confirmation input controls for Story 1.3 test IDs.
- [ ] Wire UI submission to `ConfirmDuplicate` payload contract.
- [ ] Render duplicate linkage state + latest duplicate event type.
- [ ] Remove `test.skip()` and run this test.

### Test: Deterministic duplicate correlation evidence in UI

**File:** `tests/e2e/story-1-3-import-documents-with-duplicate-handling.spec.ts`

- [ ] Render deterministic correlation key in operator-visible traceability surface.
- [ ] Render linked source import command ID for provenance.
- [ ] Preserve latest `caused_by` visibility after duplicate confirmation.
- [ ] Remove `test.skip()` and run this test.

## Running Tests

```bash
# Story 1.3 API RED suite
npx playwright test tests/api/story-1-3-import-documents-with-duplicate-handling.spec.ts --project=api

# Story 1.3 E2E RED suite
npx playwright test tests/e2e/story-1-3-import-documents-with-duplicate-handling.spec.ts --project=chromium-e2e
```

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- Story 1.3 API + E2E tests were generated with `test.skip()`.
- Assertions target expected implementation contracts (no placeholder assertions).
- RED handoff is explicit and deterministic for implementation.

### GREEN Phase (Next)

- Implement `ImportDocument` and `ConfirmDuplicate` command handlers.
- Implement Story 1.3 import + duplicate UI fields/surfaces.
- Remove `test.skip()` incrementally and pass each scenario.

### REFACTOR Phase

- Consolidate command-envelope factory patterns across Story 1.2 and 1.3.
- Keep deterministic correlation derivation in one canonical utility.
- Preserve event append-only and causality constraints.

## Knowledge Base References Applied

- `data-factories.md`
- `component-tdd.md`
- `test-quality.md`
- `test-healing-patterns.md`
- `selector-resilience.md`
- `timing-debugging.md`
- `overview.md`
- `api-request.md`
- `network-recorder.md`
- `auth-session.md`
- `intercept-network-call.md`
- `recurse.md`
- `log.md`
- `file-utils.md`
- `network-error-monitor.md`
- `fixtures-composition.md`
- `playwright-cli.md`

## Official Documentation Cross-Check

Recommendations and generated patterns were cross-checked against official docs:

- Playwright locator and test guidance: https://playwright.dev/docs/locators
- Cypress selector best practices: https://docs.cypress.io/app/core-concepts/best-practices
- Pact contract testing docs: https://docs.pact.io/
- GitHub Actions references (for CI alignment): https://docs.github.com/actions

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test tests/api/story-1-3-import-documents-with-duplicate-handling.spec.ts --project=api`

**Results:**

- Total tests: 4
- Passing: 0
- Skipped: 4
- Failing: 0
- Status: ✅ RED scaffolding verified (all tests intentionally skipped)

**Command:** `npx playwright test tests/e2e/story-1-3-import-documents-with-duplicate-handling.spec.ts --project=chromium-e2e`

**Results:**

- Total tests: 3
- Passing: 0
- Skipped: 3
- Failing: 0
- Status: ✅ RED scaffolding verified (all tests intentionally skipped)

## Workflow Progress Log

### Step 1: Preflight and Context

- Loaded story: `_bmad-output/implementation-artifacts/1-3-import-documents-with-duplicate-handling.md`.
- Verified framework config in `playwright.config.ts` and existing test scaffolding.
- Loaded TEA core + playwright-utils + CLI knowledge fragments required by workflow config.

### Step 2: Generation Mode

- Selected **AI generation mode**.
- Browser recording was not required for this contract-focused story.

### Step 3: Test Strategy

- Selected **API-first** coverage for command/event/correlation contracts.
- Added **E2E** coverage for operator workflow visibility and traceability surfaces.
- Prioritized P0 for import/duplicate integrity and P1 for deterministic correlation evidence.

### Step 4: Aggregate

- Parallel subprocess artifacts:
  - `/tmp/tea-atdd-api-tests-1771492929.json`
  - `/tmp/tea-atdd-e2e-tests-1771492929.json`
  - `/tmp/tea-atdd-summary-1771492929.json`
- Persisted copies:
  - `_bmad-output/test-artifacts/temp/tea-atdd-api-tests-1771492929.json`
  - `_bmad-output/test-artifacts/temp/tea-atdd-e2e-tests-1771492929.json`
  - `_bmad-output/test-artifacts/temp/tea-atdd-summary-1771492929.json`
- Generated files:
  - `tests/api/story-1-3-import-documents-with-duplicate-handling.spec.ts`
  - `tests/e2e/story-1-3-import-documents-with-duplicate-handling.spec.ts`
  - `tests/support/fixtures/factories/document-import-command-factory.ts`
  - `tests/support/fixtures/document-import-command-data.ts`

### Step 5: Validate and Complete

- Confirmed all generated tests contain `test.skip()` and no placeholder assertions.
- Confirmed temp artifacts are copied under `_bmad-output/test-artifacts/temp/`.
- Executed Story 1.3 API and E2E specs; both suites reported skipped tests as expected for RED scaffolding.

## Next Steps

1. Implement Story 1.3 command handlers (`ImportDocument`, `ConfirmDuplicate`) and response/event contracts.
2. Add Story 1.3 UI controls/surfaces using required test IDs.
3. Remove `test.skip()` progressively and drive API then E2E suites to green.
