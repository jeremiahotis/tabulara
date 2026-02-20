# Story 2.8: Provenance Availability Guarantees

Status: ready-for-dev

## Story

As an operations user,
I want provenance to be operationally guaranteed for all displayed values,
so that every decision remains explainable and auditable.

## Acceptance Criteria

1.
**Given** any displayed structured value,
**When** I inspect provenance controls,
**Then** a reachable source reference is always available,
**And** jumping to the source is keyboard accessible.

2.
**Given** values influenced by anchor or dictionary rules,
**When** the value is displayed in verification or detail context,
**Then** rule-origin attribution is visible,
**And** users can distinguish machine extraction from rule-influenced outcomes.

3.
**Given** truncated values in dense layouts,
**When** I navigate by keyboard focus,
**Then** full content is accessible without hover-only interaction,
**And** readability is preserved for screen-reader flows.

4.
**Given** supported office-laptop hardware profiles,
**When** a queue item is selected,
**Then** source highlight appears in under 100ms,
**And** latency metrics are captured for regression detection.

## Tasks / Subtasks

- [ ] Enforce provenance-reference availability for all displayed structured values (AC: 1)
- [ ] Implement explicit rule-origin attribution in verification/detail surfaces (AC: 2)
- [ ] Implement keyboard-accessible full-value disclosure for truncated content and screen-reader semantics (AC: 3)
- [ ] Implement and instrument <100ms source-highlight target on supported hardware profiles (AC: 4)
- [ ] Add benchmark + regression tests for provenance reachability, accessibility, and latency metrics (AC: 1, 2, 3, 4)

## Dev Notes

- Provenance visibility is non-negotiable for auditability.
- Avoid hover-only disclosure patterns for essential value data.
- Capture highlight-latency telemetry with deterministic measurement boundaries.

### Project Structure Notes

- Keep provenance lookup centralized so queue/detail components consume identical references.
- Integrate latency instrumentation into verification interaction pipeline.

### References

- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/epics.md
- /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/ux-design-specification.md

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
