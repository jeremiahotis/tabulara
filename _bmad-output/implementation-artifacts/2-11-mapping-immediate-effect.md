# Story 2.11: Mapping Immediate Effect

Status: ready-for-dev

## Story

As an operations user,
I want mapping and learning updates to take effect immediately,
so that corrections improve current and future sessions without delay.

## Acceptance Criteria

1.
**Given** new anchor or dictionary rules are created,
**When** rule persistence succeeds,
**Then** the rule is applied immediately to the current session context,
**And** affected values are recalculated without restarting the session.

2.
**Given** values affected by newly applied rules,
**When** recalculation completes,
**Then** updated values are visibly reflected in queue/detail views,
**And** queue orientation (active item and position) is preserved.

3.
**Given** rule-driven updates,
**When** provenance is inspected,
**Then** provenance metadata reflects rule influence explicitly,
**And** users can trace the rule-to-value relationship.

4.
**Given** a subsequent session with similar documents,
**When** extraction and mapping run with learned rules enabled,
**Then** extraction/mapping quality improves versus a baseline run without those rules,
**And** improvement metrics are recorded.

## Tasks / Subtasks

- [ ] Apply newly persisted anchor/dictionary rules immediately to current-session mapping state (AC: 1)
- [ ] Implement deterministic recalculation + UI refresh preserving queue orientation (AC: 2)
- [ ] Implement explicit provenance rule-to-value linkage for rule-driven outcomes (AC: 3)
- [ ] Add baseline-vs-enabled quality measurement flow for subsequent sessions and record improvement metrics (AC: 4)
- [ ] Add API/E2E and benchmark coverage for immediate-effect behavior and rule-impact telemetry (AC: 1, 2, 3, 4)

## Dev Notes

- Rule application should be immediate but deterministic and auditable.
- Preserve active verification context while recalculations update visible values.
- Track quality-impact metrics using reproducible baseline methodology.

### Project Structure Notes

- Keep rule engine integration in command/event state flow to avoid hidden client-only mutations.
- Surface recalculated values and provenance updates through canonical verification state selectors.

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
