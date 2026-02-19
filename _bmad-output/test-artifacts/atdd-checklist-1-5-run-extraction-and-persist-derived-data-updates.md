---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04c-aggregate', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-02-19'
---

## Step 01 - Preflight and Context

### Preconditions
- Story file present and readable: `_bmad-output/implementation-artifacts/1-5-run-extraction-and-persist-derived-data-updates.md`
- Acceptance criteria present and testable: 2 criteria
- Test framework config present: `playwright.config.ts`
- Test directory present: `tests/`

### Story Context Extracted
- Story title: `Run Extraction and Persist Derived Data Updates`
- Scope: command handler `RunExtraction`, transactional persistence of extraction outputs, event append linkage, rollback semantics on failure.
- AC1 focus: persist tokens/lines/table candidates + derived values; append `ExtractionCompleted` and derived-data events with causal command linkage.
- AC2 focus: on pre-completion failures, rollback state/events atomically and return deterministic failure payloads.

### Existing Test Pattern Baseline
- API ATDD patterns reviewed in `tests/api/story-1-4-apply-preprocessing-and-controlled-reprocessing.spec.ts`
- E2E ATDD patterns reviewed in `tests/e2e/story-1-4-apply-preprocessing-and-controlled-reprocessing.spec.ts`
- Helper/factory conventions reviewed in:
  - `tests/support/fixtures/factories/command-envelope-factory.ts`
  - `tests/support/fixtures/helpers.ts`

### TEA Config Flags
- `tea_use_playwright_utils: true`
- `tea_browser_automation: auto`

### Knowledge Fragments Loaded
- Core:
  - `data-factories.md`
  - `component-tdd.md`
  - `test-quality.md`
  - `test-healing-patterns.md`
  - `selector-resilience.md`
  - `timing-debugging.md`
- Playwright Utils:
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
- Browser automation:
  - `playwright-cli.md`

### Input Confirmation
- Inputs are complete for autonomous ATDD generation.
- Proceeding to mode selection and test-strategy synthesis.

## Step 02 - Generation Mode Selection

- Selected mode: `AI generation`
- Reasoning:
  - Acceptance criteria are clear and fully testable.
  - Scope is command/API transaction behavior with deterministic payload checks.
  - Existing API/E2E test patterns for adjacent stories are already established.
  - No complex visual interaction (drag-drop/wizard/stateful UI exploration) is required for initial RED test generation.

Proceeding to test strategy design.

## Step 03 - Test Strategy

### AC-to-Scenario Mapping
- AC1 (persist outputs + append linkage events)
  - `P0 API`: successful `RunExtraction` persists tokens/lines/table candidates and derived values in one transactional command pipeline.
  - `P0 API`: successful run appends `ExtractionCompleted` and derived-data events with `caused_by=command_id` linkage.
  - `P1 API`: persisted payload preserves deterministic structure/shape for downstream verification.
- AC2 (rollback + deterministic failure payload)
  - `P0 API`: induced failure before completion rolls back state mutation and event append.
  - `P0 API`: failure response returns deterministic error envelope (`error.code`, stable detail reasons) for UI handling.
  - `P1 API`: repeated failing input returns consistent payload structure across invocations.

### Test Level Selection
- Primary level: `API`
  - Reason: story scope is backend transactional command handling, persistence integrity, and event-sourcing linkage.
- Secondary level: `E2E` (thin coverage)
  - Reason: verify operator-visible deterministic error rendering and success state telemetry from UI command dispatch path.
- Component level: `none` for this ATDD slice
  - Reason: no novel component logic is introduced by this story; behavior risk sits in command pipeline and persistence boundary.

### Priority and Coverage Plan
- `P0 API`: 4 tests (2 AC1 + 2 AC2)
- `P1 API`: 2 tests (shape determinism and repeatability)
- `P1 E2E`: 2 tests (happy path telemetry + deterministic failure visibility)

### RED-Phase Design Constraints
- Assertions target behavior not yet implemented (expected initial failures).
- No flaky timing patterns: no hard waits, explicit response/state waits only.
- Tests fail due to missing implementation paths, not malformed assertions.

Proceeding to generate failing test files and supporting ATDD assets.

## Step 04C - Aggregation Results

### TDD Red-Phase Compliance
- API subprocess output: `success=true`
- E2E subprocess output: `success=true`
- `test.skip()` validation: pass (all generated tests intentionally RED-phase gated)
- Placeholder assertion scan: pass (`expect(true).toBe(true)` not present)

### Generated Files
- `tests/api/story-1-5-run-extraction-and-persist-derived-data-updates.spec.ts`
- `tests/e2e/story-1-5-run-extraction-and-persist-derived-data-updates.spec.ts`
- `tests/fixtures/test-data.ts`

### Aggregated Summary
- Total tests: 8
- API tests: 6
- E2E tests: 2
- Fixtures identified: 4
- Execution model: parallel subprocess generation
- Performance note: ~50% faster than sequential generation path

### Artifact Outputs
- `_bmad-output/test-artifacts/tea-atdd-api-tests-2026-02-19T09-37-14.json`
- `_bmad-output/test-artifacts/tea-atdd-e2e-tests-2026-02-19T09-37-14.json`
- `_bmad-output/test-artifacts/tea-atdd-summary-2026-02-19T09-37-14.json`

Proceeding to workflow validation and completion.

## Step 05 - Validate and Complete

### Validation Against Checklist
- Prerequisites satisfied: yes (story + framework + tests directory present)
- Test files created correctly: yes (API + E2E files generated)
- RED-phase intent preserved: yes (`test.skip()` present in all generated tests)
- Placeholder assertions check: pass
- Checklist and AC alignment: pass (AC1/AC2 mapped across API/E2E scenarios)
- CLI session cleanup: not applicable (no browser recording session opened)
- Temp artifacts persistence: pass (subprocess and summary JSON copied into `_bmad-output/test-artifacts/`)

### Completion Summary
- Created test files:
  - `tests/api/story-1-5-run-extraction-and-persist-derived-data-updates.spec.ts`
  - `tests/e2e/story-1-5-run-extraction-and-persist-derived-data-updates.spec.ts`
  - `tests/fixtures/test-data.ts`
- Checklist output:
  - `_bmad-output/test-artifacts/atdd-checklist-1-5-run-extraction-and-persist-derived-data-updates.md`
- Key risk assumptions:
  - Command payload fields for `RunExtraction` and some UI `data-testid` names are contract-first assumptions and may need alignment during implementation.
  - Expected failure codes (`PRECONDITION_FAILED`, `EXTRACTION_FAILED`) assume deterministic domain guard/error taxonomy.
- Recommended next workflow:
  - Move to implementation (DEV green phase), then remove `test.skip()` and run tests to drive red→green completion.

ATDD workflow execution complete.
