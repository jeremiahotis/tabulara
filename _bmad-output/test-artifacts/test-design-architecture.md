---
stepsCompleted: []
lastStep: ''
lastSaved: ''
---

# Test Design for Architecture: Tabulara System-Level Readiness

**Purpose:** Architectural concerns, testability gaps, and NFR requirements for review by Architecture/Dev teams. Serves as a contract between QA and Engineering on what must be addressed before test development begins.

**Date:** 2026-02-18
**Author:** Codex (Master Test Architect)
**Status:** Architecture Review Pending
**Project:** Tabulara
**PRD Reference:** /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-prd-command-event-model.md
**ADR Reference:** /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md

---

## Executive Summary

**Scope:** System-level testability and risk readiness for Tabulara's local-first, command-event-driven desktop platform.

**Business Context** (from PRD):

- **Revenue/Impact:** Trustworthy dataset generation without manual spreadsheet rework; correctness and auditability are core value drivers.
- **Problem:** Existing approaches produce text but not reliable structured records with provable provenance and correction-safe history.
- **GA Launch:** Milestone-driven launch (vault -> import -> extraction -> mapping -> review/validation -> export/lock).

**Architecture** (from architecture decision artifacts):

- **Key Decision 1:** Command-only mutation model with append-only event log and lock guards.
- **Key Decision 2:** Local-first encrypted vault (SQLCipher + blob encryption), optional keychain unlock.
- **Key Decision 3:** Tauri + Rust backend + React/MUI frontend with deterministic verification workflow.

**Expected Scale** (from architecture):

- Desktop workstation usage on office hardware
- Medium-to-large document batches per session
- Heavy local blob storage growth over time with retention/purge controls

**Risk Summary:**

- **Total risks**: 10
- **High-priority (>=6)**: 6 risks requiring immediate mitigation
- **Test effort**: ~70-120 core scenarios (~4-7 weeks for 1 QA, ~2-4 weeks for 2 QAs)

---

## Quick Guide

### 🚨 BLOCKERS - Team Must Decide (Can't Proceed Without)

**Sprint 0 Critical Path** - These MUST be completed before QA can write integration tests:

1. **BLK-01: Deterministic Replay Harness** - Provide deterministic replay fixture and baseline event-sequence corpus (recommended owner: Backend/Architecture)
2. **BLK-02: Test Data Seeding Surface** - Provide safe test seeding/reset hooks for sessions/documents/pages/values without bypassing command layer (recommended owner: Backend)
3. **BLK-03: Stable Error Contract** - Freeze machine-readable error code taxonomy for lock/transition/precondition failures (recommended owner: Backend/API)

**What we need from team:** Complete these 3 items in Sprint 0 or test development is blocked.

---

### ⚠️ HIGH PRIORITY - Team Should Validate (We Provide Recommendation, You Approve)

1. **R-001: Lock bypass via non-command writes** - Enforce write-path controls + CI detector (Architecture approval, Sprint 0)
2. **R-003: Event/state divergence under failure** - Add fault-injection transaction tests and idempotency verification (Backend approval, Sprint 0)
3. **R-006: Vault growth/performance degradation** - Validate retention thresholds and export blob lifecycle policy (Platform/Backend approval, Sprint 1)

**What we need from team:** Review recommendations and approve (or suggest changes).

---

### 📋 INFO ONLY - Solutions Provided (Review, No Decisions Needed)

1. **Test strategy**: API/integration-heavy with targeted E2E for verification loop and lock/export UX
2. **Tooling**: Playwright + playwright-utils, Rust integration tests, deterministic fixtures, k6 for performance
3. **Tiered CI/CD**: PR functional suites, nightly performance, weekly chaos/recovery
4. **Coverage**: ~70-120 risk-prioritized scenarios P0-P3
5. **Quality gates**: P0 100% pass, P1 >=95%, no open unmitigated high-risk items

**What we need from team:** Review and acknowledge.

---

## For Architects and Devs - Open Topics

### Risk Assessment

**Total risks identified**: 10 (6 high-priority score >=6, 3 medium, 1 low)

#### High-Priority Risks (Score >=6) - IMMEDIATE ATTENTION

| Risk ID    | Category  | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ---------- | --------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| **R-001** | **TECH** | Direct DB/repository bypass of command dispatcher breaks immutability guarantees | 2 | 3 | **6** | Enforce repository write policy + static/CI checks for forbidden write paths | Backend Lead | Sprint 0 |
| **R-002** | **DATA** | Command success with missing event append causes unreplayable state | 2 | 3 | **6** | Single-transaction enforcement and failure-injection tests around append boundary | Backend Lead | Sprint 0 |
| **R-003** | **TECH** | ReRunExtraction/Reprocess introduces nondeterministic output drift | 2 | 3 | **6** | Deterministic fixture corpus and replay parity tests for unresolved/locked subsets | QA + Backend | Sprint 1 |
| **R-004** | **SEC** | Keychain convenience unlock expands local attack window on compromised account | 2 | 3 | **6** | Harden unlock policy, short auto-lock defaults, explicit risk banner and audit events | Security + Backend | Sprint 1 |
| **R-005** | **PERF** | Large vault blob growth degrades query and workflow responsiveness | 3 | 2 | **6** | Retention purge performance tests, blob index tuning, backup compaction checks | Platform + Backend | Sprint 1 |
| **R-006** | **OPS** | Backup/recovery path not proven under partial corruption conditions | 2 | 3 | **6** | Scheduled restore drills + synthetic corruption test suite + recovery success metrics | Platform | Sprint 1 |

#### Medium-Priority Risks (Score 3-5)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R-007 | BUS | Validation override usage rises and weakens output trust | 2 | 2 | 4 | Add override reason analytics + review policy | Product + QA |
| R-008 | TECH | UI queue anchor/focus drift after background updates | 2 | 2 | 4 | Add deterministic navigation regression tests | Frontend |
| R-009 | PERF | OCR latency spikes on low-end laptops for large scans | 2 | 2 | 4 | Define batch-size guidance + performance thresholds | Backend |

#### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ------ |
| R-010 | BUS | Minor visual inconsistency in non-critical settings pages | 1 | 1 | 1 | Monitor |

#### Risk Category Legend

- **TECH**: Technical/Architecture
- **SEC**: Security
- **PERF**: Performance
- **DATA**: Data Integrity
- **BUS**: Business Impact
- **OPS**: Operations

---

### Testability Concerns and Architectural Gaps

**🚨 ACTIONABLE CONCERNS - Architecture Team Must Address**

#### 1. Blockers to Fast Feedback (WHAT WE NEED FROM ARCHITECTURE)

| Concern | Impact | What Architecture Must Provide | Owner | Timeline |
| ------ | ------ | ------------------------------ | ----- | -------- |
| **No canonical test seeding API contract** | Slow, brittle fixture setup and poor parallel safety | Define test-only seeding/reset command surface with strict environment guards | Backend | Sprint 0 |
| **Replay determinism not yet validated in CI** | Cannot trust correction-session guarantees | Add replay parity harness (state hash parity from event stream) | Backend + QA | Sprint 0 |
| **Error code taxonomy not frozen** | Flaky automation assertions and unclear triage | Publish stable error code registry for guard and transition failures | Backend/API | Sprint 0 |

#### 2. Architectural Improvements Needed (WHAT SHOULD BE CHANGED)

1. **Command/Event Contract Version Pinning**
   - **Current problem**: Event/command payload evolution may drift silently.
   - **Required change**: Introduce explicit `event_version`/`command_version` compatibility checks.
   - **Impact if not fixed**: Replay failures and migration ambiguity.
   - **Owner**: Backend Architecture
   - **Timeline**: Sprint 1

2. **Recovery Drill Automation**
   - **Current problem**: Recovery flow exists but is not routinely tested.
   - **Required change**: Add weekly automated restore/recovery canary job against synthetic damaged vaults.
   - **Impact if not fixed**: False confidence in backup integrity.
   - **Owner**: Platform
   - **Timeline**: Sprint 1

---

### Testability Assessment Summary

#### What Works Well

- ✅ Command-event model is explicit and strongly testable via deterministic contracts.
- ✅ Lock/correction semantics are clearly defined as invariant boundaries.
- ✅ Local-only architecture reduces network nondeterminism and simplifies reproducibility.
- ✅ UX contract specifies measurable deterministic behaviors (queue/focus/provenance).

#### Accepted Trade-offs (No Action Required)

For Tabulara Phase 1:

- **Desktop-only launch** - acceptable for initial throughput and trust goals.
- **Cloud sync out of scope** - acceptable to reduce distributed consistency complexity.

This is acceptable for Phase 1 and should be revisited post-locking milestone stabilization.

---

### Risk Mitigation Plans (High-Priority Risks >=6)

#### R-001: Write Path Bypass Risk (Score: 6) - HIGH

**Mitigation Strategy:**

1. Add static policy checks to detect direct mutation code paths outside dispatcher handlers.
2. Add integration test proving all mutating REST routes produce command/event IDs.
3. Block merge on policy violation in CI.

**Owner:** Backend Lead
**Timeline:** Sprint 0
**Status:** Planned
**Verification:** CI policy green + route/command mapping report complete.

#### R-002: Event Append Divergence (Score: 6) - HIGH

**Mitigation Strategy:**

1. Instrument transactional boundary tests with forced append failures.
2. Validate no partial state writes when event append fails.
3. Add idempotency replay tests for retry scenarios.

**Owner:** Backend Lead
**Timeline:** Sprint 0
**Status:** Planned
**Verification:** Fault-injection suite passes with zero divergence.

#### R-003: Reprocessing Nondeterminism (Score: 6) - HIGH

**Mitigation Strategy:**

1. Build fixture corpus for representative doc types.
2. Assert unchanged resolved/locked outputs after reprocess/re-extract.
3. Track and gate deterministic delta rules in CI.

**Owner:** QA + Backend
**Timeline:** Sprint 1
**Status:** Planned
**Verification:** Replay parity and delta-preservation reports pass.

#### R-004: Keychain Unlock Security Window (Score: 6) - HIGH

**Mitigation Strategy:**

1. Enforce strict default auto-lock timeout.
2. Add explicit user warning and audit events for keychain-enabled unlock.
3. Verify lock-on-suspend/resume behavior across supported OSes.

**Owner:** Security + Backend
**Timeline:** Sprint 1
**Status:** Planned
**Verification:** Security regression suite passes for unlock/lock transitions.

#### R-005: Vault Growth Performance Degradation (Score: 6) - HIGH

**Mitigation Strategy:**

1. Benchmark retention purge and export archiving thresholds.
2. Add query-performance gates on realistic vault sizes.
3. Optimize indexing and blob metadata access paths.

**Owner:** Platform + Backend
**Timeline:** Sprint 1
**Status:** Planned
**Verification:** P95 operation timings stay within defined limits on benchmark datasets.

#### R-006: Recovery Path Unproven (Score: 6) - HIGH

**Mitigation Strategy:**

1. Run corruption simulation scenarios against backup/recovery tooling.
2. Validate restored vault retains tombstone and integrity metadata correctness.
3. Add monthly recovery drill and trend reporting.

**Owner:** Platform
**Timeline:** Sprint 1
**Status:** Planned
**Verification:** Recovery drill success rate >= 99% on synthetic fault set.

---

### Assumptions and Dependencies

#### Assumptions

1. Command dispatcher remains the sole mutable write path.
2. SQLCipher encryption and key derivation are configured per design baseline.
3. Local API service remains loopback-only and not exposed to remote network paths.

#### Dependencies

1. Command/event DTO stabilization - required by Sprint 0.
2. Deterministic fixture dataset and seeding APIs - required by Sprint 0.
3. CI capacity for nightly performance and weekly recovery drills - required by Sprint 1.

#### Risks to Plan

- **Risk**: Cross-platform packaging differences alter lock/keychain behavior.
  - **Impact**: Inconsistent security guarantees across OS targets.
  - **Contingency**: Platform-specific compatibility suite before release candidate.

---

**End of Architecture Document**

**Next Steps for Architecture Team:**

1. Resolve Sprint 0 blockers (BLK-01/02/03)
2. Assign owners and timelines for all high-priority risks
3. Confirm mitigation verification criteria in CI
4. Share feedback with QA for final test execution sequencing

**Next Steps for QA Team:**

1. Use companion QA plan at `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/test-design-qa.md`
2. Begin fixture/test harness setup once blockers are complete
3. Implement P0/P1 scenarios first
