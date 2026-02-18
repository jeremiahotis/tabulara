# CI Quality Pipeline

This repository uses a dedicated test pipeline at:

- `/Users/jeremiahotis/projects/tabulara/.github/workflows/test.yml`

Current scope: Epic 1 delivery quality gates and regression stability.

## Trigger Strategy

- `pull_request` to `main` or `develop`
- `push` to `main` or `develop`
- Weekly schedule (`Sunday 02:00 UTC`) for burn-in stability checks
- Manual trigger via `workflow_dispatch`

## Pipeline Stages

1. `lint`
2. `test` (4-way shard matrix, `fail-fast: false`)
3. `burn-in` (10 iterations, PR + schedule only)
4. `report` (summary + gate enforcement)

## Quality Gates

- P0: 100% of critical checks must pass (`lint` + `test` jobs)
- P1: Burn-in must be stable when it runs (no flaky failures across iterations)
- CI fails when any P0 gate fails or when burn-in reports a failure

## Artifacts and Evidence

- Failure-only artifact uploads for test and burn-in jobs
- Artifact retention: 30 days
- Run summary is published to the workflow job summary panel

## Optional Notifications

- Set `CI_SLACK_WEBHOOK` repository secret to send Slack failure alerts.
- If unset, notifications are skipped and pipeline behavior is unchanged.

## Local CI Parity

Run the same flow locally:

```bash
scripts/ci-local.sh
```

Run with burn-in enabled:

```bash
RUN_BURN_IN=true BURN_IN_ITERATIONS=10 scripts/ci-local.sh
```

Run changed tests only:

```bash
scripts/test-changed.sh
```
