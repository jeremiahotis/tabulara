---
stepsCompleted: []
lastStep: ''
lastSaved: ''
---

# Test Design for QA: Tabulara System-Level Execution Plan

**Purpose:** Test execution recipe for QA team. Defines what to test, how to test it, and what QA needs from other teams.

**Date:** 2026-02-18
**Author:** Codex (Master Test Architect)
**Status:** Draft
**Project:** Tabulara

**Related:** See Architecture doc (`test-design-architecture.md`) for testability concerns and architectural blockers.

---

## Executive Summary

**Scope:** System-level QA coverage for vault security, processing pipeline, mapping/review/validation, export locking, and correction replay.

**Risk Summary:**

- Total Risks: 10 (6 high-priority >=6, 3 medium, 1 low)
- Critical Categories: TECH, DATA, SEC, OPS

**Coverage Summary:**

- P0 tests: ~22 (critical paths, lock/security, data integrity)
- P1 tests: ~28 (core workflows and integration robustness)
- P2 tests: ~24 (edge/regression behaviors)
- P3 tests: ~8 (exploratory and long-tail checks)
- **Total**: ~82 tests (~4-7 weeks with 1 QA)

---

## Not in Scope

**Components or systems explicitly excluded from this test plan:**

| Item | Reasoning | Mitigation |
| ---- | --------- | ---------- |
| **External OCR model quality benchmarking against cloud engines** | Out of local-first milestone scope and not required for architecture gate | Validate deterministic behavior and confidence handling of selected local engines only |
| **Cloud sync / distributed multi-user concurrency** | Explicitly out of scope for current product phase | Reassess in future architecture cycle if sync becomes roadmap item |
| **Mobile/tablet capture workflows** | Desktop-first launch; tablet only limited review considered later | Ensure exported datasets and correction sessions remain portable for future clients |

---

## Dependencies & Test Blockers

**CRITICAL:** QA cannot proceed without these items from other teams.

### Backend/Architecture Dependencies (Sprint 0)

**Source:** Architecture doc "Quick Guide" blockers and high-risk mitigation plans

1. **Deterministic replay harness** - Backend/Architecture - Sprint 0
   - Needed to validate correction-session state parity
   - Blocks replay, lock, and immutability test tracks

2. **Test seeding/reset command surface** - Backend - Sprint 0
   - Needed for isolated, parallel-safe setup/teardown
   - Blocks full API/integration automation coverage

3. **Stable error code registry** - Backend/API - Sprint 0
   - Needed for deterministic assertions and gate logic
   - Blocks robust negative-path automation

### QA Infrastructure Setup (Sprint 0)

1. **Test Data Factories** - QA
   - Session/document/page/value factories with faker randomization
   - Auto-clean fixtures for parallel safety

2. **Test Environments** - QA + Platform
   - Local: deterministic fixture vaults and seeded project states
   - CI/CD: isolated containers/runners for backend + frontend tests
   - Staging: signed desktop bundle smoke environment

**Example factory pattern:**

```typescript
import { test } from '@seontechnologies/playwright-utils/api-request/fixtures';
import { expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test('create session and lock transition @p0', async ({ apiRequest }) => {
  const projectName = `proj-${faker.string.uuid()}`;

  const createProject = await apiRequest({
    method: 'POST',
    path: '/api/v1/projects',
    body: { name: projectName, settings: {} },
  });
  expect(createProject.status).toBe(200);

  const projectId = createProject.body.data.id;

  const createSession = await apiRequest({
    method: 'POST',
    path: `/api/v1/projects/${projectId}/sessions`,
    body: { schema_id: 'test-schema-id' },
  });
  expect(createSession.status).toBe(200);

  const sessionId = createSession.body.data.id;

  const lock = await apiRequest({
    method: 'POST',
    path: `/api/v1/sessions/${sessionId}/lock`,
    body: {},
  });
  expect(lock.status).toBe(200);
});
```

---

## Risk Assessment

**Note:** Full risk details in Architecture doc. This section summarizes risks relevant to QA test planning.

### High-Priority Risks (Score >=6)

| Risk ID | Category | Description | Score | QA Test Coverage |
| ------- | -------- | ----------- | ----- | ---------------- |
| **R-001** | TECH | Write-path bypass outside dispatcher | **6** | Route-to-command mapping tests + forbidden-write policy checks |
| **R-002** | DATA | Event append divergence | **6** | Fault-injection transactional tests + replay parity assertions |
| **R-003** | TECH | Reprocess nondeterminism | **6** | Deterministic rerun regression set with hash/state comparisons |
| **R-004** | SEC | Keychain unlock exposure | **6** | Lock timeout, suspend/resume lock, and unlock authorization tests |
| **R-005** | PERF | Vault growth degradation | **6** | Large-vault benchmark and retention purge performance scenarios |
| **R-006** | OPS | Recovery unproven | **6** | Backup restore and partial-corruption recovery drills |

### Medium/Low-Priority Risks

| Risk ID | Category | Description | Score | QA Test Coverage |
| ------- | -------- | ----------- | ----- | ---------------- |
| R-007 | BUS | Override overuse | 4 | Validation override workflow and reporting verification |
| R-008 | TECH | Queue/focus drift | 4 | Keyboard deterministic navigation regression suite |
| R-009 | PERF | OCR latency spikes | 4 | Load-profiled extraction timing tests |
| R-010 | BUS | Minor UI polish inconsistency | 1 | Exploratory UI checks in release smoke |

---

## Entry Criteria

**QA testing cannot begin until ALL of the following are met:**

- [ ] PRD, architecture, and command-event artifacts are baseline-approved
- [ ] Test seeding/reset capability is available in non-production environments
- [ ] Deterministic replay harness is integrated in CI
- [ ] Stable machine-readable error codes published for guard/transition failures
- [ ] Test environments provisioned and accessible
- [ ] Signed desktop build available for end-to-end smoke path

## Exit Criteria

**Testing phase is complete when ALL of the following are met:**

- [ ] All P0 tests passing (100%)
- [ ] All P1 tests passing (or failures triaged/accepted)
- [ ] No open unmitigated high-priority risks (score >=6)
- [ ] Replay determinism and lock immutability suites passing
- [ ] Coverage and gate status accepted by QA Lead + Dev Lead
- [ ] Performance baselines for core workflow stay within defined thresholds

---

## Test Coverage Plan

**IMPORTANT:** P0/P1/P2/P3 = priority and risk level (what to focus on first), NOT execution timing. See "Execution Strategy" for run timing.

### P0 (Critical)

**Criteria:** Blocks core functionality + high risk + no workaround.

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| **P0-001** | Vault open/lock lifecycle integrity | API | R-004 | Include wrong-password and auto-lock assertions |
| **P0-002** | Session lock rejects all mutating commands | API | R-001 | Deterministic error code assertions |
| **P0-003** | Command accepted implies event append | Integration | R-002 | Transaction fault injection boundary |
| **P0-004** | Export locks session and preserves audit links | E2E | R-001,R-002 | Validate UI + backend contract consistency |
| **P0-005** | Correction replay reconstructs base state | Integration | R-003 | State hash parity checks |
| **P0-006** | sum(items)==total validation gate enforcement | API | R-007 | Override reason required |

**Total P0:** ~22 tests

---

### P1 (High)

**Criteria:** Important workflows + medium/high risk.

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| **P1-001** | Import dedupe flags without deletion | API | R-002 | Duplicate status transitions |
| **P1-002** | Reprocess preserves locked/confirmed data | Integration | R-003 | Deterministic unresolved-only updates |
| **P1-003** | Review queue rebuild after overrides/corrections | E2E | R-008 | Position anchor preservation |
| **P1-004** | Validation incremental updates and final gate | E2E | R-007 | Non-blocking in-flow behavior |
| **P1-005** | Backup rotation + integrity check on open | Integration | R-006 | bak1/bak2/bak3 behavior |

**Total P1:** ~28 tests

---

### P2 (Medium)

**Criteria:** Secondary behavior, edge handling, regression hardening.

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| **P2-001** | Unknown bucket retains unassigned text | E2E | R-007 | No silent data loss |
| **P2-002** | Header synonym stabilization for tables | Integration | R-003 | Template/dictionary influence |
| **P2-003** | Keyboard-only navigation deterministic repeatability | E2E | R-008 | Repeat sequence parity |
| **P2-004** | Purge keeps tombstone metadata integrity | API | R-005,R-006 | Hash/count/timestamp preserved |

**Total P2:** ~24 tests

---

### P3 (Low)

**Criteria:** Exploratory and non-blocking quality checks.

| Test ID | Requirement | Test Level | Notes |
| ------- | ----------- | ---------- | ----- |
| **P3-001** | Minor settings UI consistency | E2E | Cosmetic checks |
| **P3-002** | Extended OCR stress permutations | Performance | Exploratory benchmark |

**Total P3:** ~8 tests

---

## Execution Strategy

**Philosophy:** Run all functional tests in PRs if they remain under practical runtime limits; defer only expensive or long-running suites.

### Every PR: Playwright + backend functional tests (~10-15 min target)

- API, integration, and critical E2E functional coverage
- Parallelized across shards
- Includes priority mixes (P0/P1/P2/P3) for functional scenarios

### Nightly: Performance suites (~30-60 min)

- Load and stress scenarios
- OCR throughput and vault size impact benchmarks
- Retention purge performance checks

### Weekly: Recovery and chaos (~hours)

- Recovery from synthetic corruption
- Backup restore drills
- Long-running endurance and failover-style operational checks

---

## QA Effort Estimate

**QA test development effort only** (excludes backend/platform implementation work):

| Priority | Count | Effort Range | Notes |
| -------- | ----- | ------------ | ----- |
| P0 | ~22 | ~1.5-2.5 weeks | Critical invariants and lock/replay behavior |
| P1 | ~28 | ~1.5-2.5 weeks | Core workflows and integration robustness |
| P2 | ~24 | ~0.8-1.5 weeks | Edge and regression hardening |
| P3 | ~8 | ~0.2-0.5 weeks | Exploratory and benchmark support |
| **Total** | ~82 | **~4.0-7.0 weeks** | **1 QA engineer, full-time** |

**Assumptions:**

- Includes test design, implementation, debugging, and CI integration
- Assumes Sprint 0 blockers are resolved first
- Excludes maintenance overhead after baseline completion

---

## Sprint Planning Handoff

| Work Item | Owner | Target Sprint (Optional) | Dependencies/Notes |
| --------- | ----- | ------------------------ | ------------------ |
| Build deterministic replay parity suite | QA + Backend | Sprint 0/1 | Requires replay harness |
| Implement API seeding/reset fixtures | QA + Backend | Sprint 0 | Requires test-only command surfaces |
| Implement lock/transition negative-path suite | QA | Sprint 1 | Requires stable error code taxonomy |
| Add nightly performance and weekly recovery jobs | QA + Platform | Sprint 1 | CI runner capacity needed |

---

## Tooling & Access

| Tool or Service | Purpose | Access Required | Status |
| --------------- | ------- | --------------- | ------ |
| Playwright + playwright-utils | API/E2E automation | CI runner and package install | Ready |
| Local OCR/HTR model assets | Deterministic extraction tests | Test environment model bundles | Pending |
| SQLCipher test environment | Encrypted vault integration tests | Local/CI database setup | Ready |
| Signed desktop build channel | Release-smoke validation | Artifact access from build pipeline | Pending |

**Access requests needed:**

- [ ] CI access to signed bundle artifacts
- [ ] Staging-like environment with representative OCR models

---

## Interworking & Regression

**Services and components impacted by this feature set:**

| Service/Component | Impact | Regression Scope | Validation Steps |
| ----------------- | ------ | ---------------- | ---------------- |
| **Command Dispatcher + Guards** | Core mutation path | All mutating routes | Route-to-command/event contract tests |
| **Session Lifecycle Engine** | Lock/correction behaviors | Export/lock/correction flow | Lifecycle transition matrix suite |
| **Extraction + Mapping Pipeline** | Structured output accuracy | Reprocess/re-extract outcomes | Deterministic delta and mapping preservation tests |
| **Vault Storage + Backup/Recovery** | Data durability and restore | Backup, purge, restore | Integrity and corruption-recovery drills |

**Regression test strategy:**

- Core contract suites must pass before release candidate promotion
- Performance and recovery suites gate weekly readiness reports
- Cross-team coordination required with Platform for recovery drills and signed-build smoke runs

---

## Appendix A: Code Examples & Tagging

```typescript
import { test } from '@seontechnologies/playwright-utils/api-request/fixtures';
import { expect } from '@playwright/test';

test('@P0 @API lock blocks mutation after export', async ({ apiRequest }) => {
  const exportRes = await apiRequest({
    method: 'POST',
    path: '/api/v1/sessions/test-session-id/export',
    body: { format: 'csv_bundle' },
  });
  expect(exportRes.status).toBe(200);

  const mutateRes = await apiRequest({
    method: 'POST',
    path: '/api/v1/field-values',
    body: {
      session_id: 'test-session-id',
      document_id: 'doc-1',
      schema_field_id: 'field-1',
      source: 'manual',
      value_override: 'x',
    },
  });

  expect(mutateRes.status).toBe(409);
  expect(mutateRes.body.error.code).toBe('SESSION_LOCKED');
});
```

---

## Appendix B: Knowledge Base References

- `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/risk-governance.md`
- `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/probability-impact.md`
- `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/test-levels-framework.md`
- `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/test-priorities-matrix.md`
- `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/adr-quality-readiness-checklist.md`
- `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/test-quality.md`
