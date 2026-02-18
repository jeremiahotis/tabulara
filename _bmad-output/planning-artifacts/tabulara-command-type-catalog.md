---
title: Tabulara Command Type Catalog
date: 2026-02-18
owner: Jeremiah
status: Implementation Ready
related_prd: /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-prd-command-event-model.md
related_state_spec: /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-state-transition-invariant-spec.md
related_dispatcher_design: /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-command-dispatcher-guard-layer-tech-design.md
---

# 1. Purpose
Canonical command catalog for Tabulara backend implementation. Each command defines payload schema, preconditions, emitted events, and session transition impact.

# 2. Shared Envelope
Every command uses:
```json
{
  "command_id": "uuid",
  "type": "<CommandType>",
  "actor": "local_user",
  "timestamp": "ISO8601 UTC",
  "payload": {}
}
```

# 3. Field Conventions
1. IDs are UUID.
2. `session_id` is required for session-bound commands.
3. `source` enum: `manual|anchor|zone`.
4. `status` transitions must satisfy lifecycle policy.

# 4. Session Lifecycle Commands
## 4.1 CreateSession
Payload schema:
```json
{ "project_id": "uuid", "schema_id": "uuid", "source": "manual" }
```
Preconditions:
1. Project exists and unlocked.
2. Schema exists and is active (or explicitly allowed).
Emitted events:
1. `SessionCreated`
Transition impact:
1. Creates new session with status `created`.

## 4.2 CreateCorrectionSession
Payload schema:
```json
{ "project_id": "uuid", "schema_id": "uuid", "base_session_id": "uuid" }
```
Preconditions:
1. Base session exists.
2. Base session is `locked` (recommended hard requirement).
3. Base belongs to same project.
Emitted events:
1. `CorrectionSessionCreated`
Transition impact:
1. Creates new correction session with status `created`.
2. No transition on base session.

## 4.3 LockSession
Payload schema:
```json
{ "session_id": "uuid", "reason": "optional string" }
```
Preconditions:
1. Session status is `exported`.
2. Session not already locked.
Emitted events:
1. `SessionLocked`
Transition impact:
1. `exported -> locked`.

## 4.4 PinSession
Payload schema:
```json
{ "session_id": "uuid", "pinned": true }
```
Preconditions:
1. Session exists.
Emitted events:
1. `SessionPinned` (when pinning)
2. `SessionUnpinned` (when unpinning)
Transition impact:
1. No lifecycle status change.

# 5. Import and Preprocessing Commands
## 5.1 ImportDocument
Payload schema:
```json
{ "session_id": "uuid", "blob_ids": ["uuid"], "metadata": { "source": "import" } }
```
Preconditions:
1. Session status in `created|processing|review` (review requires explicit allow flag).
2. Session not locked.
Emitted events:
1. `DocumentImported`
Transition impact:
1. `created -> processing` on first successful import.
2. Otherwise remains `processing` (or `review` if policy keeps state and opens tasks).

## 5.2 ConfirmDuplicate
Payload schema:
```json
{ "session_id": "uuid", "document_id": "uuid", "duplicate_of_document_id": "uuid" }
```
Preconditions:
1. Both documents exist in same session.
2. Session status allows duplicate edits.
Emitted events:
1. `DuplicateMarked`
Transition impact:
1. Usually no status change.
2. If run in `validated`, demote to `review`.

## 5.3 ApplyPreprocessing
Payload schema:
```json
{
  "session_id": "uuid",
  "page_id": "uuid",
  "params": {
    "rotate": 0,
    "deskew": true,
    "perspective": true,
    "contrast": "normal",
    "denoise": true
  }
}
```
Preconditions:
1. Page belongs to session.
2. Session status in `processing|review` (review requires explicit reprocess intent).
Emitted events:
1. `PreprocessingApplied`
Transition impact:
1. No required status change.
2. In `review`, may demote to `processing` if extraction invalidated.

## 5.4 ReprocessDocument
Payload schema:
```json
{ "session_id": "uuid", "document_id": "uuid", "params": { "full": true } }
```
Preconditions:
1. Session status in `processing|review`.
2. Explicit user confirmation if in `review`.
Emitted events:
1. `DocumentReprocessed`
2. `DerivedDataUpdated` (if extraction derivatives recalculated)
Transition impact:
1. `review -> processing` when derivatives invalidated.

# 6. Extraction Commands
## 6.1 RunExtraction
Payload schema:
```json
{ "session_id": "uuid", "engine": "tesseract", "params": { "language": "eng" } }
```
Preconditions:
1. Session has imported docs/pages.
2. Session status in `processing|review`.
Emitted events:
1. `ExtractionCompleted` on success
2. `ExtractionFailed` on failure
3. `DerivedDataUpdated` on success
Transition impact:
1. Success usually moves `processing -> review` once queue is generated.
2. Failure keeps status unchanged.

## 6.2 ReRunExtraction
Payload schema:
```json
{ "session_id": "uuid", "scope": "document|session", "target_id": "uuid", "params": {} }
```
Preconditions:
1. Existing extraction baseline for target.
2. Session status in `processing|review`.
Emitted events:
1. `ExtractionCompleted` or `ExtractionFailed`
2. `DerivedDataUpdated`
Transition impact:
1. `review -> processing` during rerun, then back to `review` after completion.

# 7. Mapping Commands
## 7.1 AssignFieldValue
Payload schema:
```json
{
  "session_id": "uuid",
  "document_id": "uuid",
  "schema_field_id": "uuid",
  "raw_value": "string",
  "normalized_value": "string",
  "source": "manual|anchor|zone",
  "source_ref": {}
}
```
Preconditions:
1. Session status in `processing|review|validated`.
2. Target field exists in active schema.
3. If session `validated`, command must demote to review.
Emitted events:
1. `FieldValueAssigned` (create)
2. `FieldValueUpdated` (update)
Transition impact:
1. Usually no change in `processing|review`.
2. `validated -> review` when value changes.

## 7.2 LockField
Payload schema:
```json
{ "session_id": "uuid", "field_value_id": "uuid", "locked": true }
```
Preconditions:
1. Field value exists.
2. Session not locked.
Emitted events:
1. `FieldLocked` (or `FieldUnlocked` when false)
Transition impact:
1. No lifecycle status change.

## 7.3 AddItemRow
Payload schema:
```json
{ "session_id": "uuid", "document_id": "uuid", "row_index": 0 }
```
Preconditions:
1. Document exists in session.
2. Session status in `processing|review|validated`.
Emitted events:
1. `ItemRowAdded`
Transition impact:
1. `validated -> review`.

## 7.4 DeleteItemRow
Payload schema:
```json
{ "session_id": "uuid", "item_id": "uuid" }
```
Preconditions:
1. Item row exists and not lock-protected.
2. Session status in `processing|review|validated`.
Emitted events:
1. `ItemRowDeleted`
Transition impact:
1. `validated -> review`.

## 7.5 AssignItemValue
Payload schema:
```json
{
  "session_id": "uuid",
  "item_id": "uuid",
  "schema_field_id": "uuid",
  "raw_value": "string",
  "normalized_value": "string",
  "source": "manual|anchor|zone",
  "source_ref": {}
}
```
Preconditions:
1. Item exists and belongs to session.
2. Field scope is `item`.
Emitted events:
1. `ItemValueAssigned`
Transition impact:
1. `validated -> review`.

## 7.6 LockItemRow
Payload schema:
```json
{ "session_id": "uuid", "item_id": "uuid", "locked": true }
```
Preconditions:
1. Item exists.
2. Session not locked.
Emitted events:
1. `ItemRowLocked`
Transition impact:
1. No lifecycle status change.

## 7.7 AddExtraRow
Payload schema:
```json
{ "session_id": "uuid", "document_id": "uuid", "table_name": "string", "row_index": 0 }
```
Preconditions:
1. Table exists in active schema.
2. Session status in `processing|review|validated`.
Emitted events:
1. `ExtraRowAdded`
Transition impact:
1. `validated -> review`.

## 7.8 AssignExtraValue
Payload schema:
```json
{
  "session_id": "uuid",
  "extra_row_id": "uuid",
  "schema_field_id": "uuid",
  "raw_value": "string",
  "normalized_value": "string",
  "source": "manual|anchor|zone",
  "source_ref": {}
}
```
Preconditions:
1. Extra row exists.
2. Field scope is `extra_table`.
Emitted events:
1. `ExtraValueAssigned`
Transition impact:
1. `validated -> review`.

# 8. Anchors and Learning Commands
## 8.1 AddAnchorRule
Payload schema:
```json
{ "project_id": "uuid", "schema_field_id": "uuid", "rule_json": {} }
```
Preconditions:
1. Schema field exists.
2. Rule passes parser/validator.
Emitted events:
1. `AnchorRuleCreated`
Transition impact:
1. No session lifecycle status change.

## 8.2 DisableAnchorRule
Payload schema:
```json
{ "project_id": "uuid", "anchor_id": "uuid", "enabled": false }
```
Preconditions:
1. Anchor exists.
Emitted events:
1. `AnchorRuleDisabled`
Transition impact:
1. No lifecycle status change.

## 8.3 AddDictionaryRule
Payload schema:
```json
{
  "project_id": "uuid",
  "scope": "global|field_key|vendor|name",
  "match_type": "exact|regex",
  "match_value": "string",
  "replace_value": "string"
}
```
Preconditions:
1. Rule is valid and non-conflicting per policy.
Emitted events:
1. `DictionaryRuleLearned`
Transition impact:
1. No session lifecycle status change.

## 8.4 DisableDictionaryRule
Payload schema:
```json
{ "project_id": "uuid", "dictionary_rule_id": "uuid", "enabled": false }
```
Preconditions:
1. Rule exists.
Emitted events:
1. `DictionaryRuleDisabled`
Transition impact:
1. No session lifecycle status change.

# 9. Review Workflow Commands
## 9.1 ResolveReviewTask
Payload schema:
```json
{ "session_id": "uuid", "review_task_id": "uuid", "resolution": "accepted|edited|confirmed" }
```
Preconditions:
1. Task exists and is `open`.
2. Session status in `review|validated`.
Emitted events:
1. `ReviewTaskResolved`
Transition impact:
1. Usually none.
2. May contribute to `review -> validated` when all blockers clear and validation passes.

## 9.2 SkipReviewTask
Payload schema:
```json
{ "session_id": "uuid", "review_task_id": "uuid", "reason": "string" }
```
Preconditions:
1. Task exists and is `open`.
2. Skip allowed by policy.
Emitted events:
1. `ReviewTaskSkipped`
Transition impact:
1. Usually none.
2. May still block validation depending on severity.

## 9.3 BatchResolveField
Payload schema:
```json
{ "session_id": "uuid", "field_key": "string", "action": "confirm_all|skip_all" }
```
Preconditions:
1. Target task set exists.
2. Session status in `review` (or conditionally `processing|validated`).
Emitted events:
1. `FieldBatchConfirmed`
Transition impact:
1. Usually none.
2. Can accelerate eligibility for `review -> validated`.

# 10. Validation Commands
## 10.1 RunValidation
Payload schema:
```json
{ "session_id": "uuid", "rule_scope": "all|changed_only" }
```
Preconditions:
1. Session status in `review|validated|processing` (processing conditional).
2. Required extraction/mapping baseline exists.
Emitted events:
1. `ValidationCompleted`
Transition impact:
1. `review -> validated` on clean or properly overridden blockers.
2. `validated` remains `validated` on re-run with no regressions.
3. `validated -> review` if new blocking errors found.

## 10.2 OverrideValidation
Payload schema:
```json
{ "session_id": "uuid", "validation_result_id": "uuid", "reason": "string" }
```
Preconditions:
1. Validation result exists and severity is overridable.
2. Reason is non-empty.
Emitted events:
1. `ValidationOverridden`
Transition impact:
1. No direct status change.
2. May enable subsequent `review -> validated`.

# 11. Export and Immutability Commands
## 11.1 ExportSession
Payload schema:
```json
{
  "session_id": "uuid",
  "format": "csv_bundle|xlsx|json",
  "include_in_vault": true,
  "export_path": "optional absolute path"
}
```
Preconditions:
1. Session status is `validated`.
2. No unresolved blocking validation errors.
3. Export destination is writable if external path used.
Emitted events:
1. `SessionExported`
2. `ExportManifestCreated`
3. `SessionLocked`
Transition impact:
1. `validated -> exported -> locked` (same command transaction chain).

# 12. Cross-Command Rules
1. Any mutating command against `locked` session is rejected with `SESSION_LOCKED`.
2. Every accepted command emits at least one event.
3. Any command modifying validated data must demote session to `review` unless explicitly exempt.
4. Same `command_id` + same payload hash returns idempotent replay.
5. Same `command_id` + different payload hash returns `IDEMPOTENCY_CONFLICT`.

# 13. Minimal Event Data Requirements by Type
1. All events: `event_id`, `caused_by`, `type`, `timestamp`, `data`.
2. Data must include enough identifiers to rebuild affected aggregate:
- session lifecycle events: `session_id`, `project_id`.
- mapping events: `session_id`, record id (`field_value_id|item_id|item_value_id|extra_row_id|extra_value_id`).
- export events: `session_id`, `export_id`, `manifest_blob_id`, hashes.

# 14. Acceptance Checklist for Implementation
1. Each command in this catalog has one typed DTO and one handler.
2. Each handler declares possible emitted events in tests.
3. Command-state matrix tests cover every command listed here.
4. Transition-impact behavior is verified by integration tests.
5. Rejection codes are deterministic and match policy.
