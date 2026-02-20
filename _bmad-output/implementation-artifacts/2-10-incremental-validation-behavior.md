# Story 2.10: Incremental Validation Behavior

Status: ready-for-dev

## Story

As an operations user,
I want validation feedback to run continuously without disrupting flow,
so that I can fix issues early while maintaining verification rhythm.

## Acceptance Criteria

1.
**Given** any mutating verification or mapping command,
**When** command processing completes,
**Then** validation is triggered automatically,
**And** updated validation state becomes visible without manual refresh.

2.
**Given** active queue verification,
**When** validation updates arrive,
**Then** the current verification interaction is not interrupted,
**And** focus remains on the active queue workflow.

3.
**Given** unresolved blocking validation issues,
**When** I continue verification,
**Then** resolution actions remain available,
**And** blocking behavior is enforced only at export/finalization gates.

4.
**Given** a surfaced validation issue,
**When** issue details are rendered,
**Then** cause and location are shown,
**And** a concrete resolution hint is provided.

## Tasks / Subtasks

- [ ] Trigger validation automatically after each mutating verification/mapping command (AC: 1)
- [ ] Implement non-disruptive validation state refresh preserving active queue focus (AC: 2)
- [ ] Enforce blocking only at export/finalization gates while allowing verification continuation (AC: 3)
- [ ] Implement issue-detail rendering with cause/location and actionable resolution hints (AC: 4)
- [ ] Add test coverage for continuous-validation behavior and focus-preservation invariants (AC: 1, 2, 3, 4)

## Dev Notes

- Keep incremental validation asynchronous and non-blocking for active verification tasks.
- Avoid focus loss when validation feedback updates arrive.
- Maintain deterministic gate enforcement boundaries (verification vs export/finalization).

### Project Structure Notes

- Integrate validation triggers in command completion pipeline.
- Keep validation presentation state decoupled from queue selection ownership.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/ux-design-specification.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
