# Tabulara NFR Evidence Closure Checklist

Date: 2026-02-18
Source Assessment: /Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/nfr-assessment.md
Target Outcome: Move overall NFR status from CONCERNS -> PASS

## Exit Criteria (must all be true)

- [ ] Security evidence complete and passing
- [ ] Performance baselines defined and passing
- [ ] Reliability burn-in and recovery drills passing
- [ ] Unknown thresholds removed from NFR assessment
- [ ] Traceability run confirms requirement-to-test-to-evidence links

## 1) Security Evidence Closure

### CI jobs to add/run

- [ ] `security:sast` (static security scan)
- [ ] `security:deps` (dependency vulnerability scan)
- [ ] `security:authz-negative` (lock/authz abuse-path tests)

### Required artifacts (exact names)

- [ ] `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/security-sast-report.json`
- [ ] `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/security-deps-report.json`
- [ ] `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/security-authz-negative-report.md`
- [ ] `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/security-summary.md`

### Pass/Fail criteria

- [ ] Critical vulnerabilities = 0
- [ ] High vulnerabilities = 0 (or approved waiver with expiry)
- [ ] Lock mutation abuse-path returns deterministic `SESSION_LOCKED` failures
- [ ] Authz-negative tests pass at 100%

## 2) Performance Evidence Closure

### Thresholds to define (replace UNKNOWN)

- [ ] `api_command_latency_p95_ms <= 300`
- [ ] `api_command_latency_p99_ms <= 700`
- [ ] `queue_advance_latency_ms <= 150`
- [ ] `highlight_sync_latency_ms <= 100`
- [ ] `export_completion_slo` defined by dataset size class

### CI jobs to add/run

- [ ] `perf:baseline` (single-run baseline)
- [ ] `perf:k6-core` (load profile for import/extract/validate/export)

### Required artifacts (exact names)

- [ ] `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/perf-baseline.json`
- [ ] `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/perf-k6-summary.json`
- [ ] `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/perf-thresholds.md`
- [ ] `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/perf-regression-trend.csv`

### Pass/Fail criteria

- [ ] p95/p99 thresholds met for all core command endpoints
- [ ] No sustained regressions >10% vs baseline
- [ ] Resource usage stays inside agreed CPU/memory envelope on target hardware

## 3) Reliability Evidence Closure

### CI jobs to add/run

- [ ] `reliability:burn-in` (100+ consecutive runs core invariants)
- [ ] `reliability:recovery-drill` (backup restore + corruption scenario)

### Required artifacts (exact names)

- [ ] `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/reliability-burnin.log`
- [ ] `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/reliability-burnin-summary.json`
- [ ] `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/recovery-drill-report.md`
- [ ] `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/recovery-rto-rpo.json`

### Pass/Fail criteria

- [ ] 100+ consecutive pass runs for invariant suites
- [ ] Recovery drill success rate >= 99% on synthetic corruption set
- [ ] RTO and RPO values are measured and within agreed targets

## 4) Assessment Update Tasks

- [ ] Update `/Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/nfr-assessment.md`
- [ ] Replace all `UNKNOWN` thresholds with explicit values
- [ ] Update category statuses with evidence references
- [ ] Update gate YAML snippet to reflect final status

## 5) Traceability and Final Gate

- [ ] Run `testarch-trace`
- [ ] Confirm each high-risk NFR links to executable tests + artifacts
- [ ] Re-run `testarch-nfr`
- [ ] Final expected status: PASS

## Suggested Ownership

- Security Lead: Section 1
- Backend + QA: Section 2
- Platform + QA: Section 3
- QA Lead: Sections 4 and 5

## Completion Log

- Security closure completed by: __________
- Performance closure completed by: __________
- Reliability closure completed by: __________
- NFR reassessment date: __________
- Final gate status: __________
