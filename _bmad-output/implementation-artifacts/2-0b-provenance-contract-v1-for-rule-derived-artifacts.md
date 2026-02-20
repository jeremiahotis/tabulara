# Story 2.0b: Provenance Contract v1 for Rule-Derived Artifacts

Status: ready-for-dev

## Story

As a platform engineer,
I want an append-only provenance contract for all rule-derived outputs,
so that rule influence is always auditable and review decisions remain explainable.

## Acceptance Criteria

1.
**Given** a value influenced by anchor or dictionary rules,
**When** the derived value is persisted,
**Then** the provenance envelope includes required fields (`provenance_source`, `provenance_inputs`, `provenance_rule_id`, optional `provenance_confidence`, `provenance_created_at_utc`),
**And** the envelope is linked to the derived value with stable identifiers.

2.
**Given** missing or invalid required provenance fields,
**When** command processing attempts persistence,
**Then** the operation is rejected with deterministic contract-violation output,
**And** no partial mutation is committed.

3.
**Given** repeated recalculation or subsequent rule application,
**When** new rule-derived outputs are produced,
**Then** new provenance envelopes are appended without mutating prior provenance records,
**And** provenance remains reachable from verification and detail surfaces.

## Tasks / Subtasks

- [ ] Define provenance contract v1 schema/DTO and required field validation rules (AC: 1, 2)
- [ ] Implement persistence wiring for provenance envelopes across rule-derived write paths (AC: 1)
- [ ] Enforce deterministic rejection behavior for contract violations with no partial commits (AC: 2)
- [ ] Ensure append-only behavior for provenance history during recalculation/re-derivation flows (AC: 3)
- [ ] Add integration tests that prove envelope completeness, append-only persistence, and verifier reachability (AC: 1, 2, 3)

## Dev Notes

- Treat provenance metadata as first-class audit data, not optional annotations.
- Align contract validation with existing deterministic command guard/error semantics.
- Avoid introducing mutable update paths for stored provenance envelopes.

### Project Structure Notes

- Keep provenance contract types centralized to prevent divergence between command handlers and UI/API readers.
- Reuse existing audit/event linkage paths where possible for provenance traceability.

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
