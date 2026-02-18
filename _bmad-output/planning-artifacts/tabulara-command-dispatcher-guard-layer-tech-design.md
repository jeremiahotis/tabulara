---
title: Tabulara Command Dispatcher and Guard Layer - Technical Design
date: 2026-02-18
owner: Jeremiah
status: Implementation Ready
related_prd: /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-prd-command-event-model.md
related_state_spec: /Users/jeremiahotis/projects/tabulara/_bmad-output/planning-artifacts/tabulara-state-transition-invariant-spec.md
---

# 1. Purpose
Define the concrete backend architecture for command dispatch, state guards, transaction boundaries, idempotency, and event append semantics for Tabulara.

# 2. Scope
In scope:
1. Dispatcher interfaces and execution pipeline.
2. Guard layer (permission, transition, precondition, invariant).
3. Transaction model and failure semantics.
4. Idempotency storage and replay behavior.
5. Mapping strategy from REST routes to command handlers.

Out of scope:
1. OCR engine internals.
2. UI concerns.
3. Cloud/distributed event transport.

# 3. Technology Assumptions
1. Runtime: Tauri backend in Rust.
2. Data store: SQLCipher SQLite.
3. Event storage: `audit_log` table (`event_json` payload) plus optional indexed columns.
4. IDs: UUIDv7 preferred.

# 4. High-Level Architecture
Components:
1. `CommandRouter` (maps command type to handler).
2. `CommandDispatcher` (orchestrates lifecycle).
3. `GuardEngine` (command/state/precondition checks).
4. `UnitOfWork` (single transaction boundary).
5. `EventFactory` (builds typed domain events).
6. `EventStore` (append-only persistence).
7. `IdempotencyStore` (command dedupe and prior-result retrieval).
8. `InvariantEngine` (asserts hard invariants).
9. `ProjectionWriters` (state table mutations).

Flow:
1. REST endpoint converts request to typed command.
2. Dispatcher executes guard -> mutate -> event append within one transaction.
3. Response returns `command_id`, `event_ids`, `session_status`, optional warnings.

# 5. Core Interfaces (Rust-style)
```rust
pub trait Command {
    fn command_id(&self) -> Uuid;
    fn command_type(&self) -> &'static str;
    fn actor(&self) -> &str;
    fn timestamp(&self) -> DateTime<Utc>;
    fn session_id(&self) -> Option<Uuid>;
}

pub trait CommandHandler<C: Command> {
    fn handle(&self, ctx: &mut CommandContext, cmd: &C) -> Result<CommandOutcome, DomainError>;
}

pub struct CommandOutcome {
    pub state_delta: StateDelta,
    pub derived_transition: Option<SessionStatusTransition>,
    pub review_actions: Vec<ReviewAction>,
    pub validation_trigger: ValidationTrigger,
}

pub trait CommandDispatcher {
    fn dispatch<C: Command>(&self, cmd: C) -> Result<DispatchResult, DomainError>;
}

pub struct DispatchResult {
    pub command_id: Uuid,
    pub event_ids: Vec<Uuid>,
    pub session_status: Option<SessionStatus>,
    pub idempotent_replay: bool,
}
```

# 6. Guard Layer Design
## 6.1 Guard types
1. EnvelopeGuard: schema, required fields, timestamp sanity.
2. IdempotencyGuard: reject or replay prior result by `command_id`.
3. SessionStateGuard: command allowed in current status matrix.
4. TransitionGuard: computed `from -> to` legality.
5. DomainPreconditionGuard: command-specific checks.
6. InvariantGuard: post-mutation assertions before commit.

## 6.2 Guard pipeline order
1. EnvelopeGuard
2. IdempotencyGuard (fast read)
3. SessionStateGuard
4. DomainPreconditionGuard
5. Handler execution
6. TransitionGuard
7. InvariantGuard
8. Event append assertion (>=1)

## 6.3 Guard contract
Each guard returns:
1. `Ok(())` to continue.
2. `Err(DomainError { code, message, details })` for deterministic rejection.

Error codes must match state spec:
1. `SESSION_LOCKED`
2. `INVALID_STATE_TRANSITION`
3. `COMMAND_NOT_ALLOWED_IN_STATE`
4. `IDEMPOTENCY_CONFLICT`
5. `PRECONDITION_FAILED`
6. `INVARIANT_VIOLATION`

# 7. Unit of Work and Transaction Boundaries
## 7.1 Rule
Exactly one SQL transaction per accepted command.

## 7.2 Order inside transaction
1. Acquire session-scoped write lock (logical DB lock row or immediate transaction).
2. Load current aggregate/session snapshot.
3. Execute handler to produce `state_delta`.
4. Persist state table mutations.
5. Build and append event records.
6. Apply review task updates.
7. Apply optional validation trigger updates.
8. Run invariant assertions against written-but-uncommitted state.
9. Commit.

If any step fails: rollback entire transaction.

## 7.3 Forbidden pattern
No event append outside same transaction as state mutation.

# 8. Idempotency Store Contract
## 8.1 Table
`command_log`
1. `command_id` (pk)
2. `command_type`
3. `session_id` nullable
4. `request_hash` (hash of normalized payload)
5. `status` (`in_progress|committed|failed`)
6. `result_json` (event_ids, final status, response contract)
7. `created_at`, `updated_at`

## 8.2 Behavior
1. On first seen command: insert `in_progress` row.
2. On success: set `committed` + persist result.
3. Retry same `command_id` + same hash + committed: return stored result (`idempotent_replay=true`).
4. Retry same `command_id` + different hash: fail `IDEMPOTENCY_CONFLICT`.
5. Stale `in_progress` older than timeout may be safely reconciled via transaction check.

# 9. Event Model Persistence
## 9.1 Event record
`audit_log`
1. `id` (pk)
2. `project_id`
3. `session_id` nullable
4. `event_type`
5. `event_json` (full envelope)
6. `created_at`

`event_json` includes:
1. `event_id`
2. `caused_by`
3. `type`
4. `timestamp`
5. `data`

## 9.2 Optional denormalized columns
1. `command_id` (indexed)
2. `sequence_no` per session for deterministic replay order.

# 10. Session Aggregate and Transition Engine
Aggregate snapshot fields:
1. `session_id`
2. `status`
3. `exported_at`
4. `locked_at`
5. `base_session_id`

Transition engine API:
```rust
pub trait TransitionPolicy {
    fn assert_allowed(&self, command_type: &str, status: SessionStatus) -> Result<(), DomainError>;
    fn assert_transition(&self, from: SessionStatus, to: SessionStatus) -> Result<(), DomainError>;
}
```

Rules source:
1. Encoded from `tabulara-state-transition-invariant-spec.md` as a single static matrix.
2. No handler-specific hardcoded transitions outside policy.

# 11. Handler Responsibilities by Layer
1. REST layer:
- Parse/validate transport payload.
- Build typed command DTO.
- No direct DB writes.

2. Command handler:
- Domain logic only.
- Produce `state_delta` + semantic intents.
- No direct event insertion (delegate to EventFactory/EventStore).

3. Projection writers:
- Apply deterministic table writes from `state_delta`.

4. EventFactory:
- Translate outcome to one or more events.
- Enforce event schema and `caused_by` linkage.

# 12. REST-to-Command Mapping Contract
Examples:
1. `POST /sessions/:id/lock` -> `LockSession`.
2. `POST /sessions/:id/export` -> `ExportSession`.
3. `PUT /field-values/:id` -> `AssignFieldValue` or `UpdateFieldValue` (explicit command type selection required).
4. `POST /sessions/:id/review/batch` -> `BatchResolveField`.

Constraint:
1. Every mutating route must map to exactly one command entry point.
2. Composite UI actions must be decomposed into explicit command sequence.

# 13. Concurrency and Isolation
1. Use `BEGIN IMMEDIATE` (or equivalent) to prevent conflicting writers.
2. Lock scope: per-session for session-bound commands; project-scope for schema/dictionary commands.
3. Concurrent command on same session:
- One proceeds.
- Other retries with bounded backoff or returns deterministic busy/precondition error.

# 14. Invariant Engine
Invariant checks grouped by stage:
1. Core event invariants.
2. Lock invariants.
3. Export invariants.
4. Correction invariants.
5. Referential integrity invariants.

API:
```rust
pub trait InvariantEngine {
    fn assert_all(&self, tx: &mut Tx, ctx: &InvariantContext) -> Result<(), DomainError>;
}
```

Runtime mode:
1. Always-on critical invariants.
2. Optional deep invariants enabled in debug/test for costlier scans.

# 15. Observability and Audit
Per dispatch log fields:
1. `command_id`
2. `command_type`
3. `session_id`
4. `duration_ms`
5. `result` (`committed|replayed|rejected|failed`)
6. `error_code` nullable
7. `event_count`

Audit guarantees:
1. Can trace any mutated row to command/event lineage.
2. Can reconstruct session by ordered event replay.

# 16. Security and Validation Notes
1. Never trust REST payload source refs blindly; validate foreign keys and ownership.
2. Reject commands referencing entities outside active project/vault context.
3. Avoid storing plaintext secrets in command/event payloads.
4. Respect vault lock status before command dispatch begins.

# 17. Sequence Diagram (Text)
1. Client sends REST mutation.
2. Route builds typed command.
3. Dispatcher runs EnvelopeGuard + IdempotencyGuard.
4. Transaction begins.
5. SessionStateGuard + PreconditionGuard.
6. Handler computes delta.
7. TransitionPolicy validates.
8. Projection writes apply.
9. EventFactory builds events.
10. EventStore appends events.
11. InvariantEngine asserts.
12. Commit.
13. Idempotency result persisted.
14. Response returned.

# 18. Testing Strategy
## 18.1 Dispatcher tests
1. Unknown command type rejected.
2. Guard order enforced.
3. Idempotent replay returns prior result.

## 18.2 Transaction tests
1. Inject failure between state write and event append -> rollback complete.
2. Inject invariant failure post-write pre-commit -> rollback complete.

## 18.3 Matrix tests
1. Table-driven tests for all command types x session states.
2. Expected allow/deny and error code assertions.

## 18.4 Replay tests
1. Event sequence rebuilds exact aggregate status.
2. Correction session replay + delta produces deterministic export metadata.

# 19. Implementation Plan (Build Slices)
1. Slice A: command envelopes + dispatcher skeleton + command router.
2. Slice B: idempotency table and guard.
3. Slice C: transition policy matrix + session state guard.
4. Slice D: first vertical command (`AssignFieldValue`) end-to-end with events.
5. Slice E: export/lock path and correction-session creation path.
6. Slice F: invariant engine + failure-injection tests.

# 20. Definition of Done
1. All mutating REST routes use dispatcher only.
2. Command idempotency enforced and tested.
3. Permission matrix enforced for all command handlers.
4. Event append and state mutation are atomic.
5. Invariant test suite passes with no critical violations.
6. Replay/correction tests pass for golden fixtures.

# 21. Immediate Next Artifact
Generate `Command Type Catalog` with concrete per-command payload schema, preconditions, emitted events, and transition impact to accelerate implementation.
