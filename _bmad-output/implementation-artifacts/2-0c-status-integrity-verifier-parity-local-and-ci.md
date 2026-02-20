# Story 2.0c: Status-Integrity Verifier Parity (Local and CI)

Status: ready-for-dev

## Story

As a project lead,
I want one status-integrity verifier contract for local and CI execution,
so that workflow status drift is blocked consistently before handoff or merge.

## Acceptance Criteria

1.
**Given** canonical entries in `_bmad-output/implementation-artifacts/sprint-status.yaml` and story markdown `Status:` fields,
**When** the verifier runs,
**Then** it reports mismatches deterministically with story key, expected value, actual value, and artifact path,
**And** exits non-zero when any mismatch exists.

2.
**Given** local developer validation and CI pipeline validation,
**When** status-integrity checks execute,
**Then** both paths use the same verifier command and exit-code contract,
**And** drift-blocking behavior is identical across environments.

3.
**Given** synchronized status data,
**When** the verifier completes,
**Then** it exits zero with deterministic success output suitable for logs and automation.

## Tasks / Subtasks

- [ ] Implement a single status-integrity verifier command/script used by both local and CI paths (AC: 1, 2)
- [ ] Build deterministic mismatch reporting with stable field ordering and explicit artifact paths (AC: 1)
- [ ] Define and document exit-code contract for pass/fail and integration failures (AC: 1, 2, 3)
- [ ] Integrate verifier invocation into CI and local quality-gate workflows (AC: 2)
- [ ] Add automated tests covering mismatch detection, success path, and parity across local/CI invocation (AC: 1, 2, 3)

## Dev Notes

- Treat `_bmad-output/implementation-artifacts/sprint-status.yaml` as canonical and story markdown status as derived projection.
- Keep local and CI execution paths thin wrappers around the same verifier implementation.
- Ensure output remains deterministic for reliable parsing and reproducible gate behavior.

### Project Structure Notes

- Centralize verifier logic to avoid drift between CI workflow scripts and developer-local helpers.
- Keep mismatch-report formatting stable to support human review and machine consumption.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/test-artifacts/test-design-epic-2.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/sprint-change-proposal-2026-02-19.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/implementation-artifacts/2-12-enforce-story-status-integrity-across-artifacts.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
