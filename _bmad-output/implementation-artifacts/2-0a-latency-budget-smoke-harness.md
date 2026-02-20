# Story 2.0a: Latency Budget Smoke Harness

Status: done

## Story

As a platform engineer,
I want a deterministic latency smoke harness for verification interactions,
so that regressions are blocked before merge with low-cost automated checks.

## Acceptance Criteria

1.
**Given** a fixed seeded scenario set representative of verification workflows,
**When** the latency smoke harness runs in local development or CI,
**Then** it reports p50/p95/p99 for evidence highlight and queue-advance latency,
**And** each metric is evaluated against configured thresholds.

2.
**Given** threshold targets (`<100ms` highlight, `<150ms` queue advance),
**When** any required threshold is exceeded,
**Then** the harness exits non-zero with deterministic machine-readable output,
**And** the output identifies scenario, metric, observed percentile, and threshold.

3.
**Given** a successful harness run,
**When** result artifacts are generated,
**Then** a summary is written under `_bmad-output/test-artifacts`,
**And** the artifact includes run metadata needed for regression trend comparison.

## Tasks / Subtasks

- [x] Implement a deterministic latency smoke runner command with seeded inputs and fixed scenario ordering (AC: 1)
- [x] Capture and report p50/p95/p99 latency metrics for highlight and queue-advance interactions (AC: 1)
- [x] Enforce threshold checks with deterministic non-zero exit behavior on failure (AC: 2)
- [x] Emit machine-readable summary artifacts to `_bmad-output/test-artifacts` (AC: 3)
- [x] Wire the smoke harness into local and CI quality gates for fast regression detection (AC: 1, 2, 3)

## Dev Notes

- Keep the harness lightweight enough for PR use while maintaining deterministic output structure.
- Reuse existing perf telemetry hooks where possible instead of adding parallel instrumentation paths.
- Ensure scenario inputs are stable and versioned to prevent false positives from fixture drift.

### Project Structure Notes

- Place executable harness logic in repository scripts/test tooling paths already used by CI.
- Keep generated artifacts in `_bmad-output/test-artifacts` to align with existing evidence conventions.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/test-design-epic-2.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References
- `npm run test:api -- tests/api/story-2-0a-latency-budget-smoke-harness.automation.spec.ts` (pass; 4 passed)
- `npm run test:e2e -- tests/e2e/story-2-0a-latency-budget-smoke-harness.automation.spec.ts` (pass; 3 passed)
- `npm run test:api` (pass; 43 passed, 18 skipped)
- `npm run test:e2e` (pass; 22 passed, 10 skipped)
- `npm run quality:latency-smoke` (pass; exit 0 and artifact emitted)
- `npm run test:api -- tests/api/story-2-0a-latency-budget-smoke-harness.automation.spec.ts` (pass; 6 passed after review fixes)
- `npm run test:e2e -- tests/e2e/story-2-0a-latency-budget-smoke-harness.automation.spec.ts` (pass; 3 passed after review fixes)
- `npm run quality:latency-smoke` (pass; threshold evaluation contract verified after review fixes)

### Completion Notes List
- Implemented deterministic latency harness core in `scripts/latency-smoke-harness.mjs` using seeded scenario processing, fixed ordering by scenario id, and p50/p95/p99 percentile reporting for highlight and queue-advance metrics.
- Added latency harness API contracts in `scripts/local-api-server.mjs`:
  - `POST /api/v1/perf/latency-smoke/run` for deterministic run execution and threshold evaluation.
  - `GET /api/v1/perf/latency-smoke/runs/:run_id/artifact` for machine-readable run artifacts and metadata retrieval.
- Implemented deterministic threshold-failure contract with `LATENCY_THRESHOLD_EXCEEDED`, structured failure rows (scenario/metric/percentile/observed/threshold), and explicit non-zero process contract (`process.exit_code = 1`).
- Added CLI quality gate command `scripts/latency-smoke-gate.mjs` and npm script `quality:latency-smoke` to run the harness in local/CI workflows with exit-code gating.
- Wired local CI parity script `scripts/ci-local.sh` to execute the latency smoke quality gate prior to shard-based E2E execution.
- Updated Story 2.0a API/E2E automation tests to assert implemented endpoint behavior, deterministic metrics/failure outputs, and artifact metadata retrieval.
- Fixed percentile aggregation to calculate overall p50/p95/p99 from raw sample sets rather than percentile-of-percentiles.
- Fixed failure payload consistency so `threshold_evaluation` aligns with per-scenario threshold failures.
- Added persisted artifact fallback loading in harness retrieval path so artifacts remain available after process re-instantiation.
- Expanded API/E2E tests to enforce failure-threshold invariants and verify single-scenario aggregate percentile correctness.
- Reconciled story file tracking to current review pass changes to resolve git/story discrepancy findings.

### File List
- _bmad-output/implementation-artifacts/2-0a-latency-budget-smoke-harness.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- scripts/latency-smoke-harness.mjs
- tests/api/story-2-0a-latency-budget-smoke-harness.automation.spec.ts
- tests/e2e/story-2-0a-latency-budget-smoke-harness.automation.spec.ts

### Senior Developer Review (AI)
- 2026-02-20 review follow-up completed: fixed all HIGH/MEDIUM findings from adversarial review.
- Resolved `threshold_evaluation` contradiction under failing runs by deriving booleans from per-metric failure rows.
- Corrected overall percentile computation to use raw latency samples for mathematically valid p50/p95/p99 reporting.
- Implemented disk-backed artifact retrieval fallback keyed by validated run IDs for restart-safe API behavior.
- Added regression tests for threshold-flag correctness, single-scenario aggregate correctness, and persisted artifact retrieval after harness re-instantiation.
- Synchronized story status and sprint status to `done` after fixes and green validation.

## Change Log

- 2026-02-20: Implemented Story 2.0a deterministic latency smoke harness (API + CLI), threshold gate contract, artifact emission, CI/local gate wiring, and updated Story 2.0a automation coverage.
- 2026-02-20: Applied code-review remediations for Story 2.0a (aggregate percentile correctness, threshold-evaluation consistency, persisted artifact retrieval fallback, and strengthened API/E2E automation assertions).
