# Story 2.12: Enforce Story Status Integrity Across Artifacts

Status: ready-for-dev

## Story

As a project lead,
I want story workflow status to be deterministically synchronized across tracking artifacts,
so that review, planning, and delivery decisions are based on trustworthy status data.

## Acceptance Criteria

1.
**Given** story status is tracked in `_bmad-output/implementation-artifacts/sprint-status.yaml`,
**When** a status verification command runs,
**Then** it compares canonical entries to story markdown `Status:` fields,
**And** exits non-zero on any mismatch with a deterministic mismatch report.

2.
**Given** pull requests or local handoff checkpoints,
**When** CI or local status-integrity hooks run,
**Then** merges/handovers are blocked if any story status mismatch exists,
**And** the blocking output identifies exact files and required corrections.

3.
**Given** a valid status transition request,
**When** transition tooling applies a state change,
**Then** allowed transitions are enforced (`backlog -> ready-for-dev -> in-progress -> review -> done`),
**And** canonical plus derived status projections are updated atomically.

4.
**Given** a request to move a story to `done`,
**When** review evidence requirements are missing,
**Then** the transition is rejected with deterministic reason codes,
**And** status remains unchanged until evidence is present.

## Tasks / Subtasks

- [ ] Implement status-integrity verification command comparing canonical YAML status and story markdown status (AC: 1)
- [ ] Implement deterministic mismatch report and non-zero exit semantics for CI/local hooks (AC: 1, 2)
- [ ] Integrate status-integrity check in local handoff and CI paths to block on mismatch (AC: 2)
- [ ] Implement transition tooling with strict allowed-transition enforcement and atomic canonical/derived updates (AC: 3)
- [ ] Implement done-transition evidence gate with deterministic rejection reasons when evidence is missing (AC: 4)
- [ ] Add automated tests for mismatch detection, transition policies, and gating behavior (AC: 1, 2, 3, 4)

## Dev Notes

- Treat `_bmad-output/implementation-artifacts/sprint-status.yaml` as canonical status authority.
- Keep markdown `Status:` fields as derived projections synchronized atomically.
- Ensure integrity tool output is deterministic for automation and developer workflows.

### Project Structure Notes

- Reuse existing workflow scripts and test harness where possible for status gate checks.
- Keep transition + integrity logic centralized to avoid divergent status mutation paths.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/implementation-artifacts/sprint-status.yaml
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/sprint-change-proposal-2026-02-19.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
