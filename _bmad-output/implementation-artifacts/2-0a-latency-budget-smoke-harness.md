# Story 2.0a: Latency Budget Smoke Harness

Status: ready-for-dev

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

- [ ] Implement a deterministic latency smoke runner command with seeded inputs and fixed scenario ordering (AC: 1)
- [ ] Capture and report p50/p95/p99 latency metrics for highlight and queue-advance interactions (AC: 1)
- [ ] Enforce threshold checks with deterministic non-zero exit behavior on failure (AC: 2)
- [ ] Emit machine-readable summary artifacts to `_bmad-output/test-artifacts` (AC: 3)
- [ ] Wire the smoke harness into local and CI quality gates for fast regression detection (AC: 1, 2, 3)

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

### Completion Notes List

### File List
