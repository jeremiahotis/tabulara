---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04c-aggregate', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-02-20'
---

# ATDD Checklist - Epic 2, Story 0a: Latency Budget Smoke Harness

**Date:** 2026-02-20
**Author:** Jeremiah
**Primary Test Level:** API

## Story Summary

Story 2.0a requires a deterministic latency smoke harness for verification interactions that blocks regressions before merge. The harness must report p50/p95/p99 latency percentiles for evidence-highlight and queue-advance paths, enforce thresholds with deterministic machine-readable failure output, and emit artifact metadata under `_bmad-output/test-artifacts`.

## Acceptance Criteria

1. Deterministic seeded runs report p50/p95/p99 for highlight and queue-advance and evaluate thresholds.
2. Threshold breaches return deterministic machine-readable details and non-zero process semantics.
3. Successful runs write metadata-rich summary artifacts under `_bmad-output/test-artifacts`.

## Failing Tests Created (RED Phase)

### E2E Tests (3 tests)

**File:** `tests/e2e/story-2-0a-latency-budget-smoke-harness.spec.ts` (55 lines)

- ✅ **Test:** [P0][AC1] should display deterministic seeded run results with p50/p95/p99 metrics for highlight and queue-advance
  - **Status:** RED - intentionally skipped until `/quality/latency-smoke` and metric selectors are implemented
  - **Verifies:** quality-gate percentile rendering and threshold status
- ✅ **Test:** [P0][AC2] should block merge gate view with deterministic machine-readable threshold breach details when a budget is exceeded
  - **Status:** RED - intentionally skipped until failure panel contract exists
  - **Verifies:** deterministic failure detail fields and gate failure status
- ✅ **Test:** [P1][AC3] should expose artifact summary metadata path and trend-comparison run metadata after a successful run
  - **Status:** RED - intentionally skipped until artifact metadata rendering exists
  - **Verifies:** artifact location and run metadata visibility

### API Tests (4 tests)

**File:** `tests/api/story-2-0a-latency-budget-smoke-harness.spec.ts` (147 lines)

- ✅ **Test:** [P0][AC1] should report p50/p95/p99 for highlight and queue-advance latency on seeded scenario runs
  - **Status:** RED - intentionally skipped until `/api/v1/perf/latency-smoke/run` exists
  - **Verifies:** percentile contract and threshold evaluation fields
- ✅ **Test:** [P0][AC2] should return deterministic machine-readable threshold failure output and fail the run
  - **Status:** RED - intentionally skipped until threshold evaluator exists
  - **Verifies:** deterministic failure payload with scenario, metric, percentile, threshold, and exit code semantics
- ✅ **Test:** [P1][AC3] should emit run summary metadata artifact under `_bmad-output/test-artifacts` for regression trend comparison
  - **Status:** RED - intentionally skipped until artifact endpoint exists
  - **Verifies:** output path and metadata contract
- ✅ **Test:** [P1][AC1] should reject non-deterministic scenario ordering to prevent flaky regression signals
  - **Status:** RED - intentionally skipped until scenario-validation contract exists
  - **Verifies:** deterministic ordering guardrail and validation error code

### Component Tests (0 tests)

No component tests were generated because this story is service/harness contract-centric.

## Data Factories Created

### Story 2.0a Red Data

**File:** `tests/support/fixtures/story-2-0a-red-phase-data.ts`

**Exports:**

- `story20aRedPhaseData`
- `story20aExpectedErrorCodes`

## Fixtures Created

### Latency Harness Input Fixture

**File:** `tests/support/fixtures/latency-smoke-harness.fixture.ts`

**Fixtures:**

- `latencyHarnessInput` - deterministic seed + threshold bundle for story 2.0a tests

## Mock Requirements

### Latency Smoke Runner API

**Endpoint:** `POST /api/v1/perf/latency-smoke/run`

**Success Response Contract:** percentile metrics (`p50/p95/p99`) and threshold evaluation booleans.

**Failure Response Contract:** `LATENCY_THRESHOLD_EXCEEDED` plus scenario/metric/observed percentile/threshold and non-zero exit-code semantics.

## Required data-testid Attributes

- `latency-smoke-seed-input`
- `latency-smoke-run-button`
- `latency-metric-highlight-p50`
- `latency-metric-highlight-p95`
- `latency-metric-highlight-p99`
- `latency-metric-queue-advance-p50`
- `latency-metric-queue-advance-p95`
- `latency-metric-queue-advance-p99`
- `latency-threshold-status-highlight`
- `latency-threshold-status-queue-advance`
- `latency-gate-status`
- `latency-gate-exit-code`
- `latency-failure-error-code`
- `latency-failure-scenario`
- `latency-failure-metric`
- `latency-failure-observed-percentile`
- `latency-failure-threshold-ms`
- `latency-artifact-path`
- `latency-artifact-run-id`
- `latency-artifact-harness-version`
- `latency-artifact-commit-sha`
- `latency-artifact-started-at`
- `latency-artifact-completed-at`

## Implementation Checklist

### Test: [P0][AC1] API percentile contract

**File:** `tests/api/story-2-0a-latency-budget-smoke-harness.spec.ts`

- [ ] Implement deterministic seeded scenario runner endpoint
- [ ] Calculate and return p50/p95/p99 for highlight and queue-advance
- [ ] Return threshold evaluation fields in deterministic machine-readable format
- [ ] Remove relevant `test.skip()` and run API story file
- [ ] ✅ Test passes (green phase)

### Test: [P0][AC2] API threshold failure contract

**File:** `tests/api/story-2-0a-latency-budget-smoke-harness.spec.ts`

- [ ] Enforce configured latency thresholds
- [ ] Return `LATENCY_THRESHOLD_EXCEEDED` with scenario/metric/percentile/threshold details
- [ ] Expose deterministic non-zero exit semantics in output contract
- [ ] Remove relevant `test.skip()` and run API story file
- [ ] ✅ Test passes (green phase)

### Test: [P1][AC3] API artifact contract

**File:** `tests/api/story-2-0a-latency-budget-smoke-harness.spec.ts`

- [ ] Persist run summary under `_bmad-output/test-artifacts`
- [ ] Include `run_id`, seed, scenario_count, commit, harness version, start/end timestamps
- [ ] Expose retrieval endpoint for artifact metadata
- [ ] Remove relevant `test.skip()` and run API story file
- [ ] ✅ Test passes (green phase)

### Test: [P0/P1] E2E quality-gate rendering

**File:** `tests/e2e/story-2-0a-latency-budget-smoke-harness.spec.ts`

- [ ] Build `/quality/latency-smoke` UI
- [ ] Add required `data-testid` attributes
- [ ] Render pass/fail threshold statuses and artifact metadata
- [ ] Remove relevant `test.skip()` and run E2E story file
- [ ] ✅ Test passes (green phase)

## Running Tests

```bash
# API story file
npx playwright test --project=api tests/api/story-2-0a-latency-budget-smoke-harness.spec.ts

# E2E story file
npx playwright test --project=chromium-e2e tests/e2e/story-2-0a-latency-budget-smoke-harness.spec.ts

# E2E headed/debug
npx playwright test --project=chromium-e2e tests/e2e/story-2-0a-latency-budget-smoke-harness.spec.ts --headed
npx playwright test --project=chromium-e2e tests/e2e/story-2-0a-latency-budget-smoke-harness.spec.ts --debug
```

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ API + E2E tests generated
- ✅ All tests intentionally marked `test.skip()` for safe red phase
- ✅ Story-specific fixture/data scaffolding created
- ✅ Required selector contract and implementation tasks documented

### GREEN Phase (DEV Team)

1. Implement API contracts first, remove API `test.skip()` incrementally.
2. Implement UI quality-gate surface, remove E2E `test.skip()`.
3. Keep runs deterministic; avoid random scenario ordering.

### REFACTOR Phase (DEV Team)

1. Consolidate latency schema typing and threshold evaluation helpers.
2. Remove duplication across API + UI result formatting.
3. Re-run all story tests after each refactor.

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
- `api-testing-patterns.md`
- `playwright-cli.md`

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test --project=api tests/api/story-2-0a-latency-budget-smoke-harness.spec.ts`

**Result:** 4 skipped

**Command:** `npx playwright test --project=chromium-e2e tests/e2e/story-2-0a-latency-budget-smoke-harness.spec.ts`

**Result:** 3 skipped

**Summary:**

- Total tests: 7
- Active passing: 0 (expected in RED phase)
- Intentionally skipped: 7
- Status: ✅ RED scaffolding verified

## Step Outputs

### Step 1 Output - Preflight and Context

- Story loaded: `/Users/jeremiahotis/projects/tabulara/_bmad-output/implementation-artifacts/2-0a-latency-budget-smoke-harness.md`
- Framework loaded: `/Users/jeremiahotis/projects/tabulara/playwright.config.ts`
- TEA config flags: `tea_use_playwright_utils=true`, `tea_browser_automation=auto`
- Prerequisites: PASS

### Step 2 Output - Generation Mode

- Mode selected: `AI generation`
- Rationale: ACs are deterministic and harness-centric; no complex recording required.

### Step 3 Output - Test Strategy

- Primary level: API
- Secondary level: E2E
- Priorities: P0 for AC1/AC2, P1 for AC3 and deterministic-ordering guardrail

### Step 4C Output - Aggregation

- Subprocess outputs:
  - `/tmp/tea-atdd-api-tests-2026-02-20T14-26-02Z.json`
  - `/tmp/tea-atdd-e2e-tests-2026-02-20T14-26-02Z.json`
- TDD validation: all tests contain `test.skip()`, no placeholder assertions
- Summary output: `/tmp/tea-atdd-summary-2026-02-20T14-26-02Z.json`

### Step 5 Output - Validation and Completion

- Validation checklist applied from `/_bmad/tea/workflows/testarch/atdd/checklist.md`
- All generated files present and readable
- One intermediate concurrent-run API attempt failed with local `EADDRINUSE` on `127.0.0.1:4174`; isolated rerun succeeded

**Generated by BMad TEA Agent** - 2026-02-20
