# NFR Evidence JSON Templates

Use these templates to produce CI artifacts consumed by:

- `/Users/jeremiahotis/projects/tabulara/.github/workflows/ci-nfr-gates.yml`

Required outputs expected by the gate:

- `security-sast-report.json`
- `security-deps-report.json`
- `perf-baseline.json`
- `perf-k6-summary.json`
- `reliability-burnin-summary.json`
- `recovery-rto-rpo.json`

Recommended usage:

1. Copy `*.template.json` to the artifact filename expected by the gate.
2. Populate numeric values from actual tool outputs.
3. Keep key paths stable (the gate script reads specific fields).

Minimum required keys for gate compatibility:

- Security: `summary.critical`, `summary.high` OR `vulnerabilities.critical`, `vulnerabilities.high`
- Reliability burn-in: `consecutive_passes` OR `summary.consecutive_passes` OR `metrics.consecutive_passes`
- Recovery: `success_rate` OR `summary.success_rate` OR `recovery.success_rate`
- Performance (optional numeric gate): `regression_pct` OR `summary.regression_pct` OR `comparison.regression_pct`

## Normalizer Script

You can normalize common raw scanner outputs into gate-compatible JSON with:

```bash
python3 /Users/jeremiahotis/projects/tabulara/scripts/nfr_normalize.py \
  --artifact-dir /Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts \
  --sast-raw /path/to/raw-sast.json \
  --deps-raw /path/to/raw-deps.json \
  --k6-raw /path/to/raw-k6-summary.json \
  --burnin-raw /path/to/raw-burnin.json \
  --recovery-raw /path/to/raw-recovery.json
```

This writes:

- `security-sast-report.json`
- `security-deps-report.json`
- `perf-baseline.json`
- `perf-k6-summary.json`
- `reliability-burnin-summary.json`
- `recovery-rto-rpo.json`
