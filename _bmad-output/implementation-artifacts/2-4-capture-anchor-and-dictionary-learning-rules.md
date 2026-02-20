# Story 2.4: Capture Anchor and Dictionary Learning Rules

Status: ready-for-dev

## Story

As an operations user,
I want to capture reusable mapping corrections as rules,
so that future sessions become faster and more consistent.

## Acceptance Criteria

1.
**Given** a confirmed mapping correction,
**When** I create or disable anchor/dictionary rules,
**Then** rule state changes persist through command handlers only,
**And** corresponding events (`AnchorRuleCreated`, `AnchorRuleDisabled`, `DictionaryRuleLearned`, `DictionaryRuleDisabled`) are appended.

2.
**Given** subsequent relevant extraction/mapping contexts,
**When** learned rules are applied,
**Then** provenance shows that rule influence explicitly,
**And** users can review and override behavior without hidden state.

## Tasks / Subtasks

- [ ] Implement anchor/dictionary rule create/disable command handlers with append-only events (AC: 1)
- [ ] Implement immediate rule application path with explicit provenance attribution in verification views (AC: 2)
- [ ] Add tests for overrideability, deterministic behavior, and transparent rule influence tracking (AC: 1, 2)

## Dev Notes

- Avoid hidden rule state; every rule action must be auditable.
- Ensure rule influence is visible in provenance metadata.
- Support controlled override behavior while preserving deterministic outcomes.

### Project Structure Notes

- Integrate learning rules into existing extraction/mapping pipelines via command-dispatcher entry points.
- Keep provenance display contracts aligned across queue/detail surfaces.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/architecture.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
