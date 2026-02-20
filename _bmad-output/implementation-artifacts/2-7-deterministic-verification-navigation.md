# Story 2.7: Deterministic Verification Navigation

Status: ready-for-dev

## Story

As an operations user,
I want queue navigation context to remain deterministic through all verification actions,
so that I never lose my place or restart work unexpectedly.

## Acceptance Criteria

1.
**Given** an active queue item,
**When** non-destructive UI actions occur (filters, validation updates, panel toggles),
**Then** the same queue item remains selected and visible,
**And** active context state is preserved.

2.
**Given** an in-progress verification session,
**When** the app is closed and reopened,
**Then** the previously active queue item is restored as active,
**And** prior workspace context is reinstated.

3.
**Given** provenance links in verification views,
**When** I jump to evidence from a value,
**Then** evidence focus changes to the target source,
**And** queue position and active item selection do not change unless explicitly requested.

## Tasks / Subtasks

- [ ] Implement stable active-item retention across non-destructive verification UI actions (AC: 1)
- [ ] Implement persisted workspace restoration of active queue context after reopen (AC: 2)
- [ ] Implement provenance jump behavior that updates evidence focus without implicit queue selection changes (AC: 3)
- [ ] Add E2E regression coverage for deterministic navigation and context restoration (AC: 1, 2, 3)

## Dev Notes

- Separate evidence focus transitions from queue selection transitions.
- Persist minimal deterministic navigation context needed for resume.
- Preserve UX continuity through validation/filter updates.

### Project Structure Notes

- Keep navigation context in a single canonical state model consumed by queue + evidence views.
- Persist resume state via local session storage/domain state consistent with offline-first constraints.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/ux-design-specification.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
