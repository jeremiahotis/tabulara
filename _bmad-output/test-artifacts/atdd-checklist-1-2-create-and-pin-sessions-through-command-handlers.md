---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-02-18T22:12:31Z
---

# ATDD Checklist - Epic 1, Story 1.2: Create and Pin Sessions Through Command Handlers

**Date:** 2026-02-18
**Author:** Jeremiah
**Primary Test Level:** API (with E2E workflow coverage)

## Story Summary

This story defines command-driven session lifecycle mutations for `CreateSession` and `PinSession`/unpin behavior. The critical quality bar is transactional integrity: accepted commands must persist state updates and append immutable audit events with valid `caused_by` linkage in the same atomic operation.

**As a** operations user  
**I want** to create and pin sessions through explicit commands  
**So that** every work session is traceable and operationally organized

## Acceptance Criteria

1. Given an active project context, when `CreateSession` is issued, then a new session record is created through command handlers only, and `SessionCreated` is appended to `audit_log` with valid `caused_by` linkage.
2. Given an existing session, when `PinSession` (or unpin behavior) is issued, then session pin state updates are persisted atomically, and corresponding events (`SessionPinned`/`SessionUnpinned`) are appended in the same transaction.

## Failing Tests Created (RED Phase)

### E2E Tests (3 tests)

**File:** `tests/e2e/story-1-2-create-and-pin-sessions-through-command-handlers.spec.ts` (72 lines)

- ✅ **Test:** `[P0][AC1] should create session through CreateSession command and surface SessionCreated traceability`
  - **Status:** RED - UI controls and session/audit rendering for this workflow are not implemented.
  - **Verifies:** command submission path, session status visibility, event traceability surfaces.
- ✅ **Test:** `[P0][AC2] should pin an existing session and append SessionPinned atomically`
  - **Status:** RED - pin toggle workflow and atomic transaction status surfaces are not implemented.
  - **Verifies:** pin state UI, `SessionPinned` event visibility, atomic transaction indication.
- ✅ **Test:** `[P1][AC2] should unpin an existing session and append SessionUnpinned atomically`
  - **Status:** RED - unpin workflow and mirrored audit event UI are not implemented.
  - **Verifies:** unpin state UI and `SessionUnpinned` traceability.

### API Tests (4 tests)

**File:** `tests/api/story-1-2-create-and-pin-sessions-through-command-handlers.spec.ts` (124 lines)

- ✅ **Test:** `[P0][AC1] should create a session only through CreateSession command handlers`
  - **Status:** RED - dispatcher does not yet return `session` creation contract details.
  - **Verifies:** accepted command path and command-only mutation contract.
- ✅ **Test:** `[P0][AC1] should append SessionCreated in audit_log with caused_by linked to command_id`
  - **Status:** RED - dispatcher does not yet expose/guarantee `audit_log` event payload linkage.
  - **Verifies:** immutable event append semantics and `caused_by` integrity.
- ✅ **Test:** `[P0][AC2] should pin a session atomically and append SessionPinned in the same transaction`
  - **Status:** RED - atomic transaction metadata and `SessionPinned` payload expectations are not implemented.
  - **Verifies:** pin-state mutation + same-transaction event append.
- ✅ **Test:** `[P1][AC2] should unpin a session atomically and append SessionUnpinned in the same transaction`
  - **Status:** RED - unpin contract/event linkage assertions are not implemented.
  - **Verifies:** unpin-state mutation + same-transaction `SessionUnpinned` emission.

### Component Tests (0 tests)

Not generated for Story 1.2. This scope is command-layer contract and integration flow centric.

## Data Factories Created

### Session Command Factory

**File:** `tests/support/fixtures/factories/session-command-factory.ts`

**Exports:**

- `createCreateSessionCommandEnvelope(options?)` - creates typed `CreateSession` envelopes with override support.
- `createPinSessionCommandEnvelope(options?)` - creates typed `PinSession` envelopes for pin and unpin scenarios.

## Fixtures Created

### Session Command Data

**File:** `tests/support/fixtures/session-command-data.ts`

**Purpose:** Provides shared command defaults and required `data-testid` inventory for Story 1.2 implementation.

## Mock Requirements

No external third-party service mocks are required for Story 1.2. The required behavior is local command dispatch + event append contract integrity.

## Required data-testid Attributes

### Command Input + Session Controls

- `command-type-input` - command type field.
- `command-submit-button` - command submit action.
- `project-id-input` - project scope field for `CreateSession`.
- `schema-id-input` - schema scope field for `CreateSession`.
- `session-list-item-latest` - latest created/active session row.
- `session-status-latest` - latest session lifecycle status.
- `session-pin-toggle` - pin/unpin control for selected session.
- `session-pinned-indicator` - pinned/unpinned visual state.
- `transaction-status-latest` - atomic transaction state display.

### Audit Traceability

- `audit-event-type-latest` - latest event type label.
- `audit-event-caused-by-latest` - latest event `caused_by` value.

## Implementation Checklist

### Test: CreateSession command creates session via command handlers

**File:** `tests/api/story-1-2-create-and-pin-sessions-through-command-handlers.spec.ts`

- [ ] Add command routing for `CreateSession` through dispatcher/handler.
- [ ] Persist session record with `created` status.
- [ ] Return session contract details in dispatch response.
- [ ] Remove `test.skip()` and run test.

### Test: SessionCreated event append with valid caused_by linkage

**File:** `tests/api/story-1-2-create-and-pin-sessions-through-command-handlers.spec.ts`

- [ ] Append immutable `SessionCreated` to `audit_log`.
- [ ] Ensure event envelope includes `caused_by = command_id`.
- [ ] Ensure event payload contains expected project/schema context.
- [ ] Remove `test.skip()` and run test.

### Test: PinSession atomic update with SessionPinned

**File:** `tests/api/story-1-2-create-and-pin-sessions-through-command-handlers.spec.ts`

- [ ] Implement pin-state mutation path in command handler.
- [ ] Persist pin-state update and event append in a single transaction.
- [ ] Emit `SessionPinned` with valid `caused_by`.
- [ ] Remove `test.skip()` and run test.

### Test: Unpin atomic update with SessionUnpinned

**File:** `tests/api/story-1-2-create-and-pin-sessions-through-command-handlers.spec.ts`

- [ ] Implement unpin-state mutation path in command handler.
- [ ] Persist unpin-state update and event append in a single transaction.
- [ ] Emit `SessionUnpinned` with valid `caused_by`.
- [ ] Remove `test.skip()` and run test.

### Test: E2E command workflow + traceability surfaces

**File:** `tests/e2e/story-1-2-create-and-pin-sessions-through-command-handlers.spec.ts`

- [ ] Implement CreateSession form fields (`project-id-input`, `schema-id-input`).
- [ ] Render session list row and lifecycle status.
- [ ] Implement pin/unpin UI control with deterministic state rendering.
- [ ] Render latest audit event type and `caused_by`.
- [ ] Render atomic transaction outcome.
- [ ] Remove `test.skip()` and run test.

## Running Tests

```bash
# Story 1.2 API RED suite
npx playwright test tests/api/story-1-2-create-and-pin-sessions-through-command-handlers.spec.ts --project=api

# Story 1.2 E2E RED suite
npx playwright test tests/e2e/story-1-2-create-and-pin-sessions-through-command-handlers.spec.ts --project=chromium-e2e
```

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- Tests are written and intentionally marked with `test.skip()`.
- Assertions describe expected command/event behavior (no placeholder assertions).
- API + E2E contracts define the implementation target surface.

### GREEN Phase (Next)

- Implement command handlers and transactional event append behavior for Story 1.2.
- Implement UI fields and audit/pin status surfaces.
- Remove `test.skip()` incrementally and make tests pass.

### REFACTOR Phase

- Consolidate command envelope/builders across stories.
- Improve fixture composition and reduce duplicated assertion scaffolding.
- Preserve deterministic, traceable error contracts.

## Test Execution Evidence

Executed:

- `npx playwright test tests/api/story-1-2-create-and-pin-sessions-through-command-handlers.spec.ts --project=api` → **4 skipped**
- `npx playwright test tests/e2e/story-1-2-create-and-pin-sessions-through-command-handlers.spec.ts --project=chromium-e2e` → **3 skipped**

RED validation was enforced structurally:

- every generated test contains `test.skip()`;
- no placeholder assertions (`expect(true).toBe(true)` absent);
- tests assert expected behavior contracts that current implementation does not satisfy.

## Workflow Progress Log

### Step 1: Preflight and Context

- Loaded story: `_bmad-output/implementation-artifacts/1-2-create-and-pin-sessions-through-command-handlers.md`.
- Verified framework config in `playwright.config.ts` and test scaffolding in `tests/`.
- Loaded TEA knowledge fragments: core quality, selector/timing resilience, Playwright-utils, and CLI guidance.

### Step 2: Generation Mode

- Selected **AI generation mode**.
- Browser recording was not required because ACs are backend contract-driven and selectors were specified as required implementation targets.

### Step 3: Test Strategy

- Selected **API-first** coverage for command/event contract and atomicity checks.
- Added **E2E** coverage for operator workflow and traceability UI surfaces.
- Prioritized P0 for core command/event integrity, P1 for unpin parity.

### Step 4: Aggregate

- Generated RED subprocess artifacts in parallel:
  - `/tmp/tea-atdd-api-tests-1771452751.json`
  - `/tmp/tea-atdd-e2e-tests-1771452751.json`
  - `/tmp/tea-atdd-summary-1771452751.json`
- Persisted copies to:
  - `_bmad-output/test-artifacts/temp/tea-atdd-api-tests-1771452751.json`
  - `_bmad-output/test-artifacts/temp/tea-atdd-e2e-tests-1771452751.json`
  - `_bmad-output/test-artifacts/temp/tea-atdd-summary-1771452751.json`
- Created/updated files:
  - `tests/api/story-1-2-create-and-pin-sessions-through-command-handlers.spec.ts`
  - `tests/e2e/story-1-2-create-and-pin-sessions-through-command-handlers.spec.ts`
  - `tests/support/fixtures/factories/session-command-factory.ts`
  - `tests/support/fixtures/session-command-data.ts`

### Step 5: Validate and Complete

- Confirmed all generated tests include `test.skip()` and expected-behavior assertions.
- Confirmed checklist output saved at this path.
- Confirmed Story 1.2 API/E2E test files execute and are currently skipped as intended for RED handoff.

## Next Steps

1. Implement Story 1.2 command handlers and atomic event append behavior.
2. Implement session command UI fields + audit/transaction status surfaces.
3. Remove `test.skip()` test-by-test and drive to green.
