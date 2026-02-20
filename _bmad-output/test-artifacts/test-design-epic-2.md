---
stepsCompleted: [1, 2, 3, 4, 5]
lastStep: 'step-05-generate-output'
lastSaved: '2026-02-20'
---

# Test Design: Epic 2 - Verification, Mapping, and Quality Resolution

**Date:** 2026-02-20  
**Author:** Jeremiah  
**Status:** Draft

---

## Executive Summary

**Scope:** full test design for Epic 2

**Risk Summary:**

- Total risks identified: 8
- High-priority risks (>=6): 5
- Critical categories: DATA, PERF, TECH

**Coverage Summary:**

- P0 scenarios: 12 (~34-52 hours)
- P1 scenarios: 9 (~26-42 hours)
- P2/P3 scenarios: 5 (~10-20 hours)
- **Total effort**: ~70-114 hours (~2.5-4 weeks)

---

## Not in Scope

| Item | Reasoning | Mitigation |
| --- | --- | --- |
| OCR model-quality improvements | Epic 2 focuses verification/mapping behavior after extraction output exists | Validate robustness against extraction variance; defer model optimization to extraction roadmap |
| Multi-user collaboration and conflict resolution | Current architecture is local-first single operator | Preserve deterministic local-state guarantees and revisit in future multi-user epic |
| Cloud synchronization and remote review queues | Explicitly outside local runtime requirements | Keep export/audit contracts portable for later sync layer validation |

---

## Risk Assessment

### High-Priority Risks (Score >=6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-201 | DATA | Verification/mapping commands may mutate state without matching append-only event linkage (`caused_by` drift) | 2 | 3 | 6 | Add integration assertions for Assign/Item/Extra/Review/Validation commands: accepted command -> state mutation + immutable event | Backend + QA | Sprint 2 |
| R-202 | TECH | Queue navigation context may reset during validation refresh/filter/panel toggles, causing operators to lose place | 2 | 3 | 6 | Add deterministic navigation tests across non-destructive actions and session restore paths | QA + Frontend | Sprint 2 |
| R-203 | PERF | Queue auto-advance and evidence highlighting may miss latency targets (<150ms advance, <100ms highlight) on office hardware | 3 | 2 | 6 | Add benchmark instrumentation and CI trend checks with representative datasets and hardware profiles | QA + Platform | Sprint 2-3 |
| R-204 | DATA | Validation override path may bypass audit requirements (missing reason/metadata) and weaken export trust | 2 | 3 | 6 | Add API contract tests enforcing required override rationale and event metadata invariants | Backend + QA | Sprint 2 |
| R-205 | BUS | Batch resolve actions may unintentionally alter non-target queue items/order, harming throughput and trust | 2 | 3 | 6 | Add batch-target isolation tests and queue-order invariance assertions | QA + Frontend | Sprint 2 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R-206 | DATA | Rule-learning immediate effect may produce unexpected value updates without clear provenance attribution | 2 | 2 | 4 | Add provenance and recalculation consistency checks for anchor/dictionary rule application | Backend + QA |
| R-207 | OPS | Story-status integrity checks could drift across CI/local hooks and markdown projections | 2 | 2 | 4 | Add status-integrity command tests and CI gate assertions (Story 2.12) | Platform + QA |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| --- | --- | --- | --- | --- | --- | --- |
| R-208 | SEC | Keyboard accessibility regressions in dense verification screens may degrade compliance without immediate outages | 1 | 2 | 2 | Monitor + include a11y checks in nightly UI audits |

### Risk Category Legend

- **TECH**: Technical/architecture
- **SEC**: Security
- **PERF**: Performance
- **DATA**: Data integrity
- **BUS**: Business impact
- **OPS**: Operations

---

## Entry Criteria

- [ ] Epic 2 requirements and ACs confirmed from `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md`
- [ ] Verification queue, evidence viewer, and mapping command endpoints available in test environment
- [ ] Event/audit storage assertions available for review, validation, mapping, and learning commands
- [ ] Validation and override APIs expose deterministic reason codes and payload schema
- [ ] Epic 2 Enablement slice accepted and merged:
  - [ ] 2.0a latency budget smoke harness (fixed scenario set, percentile output, threshold enforcement)
  - [ ] 2.0b provenance contract v1 (append-only envelope populated for all rule-derived artifacts)
  - [ ] 2.0c status-integrity verifier (same contract + exit codes locally and in CI)
- [ ] Performance telemetry hooks for queue advance and highlight latency are enabled in local and CI execution paths

## Exit Criteria

- [ ] All P0 tests pass (100%)
- [ ] P1 pass rate >=95% or explicit waiver with owner/timeline
- [ ] No open unmitigated high-priority risks (R-201 to R-205)
- [ ] Epic 2 AC coverage >=80% with no uncovered P0 behavior
- [ ] Queue determinism, provenance visibility, and override-audit invariants validated
- [ ] No rule-derived artifact is accepted without populated provenance envelope fields
- [ ] Status-integrity verifier passes identically in local and CI runs

---

## Enablement Story Traceability (2.0a/2.0b/2.0c)

| Story | Acceptance Criteria Covered | Planned Coverage Location | Gate Expectation |
| --- | --- | --- | --- |
| 2.0a Latency Budget Smoke Harness | AC1 percentile reporting, AC2 threshold failure contract, AC3 artifact persistence | P0 row "Story 2.0a AC1-AC2...", P1 row "Story 2.0a AC3..." | Threshold breach exits non-zero; artifact summary persisted under `_bmad-output/test-artifacts` |
| 2.0b Provenance Contract v1 | AC1 envelope completeness + stable linkage, AC2 rejection with no partial mutation, AC3 append-only recalculation history | P0 row "Story 2.0b AC2...", P1 rows "Story 2.0b AC1..." and "Story 2.0b AC3..." | 100% rule-derived outputs carry required contract fields; no mutable provenance history |
| 2.0c Status-Integrity Verifier Parity | AC1 deterministic mismatch output + non-zero, AC2 local/CI command parity, AC3 deterministic zero-exit success | P0 row "Story 2.0c AC1-AC2...", P1 row "Story 2.0c AC3..." | Same verifier contract and exit behavior in local and CI gates |

---

## Test Coverage Plan

### P0 (Critical)

**Criteria:** Blocks core functionality + high risk (>=6) + no workaround

| Story/Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| Story 2.0b AC2: invalid/missing required provenance fields are rejected with no partial mutation | API/Integration | R-206 | 1 | Backend + QA | Deterministic contract-violation payload and transactional rollback assertions |
| Story 2.0c AC1-AC2: verifier reports drift deterministically and exits non-zero with same command/exit contract in local and CI | API/CLI | R-207 | 1 | Platform + QA | Includes story key, expected/actual status, and artifact path |
| Field mapping commands append immutable events with valid linkage | Integration | R-201 | 2 | Backend + QA | `AssignFieldValue`, lock/unlock flow |
| Item/extra-table command transactions preserve atomicity and event integrity | Integration | R-201 | 2 | Backend + QA | Add/delete/assign/lock row coverage |
| Queue navigation context persistence across resolve/filter/validation refresh | E2E | R-202 | 2 | QA + Frontend | Active item + position invariance |
| Batch resolve only affects targeted items and preserves unresolved ordering | E2E/API | R-205 | 1 | QA | Deterministic ordering assertions |
| Validation override requires deterministic reason and audit metadata | API/Integration | R-204 | 1 | QA + Backend | Reject missing rationale |
| Story 2.0a AC1-AC2: latency harness reports p50/p95/p99 and enforces threshold non-zero failure contract | E2E/Perf | R-203 | 2 | QA + Platform | <100ms highlight, <150ms advance, machine-readable failure payload |

**Total P0**: 12 scenarios, ~34-52 hours

### P1 (High)

**Criteria:** Important features + medium/high risk + common workflows

| Story/Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| Story 2.0b AC1: rule-derived outputs persist full provenance envelope with stable identifiers | Integration/E2E | R-206 | 2 | Backend + QA | Anchor + dictionary rule paths |
| Story 2.0b AC3: repeated recalculation appends new provenance envelopes without mutating prior records, and remains UI-reachable | Integration/E2E | R-206 | 1 | Backend + QA | Verification/detail provenance traversal checks |
| Story 2.0a AC3: successful harness run persists deterministic summary artifact bundle with trend metadata | CLI/Artifact | R-203 | 1 | QA + Platform | Artifact path and metadata schema assertions |
| Story 2.0c AC3: synchronized status exits zero with deterministic success summary for logs/automation | API/CLI | R-207 | 1 | Platform + QA | Success contract parity check local vs CI |
| Validation runs incrementally after mutating commands without blocking active flow | E2E | R-202 | 1 | QA + Frontend | Focus continuity checks |
| Provenance controls reachable via keyboard for all displayed values | E2E/a11y | R-208 | 1 | QA | Non-hover access validation |
| Session reopen restores active queue item and workspace context | E2E | R-202 | 1 | QA | Deterministic restore path |
| Done-transition evidence gate rejects incomplete review evidence with reason code | API | R-207 | 1 | Backend + QA | Status remains unchanged |

**Total P1**: 9 scenarios, ~26-42 hours

### P2 (Medium)

**Criteria:** Secondary flows + low/medium risk + edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| Performance telemetry reproducibility across benchmark reruns | Perf | R-203 | 1 | Platform + QA | Trend consistency checks |
| Queue interactions remain stable during concurrent extraction/validation background work | E2E | R-203 | 1 | QA | Non-blocking UX validation |
| Rule-influenced value recalculation across sessions improves baseline quality metrics | API/Analytics | R-206 | 1 | Backend + QA | Baseline vs learned-rules run |

**Total P2**: 3 scenarios, ~8-14 hours

### P3 (Low)

**Criteria:** Nice-to-have, exploratory, benchmark extensions

| Requirement | Test Level | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- |
| Extended accessibility regression sweeps for dense review surfaces | Exploratory/a11y | 1 | QA | Weekly deep-dive |
| Long-run queue throughput soak tests with large datasets | Perf soak | 1 | Platform + QA | Weekly only |

**Total P3**: 2 scenarios, ~2-6 hours

---

## Execution Strategy

- **PR:** Run all functional P0 + P1 tests and fast P2 checks, targeting <=15 minutes with parallel workers, including 2.0a threshold checks, 2.0b contract-violation tests, and 2.0c mismatch-drift checks.
- **Nightly:** Run full P0/P1/P2 set with performance telemetry capture, deterministic re-run checks, and append-only provenance history validation.
- **Weekly:** Run long-duration soak/benchmark and expanded accessibility sweeps.

Execution philosophy: run everything in PRs unless suite cost is meaningfully high; defer only expensive or long-running checks.

---

## Resource Estimates

### Test Development Effort

| Priority | Scenario Count | Effort Range | Notes |
| --- | --- | --- | --- |
| P0 | 12 | ~34-52 hours | High-risk data/queue/performance invariants plus enablement blockers |
| P1 | 9 | ~26-42 hours | Workflow continuity, provenance append-only checks, and gate parity |
| P2 | 3 | ~8-14 hours | Benchmark and resilience checks |
| P3 | 2 | ~2-6 hours | Exploratory and soak suites |
| **Total** | **26** | **~70-114 hours** | **~2.5-4 weeks for 1 QA** |

### Prerequisites

**Test Data:**

- Queue/evidence fixtures with deterministic ordering and provenance references
- Mapping/rule-learning fixtures covering fields, item rows, extra tables

**Tooling:**

- Playwright for E2E/UI + API request coverage
- CI hook harness for status-integrity gate validation

**Environment:**

- Local desktop runtime with backend and validation workers enabled
- CI artifacts stored under `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts`

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100%
- **P1 pass rate**: >=95%
- **P2/P3 pass rate**: >=90% (informational unless tied to high-risk areas)
- **High-risk mitigations (R-201 to R-205)**: complete or formally waived before release
- **Story 2.0a gate**: latency harness must enforce `<100ms` highlight + `<150ms` queue advance thresholds with deterministic non-zero failure output
- **Story 2.0b gate**: 100% of rule-derived outputs must satisfy provenance contract v1 required fields; invalid payload path must prove no partial mutation
- **Story 2.0c gate**: local and CI must execute the same status-integrity verifier command with identical non-zero/zero exit contracts

### Coverage Targets

- **Critical verification/mapping paths**: >=80%
- **Event-linkage integrity checks for Epic 2 mutating commands**: 100%
- **Story 2.0a AC coverage**: 100%
- **Story 2.0b AC coverage**: 100%
- **Story 2.0c AC coverage**: 100%
- **Queue determinism and provenance availability checks**: >=90%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (>=6) items unmitigated without explicit waiver
- [ ] Data-integrity checks (DATA category) pass 100% for covered flows
- [ ] Queue latency goals validated on supported office hardware profile
- [ ] 2.0a/2.0b/2.0c gate evidence attached in `_bmad-output/test-artifacts` before Epic 2 sign-off

---

## Mitigation Plans

### R-201: Event linkage integrity drift in verification/mapping flows (Score: 6)

**Mitigation Strategy:** Add integration suite enforcing accepted command -> deterministic state mutation + append-only event with valid `caused_by` across field/item/extra/review/validation commands.  
**Owner:** Backend + QA  
**Timeline:** Sprint 2  
**Status:** Planned  
**Verification:** CI report shows 100% event-linkage pass for covered Epic 2 mutating commands.

### R-202: Queue context instability under live updates (Score: 6)

**Mitigation Strategy:** Add E2E determinism suite covering resolve, filter, panel toggles, validation refresh, and reopen-restore behavior.  
**Owner:** QA + Frontend  
**Timeline:** Sprint 2  
**Status:** Planned  
**Verification:** Determinism suite passes with stable active-item/position assertions.

### R-203: Verification latency target miss (Score: 6)

**Mitigation Strategy:** Instrument queue/highlight latency, enforce benchmark thresholds in nightly and weekly gates, and track trend regressions.  
**Owner:** QA + Platform  
**Timeline:** Sprint 2-3  
**Status:** Planned  
**Verification:** Benchmark artifacts show highlight <100ms and queue advance <150ms at P95 for representative workloads.

### R-204: Override audit gaps (Score: 6)

**Mitigation Strategy:** Enforce API contract requiring override rationale and deterministic reason codes with event metadata checks.  
**Owner:** Backend + QA  
**Timeline:** Sprint 2  
**Status:** Planned  
**Verification:** Negative API suite proves missing rationale is rejected and status remains unchanged.

### R-205: Batch resolve target drift and ordering regressions (Score: 6)

**Mitigation Strategy:** Add batch isolation tests that verify only targeted items mutate and unresolved ordering is preserved.  
**Owner:** QA + Frontend  
**Timeline:** Sprint 2  
**Status:** Planned  
**Verification:** E2E/API evidence confirms untouched items remain unchanged and ordering is invariant.

---

## Assumptions and Dependencies

### Assumptions

1. Epic 2 implementation preserves command-only mutation boundaries and deterministic error payload contracts.
2. Queue and provenance UI surfaces expose stable selectors and telemetry hooks for timing checks.
3. Validation engine emits consistent cause/location metadata required by acceptance criteria.

### Dependencies

1. **2.0a Latency Budget Harness (Blocker)**: fixed scenario smoke runner with p50/p95/p99 output and pass/fail thresholding; required before Epic 2 feature completion.
2. **2.0b Provenance Contract v1 (Blocker)**: append-only schema/DTO with required fields:
   - `provenance_source` (`user|system|imported|inferred`)
   - `provenance_inputs` (document identifiers + version/hash)
   - `provenance_rule_id` (stable reference)
   - `provenance_confidence` (when applicable)
   - `provenance_created_at_utc`
3. **2.0c Status-Integrity Verifier (Blocker)**: one verifier contract with explicit invariants and identical local/CI enforcement + exit codes.

### Epic 2 Enablement Slice (Mandatory Before Feature Hardening)

| Slice | Deliverable | Gate Intent |
| --- | --- | --- |
| 2.0a | Latency budget smoke harness (CLI/script + seeded dataset + percentile output) | Catch regressions pre-merge with low CI cost |
| 2.0b | Provenance contract v1 (schema + DTO + persistence + assertions) | Prevent unauditable rule-derived artifacts |
| 2.0c | Status-integrity verifier (invariants + runner + gate wiring) | Keep local/CI status semantics aligned |

### Risks to Plan

- **Risk:** UI architecture changes alter queue state model during implementation.
  - **Impact:** Rework to determinism tests and potentially delayed P0 gate stability.
  - **Contingency:** Freeze queue-state contract for Sprint 2 and run daily determinism smoke checks.

---

## Follow-on Workflows (Manual)

- Build and merge **Epic 2 Enablement** (`2.0a/2.0b/2.0c`) before full Epic 2 feature completion.
- Run `*atdd` to generate failing P0 tests for Epic 2 critical scenarios and enablement gates.
- Run `*automate` to scaffold broader API/E2E tests from this coverage plan.

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
| Verification Queue + Context Store | Deterministic selection/focus and resume behavior | Queue-state invariance, restore, and navigation continuity suites |
| Mapping Command Handlers | Field/item/extra-table mutation and lock semantics | Command-event linkage and transaction integrity checks |
| Validation Engine + Override Flow | Continuous issue refresh and controlled exceptions | Cause/location visibility + override audit contract tests |
| Rule Learning Subsystem | Immediate recalculation and provenance attribution | Rule-to-value traceability and cross-session quality checks |
| Status Integrity Tooling | Canonical/derived workflow state consistency | CLI/API gate tests for mismatch detection and transition policy enforcement |

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
- Epic inventory and stories: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md`
- Story 2.12 implementation artifact: `/Users/jeremiahotis/projects/tabulara/_bmad-output/implementation-artifacts/2-12-enforce-story-status-integrity-across-artifacts.md`
