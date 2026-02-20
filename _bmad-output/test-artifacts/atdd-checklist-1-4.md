---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04c-aggregate', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-02-19'
---

## Step 01 - Preflight and Context

### 1. Prerequisites (Hard Requirements)

- Story file loaded: `_bmad-output/implementation-artifacts/1-4-apply-preprocessing-and-controlled-reprocessing.md`
- Story status: `ready-for-dev`
- Acceptance criteria clarity: PASS (2 explicit Given/When/Then criteria)
- Test framework config found: `playwright.config.ts`
- Development environment available: PASS (`package.json` scripts and Playwright dependencies present)

### 2. Story Context Loaded

- Story ID: `1-4`
- Epic: `1`
- Story: `4`
- Story title: `Apply Preprocessing and Controlled Reprocessing`
- User role: `operations user`
- Feature intent: run preprocessing and reprocessing as explicit commands with deterministic, safe state transitions
- Business value: improved image quality without hidden/unsafe state mutation

Acceptance criteria extracted:

1. `ApplyPreprocessing` creates derived artifacts linked to source pages and appends `PreprocessingApplied` in the same transaction.
2. `ReprocessDocument` allows only permitted deterministic lifecycle transitions and appends `DocumentReprocessed` while preserving audit history.

Technical constraints extracted:

- Command execution must be atomic with rollback on failure.
- Existing history/events must remain immutable.
- Transition policy must be deterministic with stable error codes.
- Preprocessing/reprocessing outputs must preserve document/page provenance linkage.

Affected components and integrations inferred:

- Command dispatch + command handlers for `ApplyPreprocessing` and `ReprocessDocument`
- Lifecycle guard/policy layer (shared transition validation)
- Event append/audit history subsystem
- Derived artifact linkage model (document/page provenance)
- API command endpoint (`/api/v1/commands/dispatch`)
- UI command form/evidence surface for E2E observability

### 3. Framework + Existing Test Patterns Loaded

Framework configuration (`playwright.config.ts`):

- `testDir`: `./tests`
- Projects: `chromium-e2e`, `api`
- Reporter outputs: HTML + JUnit + list
- Artifacts: traces/screenshots/videos retained on failure

Existing patterns inspected under `tests/`:

- API ATDD pattern in `tests/api/story-1-3-import-documents-with-duplicate-handling.spec.ts`
  - command envelope factories
  - assertion style on `mutation_applied` and `event_appended`
  - deterministic error code checks (`PRECONDITION_FAILED`, payload validation)
- E2E ATDD pattern in `tests/e2e/story-1-3-import-documents-with-duplicate-handling.spec.ts`
  - `getByTestId` locators
  - response gating via `page.waitForResponse`
  - operator-visible state assertions
- Fixture composition in `tests/support/fixtures/index.ts`
  - `mergeTests` composition
  - `@seontechnologies/playwright-utils` fixture integration
  - domain factory + cleanup tracking pattern

### 3.5 TEA Config Flags

From `_bmad/tea/config.yaml`:

- `tea_use_playwright_utils: true`
- `tea_browser_automation: auto`
- `test_framework: playwright`

### 4. Knowledge Fragments Loaded

Core fragments:

- `data-factories.md`
- `component-tdd.md`
- `test-quality.md`
- `test-healing-patterns.md`
- `selector-resilience.md`
- `timing-debugging.md`

Playwright Utils fragments (enabled):

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

Playwright CLI fragment (auto mode):

- `playwright-cli.md`

MCP-specific fragment requirement:

- No dedicated MCP knowledge fragment currently present in `tea-index.csv`; skipped without blocking.

### 5. Input Confirmation

Inputs are complete and sufficient to proceed autonomously to test strategy:

- Story and acceptance criteria: loaded
- Framework and existing conventions: loaded
- Knowledge base guidance: loaded
- Output target resolved: `_bmad-output/test-artifacts/atdd-checklist-1-4.md`

## Step 02 - Generation Mode Selection

### 1. Mode Evaluation

- Acceptance criteria clarity: HIGH (explicit command/event outcomes and constraints)
- Scenario complexity: backend command + lifecycle policy + deterministic transition guards
- UI interaction complexity: LOW to MODERATE (operator command form assertions, no complex drag/drop wizard flow)

### 2. Chosen Mode

- Selected mode: **AI generation (default)**
- Recording mode: **not required** for this story

### 3. Rationale

- Existing test patterns for command workflows are already present in `tests/api/` and `tests/e2e/`.
- Story behavior is primarily service/API and domain transition logic, which is suitable for deterministic AI-generated API-first ATDD tests.
- `tea_browser_automation: auto` remains available for fallback, but no blocking selector ambiguity currently requires live recording.

## Step 03 - Test Strategy

### 1. Acceptance Criteria to Scenario Mapping

AC1 (`ApplyPreprocessing` creates derived artifacts + appends `PreprocessingApplied` in same transaction):

- S1 [P0]: Accept valid `ApplyPreprocessing` command, persist derived artifacts with source-page linkage, append `PreprocessingApplied`, and return `mutation_applied=true` + `event_appended=true`.
- S2 [P0]: If artifact derivation fails mid-transaction, command is rejected atomically with rollback (`mutation_applied=false`, `event_appended=false`) and deterministic error code.
- S3 [P1]: Reject `ApplyPreprocessing` when session/document preconditions are missing with stable validation/precondition error fields.

AC2 (`ReprocessDocument` enforces deterministic lifecycle transitions + appends `DocumentReprocessed` preserving history):

- S4 [P0]: Accept `ReprocessDocument` on permitted lifecycle transition and append `DocumentReprocessed` without mutating prior audit events.
- S5 [P0]: Reject disallowed lifecycle transition with deterministic transition guard response (`mutation_applied=false`, `event_appended=false`) and stable error code/details.
- S6 [P1]: Reject unknown/missing document references while preserving existing history unchanged.

### 2. Test Level Selection

Primary level: **API**

- API tests cover transactional command handling, lifecycle guard policy, event append semantics, and deterministic error contracts.
- E2E tests are scoped to one critical operator journey per AC to validate command form wiring and observable status/audit evidence.
- Component tests are deferred (no isolated UI behavior in this story that cannot be validated via existing E2E/API coverage without duplication).

Duplicate coverage guard:

- Domain/business invariants (atomicity, transition guard, history immutability) are asserted at API level only.
- E2E asserts user-observable command success/failure states and latest audit evidence, not full domain state duplication.

### 3. Priority Assignment (P0-P3)

- P0: S1, S2, S4, S5 (data integrity, event history correctness, deterministic guardrails)
- P1: S3, S6 (important boundary/validation failures)
- P2: E2E error-message polish/UX wording checks (optional)
- P3: none planned

### 4. RED Phase Requirements

All generated tests must initially fail because implementation for Story 1.4 is not complete.

Expected RED failure profile:

- Success-path tests fail on missing command handlers, missing derived artifact linkage, or absent expected event types.
- Guard-path tests fail due to missing deterministic transition enforcement or missing stable error code/details.
- E2E tests fail where command form cannot produce expected mutation/event state evidence for new command types.

## Step 04 - Parallel RED-Phase Generation

### Subprocess Orchestration

- Timestamp: `1771496959`
- Subprocess A output: `/tmp/tea-atdd-api-tests-1771496959.json`
- Subprocess B output: `/tmp/tea-atdd-e2e-tests-1771496959.json`
- Execution mode: **parallel**

### Parallel Run Status

- Subprocess A (API RED): complete
- Subprocess B (E2E RED): complete
- Output files present: yes

### TDD RED-Phase Report

- API tests generated with `test.skip()`: yes
- E2E tests generated with `test.skip()`: yes
- Placeholder assertions detected: no
- TDD red compliance: **PASS**

### Performance Report

- API generation: near-instant
- E2E generation: near-instant
- Total elapsed: approximately max(API, E2E)
- Sequential baseline: approximately API + E2E
- Performance gain: approximately 50% faster than sequential

## Step 04C - Aggregation and Infrastructure

### Files Written to Disk

- `tests/api/story-1-4-apply-preprocessing-and-controlled-reprocessing.spec.ts` (RED, skipped)
- `tests/e2e/story-1-4-apply-preprocessing-and-controlled-reprocessing.spec.ts` (RED, skipped)
- `tests/support/fixtures/story-1-4-red-phase-data.ts`

### Aggregated Counts

- Total tests: 10
- API tests: 6
- E2E tests: 4
- All tests intentionally skipped for RED phase: yes

### Fixture Needs (Aggregated)

- `story14ApplyPreprocessingPayloadFactory`
- `story14ReprocessDocumentPayloadFactory`
- `story14CommandFormSelectorMap`
- `story14ReprocessUiSeedFixture`

### Acceptance Criteria Coverage

- Apply preprocessing creates linked derived artifacts and appends `PreprocessingApplied`.
- Reprocessing enforces deterministic allowed transitions and appends `DocumentReprocessed`.
- Rejection paths for missing documents and disallowed transitions included with stable error expectations.

### Aggregated Summary Artifact

- `/tmp/tea-atdd-summary-1771496959.json`

## Step 05 - Validate and Complete

### Validation Against Checklist

Prerequisites:

- Story with testable acceptance criteria: pass
- Playwright framework config present: pass
- Test dependencies present: pass

Generated deliverables:

- API test file present and parsed by Playwright: pass
- E2E test file present and parsed by Playwright: pass
- Shared red-phase fixture data file present: pass
- ATDD checklist output document present: pass

TDD red-phase compliance:

- All generated tests use `test.skip()`: pass
- No placeholder assertions found: pass
- Tests assert expected behavior contracts: pass
- Intentional pre-implementation state verified by run:
  - Command: `npx playwright test tests/api/story-1-4-apply-preprocessing-and-controlled-reprocessing.spec.ts tests/e2e/story-1-4-apply-preprocessing-and-controlled-reprocessing.spec.ts`
  - Result: `10 skipped`

Hygiene checks:

- CLI sessions cleaned up: pass (no CLI browser session opened in this run)
- Temp artifacts stored under test artifacts: pass
  - `_bmad-output/test-artifacts/atdd-temp/1771496959/tea-atdd-api-tests-1771496959.json`
  - `_bmad-output/test-artifacts/atdd-temp/1771496959/tea-atdd-e2e-tests-1771496959.json`
  - `_bmad-output/test-artifacts/atdd-temp/1771496959/tea-atdd-summary-1771496959.json`

### Completion Summary

Test files created:

- `tests/api/story-1-4-apply-preprocessing-and-controlled-reprocessing.spec.ts` (6 RED tests, skipped)
- `tests/e2e/story-1-4-apply-preprocessing-and-controlled-reprocessing.spec.ts` (4 RED tests, skipped)
- `tests/support/fixtures/story-1-4-red-phase-data.ts`

Checklist output path:

- `_bmad-output/test-artifacts/atdd-checklist-1-4.md`

Key risks and assumptions:

- API/E2E expectations assume deterministic error contracts remain `PRECONDITION_FAILED` with detailed reason fields.
- E2E tests assume new command form `data-testid` fields for preprocessing/reprocessing will be introduced exactly as specified.
- Because RED mode uses `test.skip()`, these tests are executable and reviewable but not yet active failure gates.

Recommended next workflow:

- Move to implementation (DEV) for Story 1.4, then remove `test.skip()` test-by-test to enter green phase.
