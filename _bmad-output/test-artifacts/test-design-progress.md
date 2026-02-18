---
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
lastSaved: '2026-02-18'
---

## Step 1 - Detect Mode & Prerequisites
- Mode selected: **System-Level** (explicit user intent: "system level").
- Inputs confirmed from planning artifacts:
  - PRD: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-prd-command-event-model.md`
  - Architecture: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md`
  - Supporting architecture baseline: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-full-system-architecture.md`
- Prerequisites satisfied for system-level output generation.

## Step 2 - Load Context
- Loaded TEA config flags:
  - `tea_use_playwright_utils: true`
  - `tea_browser_automation: auto`
- Loaded required knowledge fragments for system-level planning:
  - ADR readiness checklist, risk governance, probability-impact scale, test levels framework, priorities matrix, test quality DoD.
- Browser exploration skipped (not required; planning documents provided sufficient evidence).

## Step 3 - Risk & Testability
- Produced system-level testability review with actionable blockers and architectural gaps.
- Built risk register with probability/impact scoring and mitigation ownership.
- Flagged high-priority risks (score >=6) and linked them to required mitigations.

## Step 4 - Coverage Plan
- Created risk-linked coverage matrix (P0-P3) across API/integration/E2E/performance levels.
- Defined PR/Nightly/Weekly execution strategy.
- Added effort estimates as ranges and release quality gates.

## Step 5 - Outputs Generated
- Wrote architecture-oriented document:
  - `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/test-design-architecture.md`
- Wrote QA execution-oriented document:
  - `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/test-design-qa.md`
- Validated required sections against checklist (system-level mode).

## Step 1 - Detect Mode & Prerequisites (Epic-Level Run)
- Mode selected: **Epic-Level** (explicit user intent: "testarch-test-design epic 1").
- Inputs confirmed from planning artifacts:
  - Epic stories: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epic-1-stories.md`
  - Epic index: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md`
  - Architecture context: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md`
- Prerequisites satisfied for epic-level test plan generation for Epic 1.

## Step 2 - Load Context (Epic-Level Run)
- Loaded TEA config flags:
  - `tea_use_playwright_utils: true`
  - `tea_browser_automation: auto`
  - `test_artifacts: /Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts`
- Loaded Epic-Level project artifacts:
  - Epic stories: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epic-1-stories.md`
  - Epic inventory: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md`
  - PRD context: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-prd-command-event-model.md`
  - Architecture context: `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md`
  - Prior system-level test design outputs:
    - `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/test-design-architecture.md`
    - `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/test-design-qa.md`
- Existing test inventory (coverage baseline):
  - `tests/e2e/example.spec.ts` (single queue-resolution flow)
  - `tests/support/fixtures/index.ts` (merged fixtures with playwright-utils helpers)
  - Factory and helper utilities under `tests/support/`
  - Coverage gap snapshot: no explicit Epic 1 API/transaction/idempotency/rollback suites present yet.
- Browser exploration:
  - `playwright-cli` not installed in this environment; skipped browser exploration and relied on doc/code analysis per fallback rule.
- Loaded required Epic-Level knowledge fragments:
  - `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/risk-governance.md`
  - `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/probability-impact.md`
  - `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/test-levels-framework.md`
  - `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/test-priorities-matrix.md`
  - `/Users/jeremiahotis/projects/tabulara/_bmad/tea/testarch/knowledge/playwright-cli.md`

## Step 3 - Risk and Testability (Epic-Level Run)
- System-level testability review: not applicable for this run (Epic-Level mode selected).
- Evidence basis used for risk assessment:
  - Epic 1 ACs from `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epic-1-stories.md`
  - Contract expectations from `/Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-prd-command-event-model.md`
  - Current test baseline shows one E2E example spec and shared helpers, with no explicit Epic 1 API/rollback/idempotency suites yet.

### Epic 1 Risk Matrix (Probability x Impact)

| Risk ID | Category | Risk | P | I | Score | Mitigation | Owner | Timeline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E1-R1 | DATA | Accepted commands may miss immutable event append (`caused_by` linkage drift) during handler evolution | 2 | 3 | 6 | Add API/integration assertions: accepted command => >=1 event + valid `caused_by`; gate in CI | Backend + QA | Sprint 1 |
| E1-R2 | TECH | Missing command-envelope validation coverage (`command_id/type/actor/timestamp/payload`) allows non-deterministic rejects | 2 | 3 | 6 | Add negative API contract tests for all required envelope fields and stable error code assertions | Backend + QA | Sprint 1 |
| E1-R3 | DATA | Extraction failure path may leave partial state/event writes, breaking atomicity | 2 | 3 | 6 | Add failure-injection integration tests around `RunExtraction`; verify full rollback of state/events | Backend | Sprint 1 |
| E1-R4 | TECH | Reprocess flow may violate permitted lifecycle transitions or mutate confirmed data unexpectedly | 2 | 3 | 6 | Add transition-matrix tests for `ReprocessDocument` with locked/confirmed/unresolved fixtures | Backend + QA | Sprint 1-2 |
| E1-R5 | PERF | Preprocessing/extraction on representative files may exceed interactive local thresholds | 2 | 2 | 4 | Add benchmark suite (sample PDFs/images) and P95 timing budget checks in nightly CI | QA + Platform | Sprint 2 |
| E1-R6 | BUS | Duplicate handling may create ambiguous lineage if correlation fields are weak | 2 | 2 | 4 | Add deterministic duplicate-correlation assertions and provenance display checks | Backend + QA | Sprint 1-2 |
| E1-R7 | OPS | Command pipeline health checks in dev mode may not detect degraded backend startup states | 1 | 2 | 2 | Add startup smoke checks for desktop shell + local API `/api/v1` availability in CI smoke | Platform + QA | Sprint 1 |

### Risk Summary
- High-priority risks (score >= 6): **4** (`E1-R1`, `E1-R2`, `E1-R3`, `E1-R4`) and should be first in automation.
- These high risks cluster around **event integrity** and **atomicity/transition determinism**; they are the highest-value gate for Epic 1.
- Medium/low risks (`E1-R5`-`E1-R7`) remain important but can follow once command-event correctness gates are stable.

## Step 4 - Coverage Plan (Epic-Level Run)

### Coverage Matrix (Epic 1)

| Scenario ID | Story / Requirement Focus | Test Scenario | Level | Priority | Risk Link |
| --- | --- | --- | --- | --- | --- |
| E1-1 | 1.1 project bootstrap | Dev boot smoke: desktop shell + local backend + `/api/v1` responds | E2E | P0 | E1-R7 |
| E1-2 | 1.1 command envelope | Missing `command_id` rejected with deterministic code and no writes | API | P0 | E1-R2 |
| E1-3 | 1.1 command envelope | Missing `type/actor/timestamp/payload` each rejected deterministically | API | P0 | E1-R2 |
| E1-4 | 1.2 CreateSession | Accepted `CreateSession` emits `SessionCreated` with valid `caused_by` | Integration | P0 | E1-R1 |
| E1-5 | 1.2 PinSession | `PinSession`/unpin mutates state and emits event in same transaction | Integration | P0 | E1-R1 |
| E1-6 | 1.3 import | Import persists metadata/blob refs and emits `DocumentImported` per command | Integration | P1 | E1-R1 |
| E1-7 | 1.3 duplicate handling | Duplicate confirmation persists linkage and emits `DuplicateMarked` with correlation | API | P1 | E1-R6 |
| E1-8 | 1.4 preprocessing | `ApplyPreprocessing` creates derived artifacts and event in same transaction | Integration | P1 | E1-R1 |
| E1-9 | 1.4 reprocess transition | `ReprocessDocument` allowed state transitions only; forbidden transitions rejected | API | P0 | E1-R4 |
| E1-10 | 1.4 reprocess invariants | Reprocess preserves prior audit history and locked/confirmed invariants | Integration | P0 | E1-R4 |
| E1-11 | 1.5 extraction success | `RunExtraction` persists derived outputs and emits `ExtractionCompleted` linkage | Integration | P0 | E1-R1 |
| E1-12 | 1.5 extraction failure | Failure before completion fully rolls back state and event append | Integration | P0 | E1-R3 |
| E1-13 | command idempotency | Duplicate `command_id` behavior deterministic (`IDEMPOTENCY_CONFLICT` / replay) | API | P1 | E1-R3 |
| E1-14 | baseline UI contract | Queue/provenance accept action resolves item state in UI flow | E2E | P2 | E1-R6 |
| E1-15 | performance budget | Preprocess/extract P95 latency on representative docs within local budget | API/Perf | P2 | E1-R5 |
| E1-16 | audit invariants | Event chain query proves row-to-event traceability for Epic 1 lifecycle | Integration | P1 | E1-R1 |

### Execution Strategy
- **PR (target <= 15 min):** all P0 + selected fast P1 API/integration tests (`E1-2`, `E1-3`, `E1-4`, `E1-9`, `E1-11`, `E1-12`, plus lightweight E1-13).
- **Nightly:** full P1 set and medium-cost P2 (`E1-6`, `E1-7`, `E1-8`, `E1-10`, `E1-14`, `E1-16`) plus deterministic re-run checks.
- **Weekly:** expensive performance/burn-in suites (`E1-15`) and extended reliability/failure-injection loops.

### Resource Estimates (Ranges)
- **P0:** ~24–36 hours
- **P1:** ~18–30 hours
- **P2:** ~8–16 hours
- **P3:** ~2–6 hours (exploratory, optional for Epic 1)
- **Total:** ~52–88 hours (~1.5–3 weeks for 1 QA; ~1–2 weeks for 2 engineers with backend support)

### Quality Gates
- P0 pass rate: **100%**
- P1 pass rate: **>=95%**
- High-risk items (`E1-R1`..`E1-R4`) mitigated or explicitly waived with owner before Epic 1 release
- Requirements coverage target: **>=80%** of Epic 1 ACs with automated checks, with no untested P0 AC

## Step 5 - Generate Output (Epic-Level Run)
- Mode used: **Epic-Level** (Epic 1).
- Output generated:
  - `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/test-design-epic-1.md`
- Checklist validation highlights:
  - Risk matrix included with probability/impact scoring, owners, and timelines.
  - Coverage matrix and P0-P3 prioritization included.
  - PR/Nightly/Weekly execution strategy included.
  - Resource estimates provided as ranges (no false precision).
  - Quality gate thresholds defined (P0=100%, P1>=95%, coverage >=80%).
  - No unresolved template placeholders detected.
  - Browser CLI sessions were not started (no cleanup required).
- Key risks and gate thresholds:
  - Highest risks: command-event integrity, envelope validation consistency, extraction rollback atomicity, reprocess transition determinism.
  - Release gate: no unmitigated high-priority risks without explicit waiver.
- Open assumptions:
  - Deterministic error-code catalog and extraction failure-injection hooks will be available in Sprint 1.
