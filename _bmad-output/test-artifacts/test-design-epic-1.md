---
stepsCompleted: [1, 2, 3, 4, 5]
lastStep: 'step-05-generate-output'
lastSaved: '2026-02-18'
---

# Test Design: Epic 1 - Secure Session Intake and Extraction Readiness

**Date:** 2026-02-18  
**Author:** Jeremiah  
**Status:** Draft

---

## Executive Summary

**Scope:** full test design for Epic 1

**Risk Summary:**

- Total risks identified: 7
- High-priority risks (>=6): 4
- Critical categories: TECH, DATA

**Coverage Summary:**

- P0 scenarios: 9 (~24-36 hours)
- P1 scenarios: 5 (~18-30 hours)
- P2/P3 scenarios: 3 (~10-22 hours)
- **Total effort**: ~52-88 hours (~1.5-3 weeks)

---

## Not in Scope

| Item | Reasoning | Mitigation |
| --- | --- | --- |
| External OCR benchmarking vs cloud engines | Outside Epic 1 contract and local-first scope | Validate deterministic behavior of selected local pipeline only |
| Cloud sync and multi-user concurrency | Explicitly out of scope for current milestone | Reassess in later epics with dedicated architecture/test design |
| Mobile/tablet workflows | Epic 1 targets desktop runtime and local API bootstrapping | Keep export contracts portable and add downstream client validation later |

---

## Risk Assessment

### High-Priority Risks (Score >=6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-001 | DATA | Accepted commands may fail to append immutable events with valid `caused_by` linkage | 2 | 3 | 6 | Add command-to-event integrity assertions across create/pin/import/preprocess/extract flows | Backend + QA | Sprint 1 |
| R-002 | TECH | Command envelope validation may be inconsistent across endpoints (`command_id`, `type`, `actor`, `timestamp`, `payload`) | 2 | 3 | 6 | Add API negative tests for each missing field and deterministic error-code checks | Backend + QA | Sprint 1 |
| R-003 | DATA | Extraction failure path could leave partial state/event writes (atomicity break) | 2 | 3 | 6 | Add failure-injection integration suite for `RunExtraction` rollback behavior | Backend | Sprint 1 |
| R-004 | TECH | Reprocess transitions may allow invalid lifecycle moves or mutate confirmed data | 2 | 3 | 6 | Add transition-matrix tests for permitted vs forbidden `ReprocessDocument` states | Backend + QA | Sprint 1-2 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R-005 | PERF | Preprocessing/extraction latency may exceed expected local-interactive performance | 2 | 2 | 4 | Add nightly benchmark suite with representative documents and P95 budget checks | QA + Platform |
| R-006 | BUS | Duplicate handling may create weak lineage/correlation semantics in downstream review | 2 | 2 | 4 | Add duplicate-correlation and provenance API assertions | Backend + QA |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| --- | --- | --- | --- | --- | --- | --- |
| R-007 | OPS | Startup health checks may miss degraded local backend readiness conditions | 1 | 2 | 2 | Monitor + add smoke check gate |

### Risk Category Legend

- **TECH**: Technical/architecture
- **SEC**: Security
- **PERF**: Performance
- **DATA**: Data integrity
- **BUS**: Business impact
- **OPS**: Operations

---

## Entry Criteria

- [ ] Epic 1 stories and acceptance criteria baselined (`epic-1-stories.md`)
- [ ] Local API runtime reachable with `/api/v1` route group in dev environment
- [ ] Test data factories available for session/document lifecycle setup
- [ ] Backend exposes deterministic error payloads for envelope and transition failures
- [ ] Feature implementation branch includes command handlers for Stories 1.1-1.5

## Exit Criteria

- [ ] All P0 tests pass (100%)
- [ ] P1 pass rate >=95% or exceptions triaged with owners
- [ ] No open unmitigated high-priority risks (R-001 to R-004)
- [ ] Epic 1 acceptance criteria coverage >=80% with no uncovered P0 criteria
- [ ] Rollback and transition determinism checks green for extraction/reprocess paths

---

## Test Coverage Plan

### P0 (Critical)

**Criteria:** Blocks core functionality + high risk (>=6) + no workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| Command envelope guard enforcement across required fields | API | R-002 | 5 | QA | One case per missing envelope field + deterministic error code assertion |
| Accepted command must append valid immutable event linkage | Integration | R-001 | 3 | QA + Backend | Validate `caused_by` for CreateSession, PinSession, RunExtraction |
| Extraction failure must roll back state and event append | Integration | R-003 | 2 | Backend | Failure-injection path coverage |
| Reprocess lifecycle transition gate correctness | API/Integration | R-004 | 3 | QA + Backend | Includes forbidden transition rejection and preserved confirmed data |
| Dev bootstrap and `/api/v1` availability smoke | E2E | R-007 | 1 | QA | Startup confidence gate |

**Total P0**: 9 scenarios, ~24-36 hours

### P1 (High)

**Criteria:** Important features + medium/high risk + common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| Import flow persists metadata/blob refs and emits `DocumentImported` | Integration | R-001 | 1 | QA | Includes per-command event assertion |
| Duplicate handling emits deterministic correlation metadata | API | R-006 | 1 | QA | Correlation and provenance contract checks |
| Preprocessing command produces derived artifacts + event | Integration | R-001 | 1 | QA | Same-transaction consistency check |
| Command idempotency conflict/replay behavior | API | R-003 | 1 | QA + Backend | `command_id` duplicate semantics |
| Audit-chain query confirms row-to-event traceability | Integration | R-001 | 1 | Backend | Integrity check for lifecycle operations |

**Total P1**: 5 scenarios, ~18-30 hours

### P2 (Medium)

**Criteria:** Secondary flows + low/medium risk + edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| Queue/provenance UI accept flow remains consistent | E2E | R-006 | 1 | QA | Existing example flow hardened for production selectors |
| Preprocess/extract performance thresholds on representative docs | API/Perf | R-005 | 1 | QA + Platform | Nightly trend capture with P95 budget |

**Total P2**: 2 scenarios, ~8-16 hours

### P3 (Low)

**Criteria:** Nice-to-have, exploratory, benchmark extensions

| Requirement | Test Level | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- |
| Extended startup resilience scenarios (resource pressure, slow disk) | Exploratory | 1 | QA + Platform | Weekly/manual deep-dive |

**Total P3**: 1 scenario, ~2-6 hours

---

## Execution Strategy

- **PR:** Run all functional P0 + P1 tests (and fast P2 where runtime allows) with target <=15 minutes via parallel workers.
- **Nightly:** Run full P0/P1/P2 set plus performance benchmarks and extended failure-injection loops.
- **Weekly:** Run long-running burn-in, stress, and exploratory operational suites.

Execution philosophy: run everything in PRs if runtime remains practical; defer only expensive/long-running suites.

---

## Resource Estimates

### Test Development Effort

| Priority | Scenario Count | Effort Range | Notes |
| --- | --- | --- | --- |
| P0 | 9 | ~24-36 hours | Highest complexity and most backend dependency |
| P1 | 5 | ~18-30 hours | Integration depth and contract checks |
| P2 | 2 | ~8-16 hours | Performance and UI resilience checks |
| P3 | 1 | ~2-6 hours | Exploratory operational checks |
| **Total** | **17** | **~52-88 hours** | **~1.5-3 weeks for 1 QA** |

### Prerequisites

**Test Data:**

- Session/document factories with deterministic IDs and cleanup hooks
- Command payload builders for envelope-negative coverage

**Tooling:**

- Playwright for E2E + API request testing
- Local failure-injection harness for extraction rollback checks

**Environment:**

- Local desktop runtime with backend process health visibility
- CI runners with isolated test artifacts in `_bmad-output/test-artifacts`

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100%
- **P1 pass rate**: >=95%
- **P2/P3 pass rate**: >=90% (informational unless linked to high-risk areas)
- **High-risk mitigations (R-001 to R-004)**: complete or formally waived before release

### Coverage Targets

- **Critical paths**: >=80%
- **Command/event integrity checks**: 100% for accepted command flows in Epic 1
- **Lifecycle transition checks**: >=90% for reprocess and extraction transitions
- **Edge cases**: >=50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (>=6) items unmitigated without explicit waiver
- [ ] Data-integrity checks (DATA category) pass 100% for covered command flows
- [ ] Extraction rollback behavior validated in automated suites

---

## Mitigation Plans

### R-001: Event linkage integrity drift (Score: 6)

**Mitigation Strategy:** Introduce integration checks asserting accepted command -> event append with valid `caused_by`, and enforce CI gate on failure.  
**Owner:** Backend + QA  
**Timeline:** Sprint 1  
**Status:** Planned  
**Verification:** CI report shows 100% pass on event-linkage assertions for Stories 1.2-1.5.

### R-002: Command envelope guard inconsistency (Score: 6)

**Mitigation Strategy:** Add comprehensive negative API suite for all required envelope fields and deterministic error responses.  
**Owner:** QA + Backend  
**Timeline:** Sprint 1  
**Status:** Planned  
**Verification:** Required-field matrix tests pass and no mutation/event append occurs on invalid payloads.

### R-003: Extraction rollback failure (Score: 6)

**Mitigation Strategy:** Build failure-injection integration tests around extraction transaction boundary and assert zero partial writes.  
**Owner:** Backend  
**Timeline:** Sprint 1  
**Status:** Planned  
**Verification:** Fault-injection suite proves state/event parity before and after induced failures.

### R-004: Invalid reprocess transitions (Score: 6)

**Mitigation Strategy:** Add transition-matrix tests with locked/confirmed/unresolved fixtures and explicit forbidden-path checks.  
**Owner:** Backend + QA  
**Timeline:** Sprint 1-2  
**Status:** Planned  
**Verification:** Transition matrix report shows deterministic accept/reject behavior across all covered states.

---

## Assumptions and Dependencies

### Assumptions

1. Epic 1 implementation preserves command-only mutation boundaries.
2. Event payloads include stable identifiers sufficient for deterministic assertions.
3. Local environment remains offline-first with no external runtime dependency.

### Dependencies

1. Deterministic error-code catalog for guard failures - required in Sprint 1.
2. Failure-injection hooks for extraction command pipeline - required in Sprint 1.
3. Stable fixtures/seeding strategy for session/document setup - required before full P0 automation.

### Risks to Plan

- **Risk:** Architecture/implementation drift from PRD event contract during rapid delivery.
  - **Impact:** Test plan rework and false-negative gate outcomes.
  - **Contingency:** Weekly contract-drift check between Epic stories, API handlers, and event schemas.

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests (separate workflow; not auto-run).
- Run `*automate` for broader scenario generation after implementation stabilizes.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager
- [ ] Tech Lead
- [ ] QA Lead

**Comments:**

---

---

## Interworking & Regression

| Service/Component | Impact | Regression Scope |
| --- | --- | --- |
| Command Dispatcher + Guards | Core validation and rejection semantics | Envelope contract and deterministic error-code suites |
| Session Lifecycle Handlers | Create/pin/reprocess state transitions | Transition matrix and event-linkage checks |
| Extraction Pipeline | Derived data persistence and rollback boundaries | Success/failure transaction tests and replay parity |
| Audit/Event Store | Immutable traceability chain | `caused_by` and append-only integrity assertions |

---

## Appendix

### Knowledge Base References

- `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/risk-governance.md`
- `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/probability-impact.md`
- `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/test-levels-framework.md`
- `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/test-priorities-matrix.md`
- `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/playwright-cli.md`

### Related Documents

- PRD: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-prd-command-event-model.md`
- Epic stories: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epic-1-stories.md`
- Epic inventory: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md`
- Architecture: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md`
- Prior system-level design: `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/test-design-architecture.md`
- Prior QA plan: `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/test-design-qa.md`

---

**Generated by**: BMad TEA Agent - Test Architect Module  
**Workflow**: `_bmad/tea/testarch/test-design`  
**Version**: 5.0 (Step-file architecture)
