---
title: Tabulara State Transition and Invariant Specification
date: 2026-02-18
owner: Jeremiah
status: Implementation Ready
related_prd: /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-prd-command-event-model.md
---

# 1. Purpose
This specification defines legal session lifecycle transitions, command-state guards, and non-negotiable invariants for Tabulara's command-event backend to prevent edge-case corruption.

# 2. State Model
Session status enum:
1. `created`
2. `processing`
3. `review`
4. `validated`
5. `exported`
6. `locked`

State order is monotonic except where explicitly allowed (for correction-related flows).

# 3. Transition Rules
## 3.1 Legal transitions
1. `created -> processing`
2. `processing -> review`
3. `review -> validated`
4. `validated -> exported`
5. `exported -> locked`
6. `review -> processing` (allowed when explicit re-extraction/reprocessing is requested)
7. `validated -> review` (allowed when validation override is rejected or new review tasks are created)

## 3.2 Illegal transitions
1. Any `-> created` after creation.
2. Any transition from `locked` to non-locked.
3. `processing -> exported` (must pass review/validated gates).
4. `created -> validated` or `created -> exported` or `created -> locked`.
5. `review -> exported` without `validated`.

## 3.3 Transition triggers
1. `created -> processing`: first successful import/preprocess/extraction command.
2. `processing -> review`: extraction has completed and review tasks generated (or explicitly empty queue).
3. `review -> validated`: `RunValidation` completes with no blocking errors, or required overrides captured.
4. `validated -> exported`: `ExportSession` succeeds and export artifacts + manifest are stored.
5. `exported -> locked`: automatic `LockSession` as part of export finalization.

# 4. Command Permission Matrix
Legend:
1. `A` = allowed
2. `D` = denied
3. `C` = conditionally allowed (guard checks required)

| Command Group | created | processing | review | validated | exported | locked |
|---|---|---|---|---|---|---|
| CreateSession | D | D | D | D | D | D |
| CreateCorrectionSession | D | D | D | D | C | C |
| LockSession | D | D | D | D | A | D |
| PinSession / UnpinSession | A | A | A | A | A | A |
| ImportDocument | A | A | C | D | D | D |
| ConfirmDuplicate / ClearDuplicate | D | A | A | C | D | D |
| ApplyPreprocessing / ReprocessDocument | D | A | C | D | D | D |
| RunExtraction / ReRunExtraction | D | A | C | D | D | D |
| Mapping commands (fields/items/extra) | D | A | A | C | D | D |
| Anchor/Dictionary commands | A | A | A | A | A | A |
| ResolveReviewTask / SkipReviewTask / BatchResolveField | D | C | A | C | D | D |
| RunValidation | D | C | A | A | D | D |
| OverrideValidation | D | D | A | A | D | D |
| ExportSession | D | D | D | A | D | D |

Conditional guard notes:
1. `created`: import is allowed and may promote state to `processing`.
2. `review` re-entry to processing commands requires `force_reprocess=true` or explicit UI confirmation.
3. `validated` mapping or duplicate changes require demotion to `review` and invalidation of validation results.
4. `CreateCorrectionSession` requires base session in `locked` (or at minimum `exported` with completed manifest) and immutable base snapshot.

# 5. Hard Invariants
## 5.1 Event-sourcing invariants
1. No state mutation without accepted command.
2. Every accepted command emits >=1 event.
3. Every event has `caused_by` referencing existing `command_id`.
4. Events are append-only; no update/delete.

## 5.2 Locking invariants
1. `locked` session rejects all mutating commands.
2. `locked_at` is immutable once set.
3. `exported_at` must exist before `locked_at`.

## 5.3 Export invariants
1. Exactly one successful terminal export per session.
2. `SessionExported` and `ExportManifestCreated` must precede `SessionLocked`.
3. Export artifact hashes in manifest must match stored blob hashes.

## 5.4 Correction-session invariants
1. Correction session must reference `base_session_id`.
2. Base session must remain immutable forever.
3. Correction replay cannot mutate historical base events.
4. Correction export must include: `base_session_id`, `revision_number`, `delta_summary`.

## 5.5 Data consistency invariants
1. `sessions.status` must match latest lifecycle event chain.
2. `review_tasks.status` transitions: `open -> resolved|skipped` only.
3. Locked field/row flags prevent overwrite except in correction sessions.
4. Foreign keys in event payload refs must resolve at event write time (or be explicitly nullable by contract).

# 6. Corruption Guards
## 6.1 Pre-command guards
1. Validate command envelope schema.
2. Enforce idempotency on `command_id`.
3. Resolve target session and verify state permission matrix.
4. Reject stale actor context (vault locked, wrong project scope).

## 6.2 In-transaction guards
1. Acquire session-scoped write lock.
2. Apply mutation and dependent writes.
3. Re-check derived invariants before event append.
4. Append event(s) last in transaction.

## 6.3 Post-commit guards
1. Verify event count >=1 for accepted command.
2. Optionally run asynchronous integrity checks (hash parity, orphan references).
3. Emit operational warning if state transition occurred without expected lifecycle event.

# 7. Canonical Rejection Codes
Use deterministic errors for UI and testing:
1. `SESSION_LOCKED`
2. `INVALID_STATE_TRANSITION`
3. `COMMAND_NOT_ALLOWED_IN_STATE`
4. `IDEMPOTENCY_CONFLICT`
5. `PRECONDITION_FAILED`
6. `INVARIANT_VIOLATION`

# 8. Lifecycle Transition Pseudocode
```text
handle(command):
  validateEnvelope(command)
  if seen(command.command_id): return prior_result_or_IDEMPOTENCY_CONFLICT

  tx begin
    session = loadSession(command.payload.session_id)
    assertAllowed(command.type, session.status)
    assertPreconditions(command, session)

    mutateState(command)
    newStatus = deriveStatus(session, command)
    assertTransitionLegal(session.status, newStatus)

    persistState()
    events = buildEvents(command, state_delta, newStatus)
    assert events.size >= 1
    appendEvents(events)

    assertCoreInvariants(session.id)
  tx commit

  return success(command_id, event_ids, newStatus)
```

# 9. Edge-Case Scenarios and Required Behavior
1. Duplicate `ExportSession` command retry:
- First success returns exported+locked.
- Retry with same `command_id` returns idempotent success response.
- Retry with new `command_id` returns `COMMAND_NOT_ALLOWED_IN_STATE`.

2. Mapping update after validation:
- System allows only if it demotes session to `review` and invalidates previous validation results.
- Event chain must include demotion-relevant events before new validation.

3. Reprocess during review:
- Allowed only with explicit flag.
- Must regenerate derived extraction data and create `DerivedDataUpdated`.
- Existing manual locks remain respected unless correction-session strategy explicitly replaces them.

4. Event append failure after DB writes:
- Entire transaction rolls back.
- No partial data visible.

5. Creating correction from unlocked base:
- Deny with `PRECONDITION_FAILED` unless policy explicitly allows exported-not-locked (not recommended).

# 10. Test Contract
## 10.1 Transition tests
1. Verify all legal transitions succeed.
2. Verify all illegal transitions fail with deterministic code.

## 10.2 Invariant tests
1. Accepted command without events is impossible (forced failure expected).
2. Locked-session mutating commands always denied.
3. Export lifecycle event order is enforced.

## 10.3 Replay tests
1. Replaying base events reconstructs state deterministically.
2. Applying correction deltas changes only intended fields/rows.

## 10.4 Failure-injection tests
1. Fail before event append -> full rollback.
2. Fail on invariant assertion -> full rollback.
3. Fail after append must be impossible inside single transaction boundary.

# 11. Implementation Checklist
1. Implement `assertAllowed(command, status)` matrix as single source of truth.
2. Implement lifecycle `assertTransitionLegal(from, to)` guard.
3. Add idempotency store keyed by `command_id`.
4. Add invariant assertion suite callable in tests and optionally runtime debug mode.
5. Ensure command handlers are the only write path into state tables.

# 12. Decision on Next Step
Proceed to implementation artifact:
1. `Command Dispatcher + Guard Layer` technical design (interfaces, traits/services, transaction boundaries, and idempotency store contract).
