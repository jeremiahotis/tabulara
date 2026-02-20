---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-02-18T18:34:58Z
---

# ATDD Checklist - Epic 1, Story 1.1: Set Up Initial Project from Starter Template

**Date:** 2026-02-18
**Author:** Jeremiah
**Primary Test Level:** API (with E2E coverage for startup and dispatcher UX)

## Story Summary

This story establishes the local-first app baseline by scaffolding from the starter template, bringing up the desktop shell and local API reliably, and exposing versioned command mutation routes under `/api/v1`. It also defines strict command envelope validation so malformed requests are rejected deterministically without mutating domain state.

**As a** operations user  
**I want** the desktop app and local API to initialize reliably and validate command envelopes  
**So that** document processing starts in a secure offline environment with deterministic behavior

## Acceptance Criteria

1. Given a clean repository, when scaffold/install/config/dev-launch is done, then desktop shell starts and health checks pass, and `/api/v1` route group is available.
2. Given a command payload enters dispatcher, when required fields are missing (`command_id`, `type`, `actor`, `timestamp`, `payload`), then request is rejected with deterministic machine-readable error codes and no mutation/event append occurs.

## Failing Tests Created (RED Phase)

### E2E Tests (2 tests)

**File:** `tests/e2e/story-1-1-initial-project.spec.ts` (30 lines)

- ✅ **Test:** `[P0][AC1] should show desktop shell booted with frontend and backend health checks passing`
  - **Status:** RED - required startup indicators and health elements are not yet implemented.
  - **Verifies:** shell readiness, frontend/backend health, `/api/v1` badge visibility.
- ✅ **Test:** `[P0][AC2] should reject command submission when envelope fields are missing`
  - **Status:** RED - dispatcher form/state/error surfaces are not yet implemented.
  - **Verifies:** deterministic validation error display and no mutation/event state.

### API Tests (4 tests)

**File:** `tests/api/story-1-1-initial-project.spec.ts` (96 lines)

- ✅ **Test:** `[P0][AC1] should expose /api/v1 health status for desktop + local backend readiness`
  - **Status:** RED - `/api/v1/health` contract not implemented yet.
  - **Verifies:** route availability, service health payload, version marker.
- ✅ **Test:** `[P0][AC1] should accept a valid command envelope on /api/v1 command dispatcher`
  - **Status:** RED - dispatcher endpoint/handler not implemented yet.
  - **Verifies:** accepted command flow and acknowledgment payload.
- ✅ **Test:** `[P0][AC2] should reject missing envelope fields with deterministic machine-readable codes and no mutation`
  - **Status:** RED - envelope validation and deterministic error contract not implemented yet.
  - **Verifies:** validation code shape and non-mutation guarantees.
- ✅ **Test:** `[P1][AC2] should return deterministic per-field validation details for each required envelope field`
  - **Status:** RED - field-level validation details contract not implemented yet.
  - **Verifies:** per-field missing details and deterministic reasons.

### Component Tests (0 tests)

Not generated for this story. Component-level checks are deferred because the behavior is dominated by API contract + startup integration concerns.

## Data Factories Created

### Command Envelope Factory

**File:** `tests/support/fixtures/factories/command-envelope-factory.ts`

**Exports:**

- `createCommandEnvelope(overrides?)` - creates full valid command envelopes with explicit overrides.

## Fixtures Created

No new `test.extend()` fixture was required for RED generation in this story. Existing project fixtures remain unchanged.

## Mock Requirements

No external third-party service mocks are required for Story 1.1. Core mocks are local route-level or local API process behaviors.

## Required data-testid Attributes

### Startup Workspace

- `app-shell-ready` - startup readiness indicator.
- `frontend-health-status` - frontend health status value.
- `backend-health-status` - backend health status value.
- `api-version-badge` - current API route namespace indicator.

### Command Dispatcher

- `command-type-input` - input for command type.
- `command-submit-button` - submit action.
- `command-error-code` - machine-readable error code output.
- `command-error-missing-fields` - serialized/structured missing field list.
- `mutation-state` - mutation application status.
- `event-append-state` - event append status.

## Implementation Checklist

### Test: API health route available

**File:** `tests/api/story-1-1-initial-project.spec.ts`

- [ ] Add `/api/v1/health` route and contract response.
- [ ] Include frontend/backend status checks.
- [ ] Include `apiVersion: 'v1'` in response payload.
- [ ] Run test file and remove `test.skip()` when ready.

### Test: command dispatcher accepts valid envelope

**File:** `tests/api/story-1-1-initial-project.spec.ts`

- [ ] Add `/api/v1/commands/dispatch` route.
- [ ] Implement envelope parsing and command acceptance path.
- [ ] Return `202` and `{ accepted, command_id }`.
- [ ] Run test file and remove `test.skip()` when ready.

### Test: deterministic validation rejection and no mutation

**File:** `tests/api/story-1-1-initial-project.spec.ts`

- [ ] Implement required field validation for envelope fields.
- [ ] Return deterministic code `CMD_ENVELOPE_VALIDATION_FAILED` with missing field list.
- [ ] Guarantee `mutation_applied: false` and `event_appended: false` on invalid requests.
- [ ] Run test file and remove `test.skip()` when ready.

### Test: startup and dispatcher UX surfaces

**File:** `tests/e2e/story-1-1-initial-project.spec.ts`

- [ ] Render startup health indicators with required `data-testid` attributes.
- [ ] Build dispatcher form + missing field UX.
- [ ] Surface deterministic error code and missing fields.
- [ ] Surface mutation/event state labels.
- [ ] Run E2E file and remove `test.skip()` when ready.

## Running Tests

```bash
# E2E suite (configured in package.json)
npm run test:e2e

# Story-specific E2E file
npx playwright test tests/e2e/story-1-1-initial-project.spec.ts

# Story-specific API file (if API project is configured)
npx playwright test tests/api/story-1-1-initial-project.spec.ts
```

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- Tests written for expected behavior and intentionally marked with `test.skip()`.
- Assertions are concrete (no placeholder assertions).
- Contract expectations and UI selectors are explicit.

### GREEN Phase (Next)

- Implement `/api/v1` health + command dispatch + deterministic validation.
- Implement startup/dispatcher UI with required `data-testid` values.
- Remove `test.skip()` test-by-test as each implementation becomes ready.
- Run tests and make them pass.

### REFACTOR Phase

- Improve route structure, validation utilities, and test fixture composition.
- Keep tests deterministic and maintain clear failure messages.

## Test Execution Evidence

RED verification was performed structurally for this handoff by ensuring every generated test uses `test.skip()` and expected-behavior assertions. Full runtime failure execution is intentionally deferred until implementation begins and skip markers are removed per test.

## Workflow Progress Log

### Step 1: Preflight and Context

- Loaded story file and extracted both acceptance criteria.
- Verified Playwright config and existing test patterns in `tests/`.
- Loaded required TEA knowledge fragments (core + Playwright Utils + CLI).

### Step 2: Generation Mode

- Selected **AI Generation** mode (`tea_browser_automation=auto`, but browser recording not required for this story scope).

### Step 3: Test Strategy

- Chosen levels: API-first for contract behavior; E2E for startup and dispatcher UX.
- Priorities: P0 for critical path, P1 for field-level detail coverage.
- Ensured all tests are RED-phase (`test.skip()`).

### Step 4: Aggregate

- Created files:
  - `tests/api/story-1-1-initial-project.spec.ts`
  - `tests/e2e/story-1-1-initial-project.spec.ts`
  - `tests/support/fixtures/factories/command-envelope-factory.ts`
- Wrote subprocess artifacts:
  - `/tmp/tea-atdd-api-tests-1771439719275.json`
  - `/tmp/tea-atdd-e2e-tests-1771439719275.json`
  - `/tmp/tea-atdd-summary-1771439719275.json`
- Persisted copies under `_bmad-output/test-artifacts/temp/`.

### Step 5: Validate and Complete

- Confirmed all generated tests include `test.skip()`.
- Confirmed no placeholder assertions.
- Confirmed output checklist is saved at the expected path.

## Next Steps

1. Implement Story 1.1 behavior in app + local API.
2. Remove `test.skip()` incrementally and run each test group.
3. Once green, proceed with broader automation and CI gate setup.
