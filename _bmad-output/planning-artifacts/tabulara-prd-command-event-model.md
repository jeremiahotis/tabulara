---
title: Tabulara PRD - Command Event Contract
date: 2026-02-18
owner: Jeremiah
status: Draft for Implementation
---

# Product Requirements Document (PRD)

## 1. Product Summary
Tabulara is a local-first document structuring system. This PRD defines the command-event contract that governs all backend mutations above REST transport. The backend must process commands atomically, persist resulting state updates, and append immutable events to `audit_log` so each user action is reproducible and correction sessions are possible.

## 2. Problem Statement
Without a strict command-event layer, session locking, correction-session replay, auditability, and deterministic reprocessing become fragile and prone to edge-case corruption.

## 3. Goals
1. Ensure all meaningful user actions are represented as commands and append-only events.
2. Guarantee atomic processing for each command.
3. Enforce immutability for locked sessions.
4. Enable correction sessions via replay + delta application.
5. Preserve an auditable, reproducible history for every session.

## 4. Non-Goals
1. External distributed event streaming.
2. Multi-user concurrent conflict resolution.
3. Cloud synchronization.
4. Full undo/redo UI in this milestone (history foundation only).

## 5. Users and Personas
1. Primary: local operator (`actor=local_user`) processing document sessions.
2. Secondary: future auditor/maintainer verifying historical operations.

## 6. Scope
### In Scope
1. Command envelope and validation.
2. Event envelope and append-only persistence in `audit_log.event_json`.
3. Command groups and event mappings.
4. Session lock enforcement for mutating commands.
5. Correction session replay behavior.
6. Backend processing pipeline and transaction boundaries.

### Out of Scope
1. New UI workflows beyond invoking existing REST endpoints.
2. Replacing current REST routes.
3. Cross-machine replication.

## 7. Definitions
1. Command: intent to mutate domain state.
2. Event: immutable record of domain change caused by a command.
3. Locked session: immutable session that rejects mutating commands.
4. Correction session: new session derived from replaying base session events and applying deltas.

## 8. Functional Requirements
### FR-1 Command Processing
1. Backend MUST mutate state only through command handlers.
2. Every accepted command MUST produce one or more events.
3. Commands MUST include: `command_id`, `type`, `actor`, `timestamp`, `payload`.
4. `command_id` MUST be unique and traceable to generated events.

### FR-2 Event Emission and Storage
1. Events MUST include: `event_id`, `caused_by`, `type`, `timestamp`, `data`.
2. Events MUST be append-only and immutable after write.
3. Events MUST be stored in `audit_log.event_json`.
4. `caused_by` MUST reference a valid command identifier.

### FR-3 Session Lock Enforcement
1. If session state is `locked`, backend MUST reject all mutating commands.
2. Rejection MUST return deterministic error payloads for UI handling.
3. Read-only commands/queries MAY continue.

### FR-4 Command Groups
Backend MUST support at least the following command groups and mapped events:
1. Session lifecycle: `CreateSession`, `CreateCorrectionSession`, `LockSession`, `PinSession` -> `SessionCreated`, `CorrectionSessionCreated`, `SessionLocked`, `SessionPinned`, `SessionUnpinned`.
2. Import/preprocess: `ImportDocument`, `ConfirmDuplicate`, `ApplyPreprocessing`, `ReprocessDocument` -> `DocumentImported`, `DuplicateMarked`, `PreprocessingApplied`, `DocumentReprocessed`.
3. Extraction: `RunExtraction`, `ReRunExtraction` -> `ExtractionCompleted`, `ExtractionFailed`, `DerivedDataUpdated`.
4. Mapping:
- Field commands: `AssignFieldValue` -> `FieldValueAssigned`, `FieldValueUpdated`, `FieldLocked`, `FieldUnlocked`.
- Item commands: `AddItemRow`, `DeleteItemRow`, `AssignItemValue`, `LockItemRow` -> `ItemRowAdded`, `ItemRowDeleted`, `ItemValueAssigned`, `ItemRowLocked`.
- Extra table commands: `AddExtraRow`, `AssignExtraValue` -> `ExtraRowAdded`, `ExtraValueAssigned`.
5. Anchors/learning: `AddAnchorRule`, `DisableAnchorRule`, `AddDictionaryRule`, `DisableDictionaryRule` -> `AnchorRuleCreated`, `AnchorRuleDisabled`, `DictionaryRuleLearned`, `DictionaryRuleDisabled`.
6. Review: `ResolveReviewTask`, `SkipReviewTask`, `BatchResolveField` -> `ReviewTaskResolved`, `ReviewTaskSkipped`, `FieldBatchConfirmed`.
7. Validation: `RunValidation`, `OverrideValidation` -> `ValidationCompleted`, `ValidationOverridden`.
8. Export/immutability: `ExportSession` -> `SessionExported`, `ExportManifestCreated`, `SessionLocked`.

### FR-5 Correction Session Behavior
1. Correction session MUST reference `base_session_id`.
2. Session state initialization MUST follow: `state = replay(base_session_events)`.
3. New correction actions MUST be applied as new commands/events only.
4. Previous events MUST never be edited.
5. Export metadata MUST include `base_session_id`, `revision_number`, and `delta_summary`.

### FR-6 Atomic Backend Processing
For each command, backend MUST execute atomically in this order:
1. Command received.
2. Validate session lock and command preconditions.
3. Apply state transaction.
4. Write domain tables.
5. Append event(s).
6. Create/resolve review tasks.
7. Trigger validation if needed.

If any step fails, command effects MUST roll back fully.

## 9. Non-Functional Requirements
1. Determinism: replaying identical event history must reconstruct equivalent state.
2. Integrity: event append must be durable and ordered by timestamp/sequence.
3. Performance: command handling should be interactive for local desktop use.
4. Auditability: every state mutation must be traceable from state row to causal event chain.
5. Security: command/event data remains within local encrypted vault model.

## 10. API and Domain Contract Alignment
1. Existing REST routes remain transport interfaces.
2. Each mutating REST endpoint MUST map to one domain command type.
3. Response payloads SHOULD include command/event identifiers where practical.
4. Route handlers MUST NOT bypass command handlers.

## 11. Invariants
1. No domain mutation without command.
2. No accepted command without at least one event.
3. No event mutation/deletion after append.
4. No mutating command accepted for locked sessions.
5. Correction sessions never rewrite base session history.

## 12. Acceptance Criteria
1. For each command group, integration tests verify state mutation + emitted event(s).
2. Locked session tests verify mutation rejection across all relevant command types.
3. Replay tests verify correction session reconstruction parity.
4. Failure injection tests verify full rollback and no partial event/state divergence.
5. Export tests verify correction metadata fields are present and correct.

## 13. Milestone Deliverables
1. Command dispatcher and typed command contracts.
2. Event emitter and append-only audit writer.
3. Lock-state guard middleware/check.
4. Replay engine for correction-session creation.
5. Test suite covering invariants and atomicity.

## 14. Risks and Mitigations
1. Risk: hidden direct DB writes bypassing command layer.
- Mitigation: enforce repository/service boundaries and test guards.
2. Risk: duplicate event emission on retries.
- Mitigation: idempotency keyed by `command_id`.
3. Risk: schema drift between events and state tables.
- Mitigation: versioned event payloads and migration tests.

## 15. Implementation Notes for Next Artifact
Next artifact should define formal state transitions and invariants per session status (`created`, `processing`, `review`, `validated`, `exported`, `locked`) to eliminate edge-case corruption paths.

## 16. Success Metrics
1. 100% of mutating endpoints mapped to command handlers.
2. 100% of accepted commands produce persisted events.
3. 0 allowed mutating operations against locked sessions in automated tests.
4. Deterministic replay pass rate at 100% on fixture suites.
