use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use chrono::Utc;
use uuid::Uuid;

use crate::commands::CommandDto;
use crate::errors::{DomainError, DomainResult, ErrorCode};
use crate::interfaces::{
    CommandOutcome, EventFactory, EventStore, IdempotencyState, IdempotencyStore,
    InvariantEngine, ProjectionWriter, ReviewAction, UnitOfWork, ValidationTrigger,
};
use crate::types::{DispatchResult, EventEnvelope, SessionStatus};

#[derive(Debug, Clone)]
struct IdempotencyEntry {
    request_hash: String,
    status: EntryStatus,
    result: Option<DispatchResult>,
    error: Option<DomainError>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum EntryStatus {
    InProgress,
    Committed,
    Failed,
}

#[derive(Clone, Default)]
pub struct InMemoryIdempotencyStore {
    entries: Arc<Mutex<HashMap<Uuid, IdempotencyEntry>>>,
}

impl IdempotencyStore for InMemoryIdempotencyStore {
    fn begin(&self, command: &dyn CommandDto, request_hash: &str) -> DomainResult<IdempotencyState> {
        let mut guard = self.entries.lock().map_err(lock_poisoned)?;

        match guard.get(&command.command_id()) {
            None => {
                guard.insert(
                    command.command_id(),
                    IdempotencyEntry {
                        request_hash: request_hash.to_string(),
                        status: EntryStatus::InProgress,
                        result: None,
                        error: None,
                    },
                );
                Ok(IdempotencyState::New)
            }
            Some(existing) if existing.request_hash != request_hash => Ok(IdempotencyState::Conflict),
            Some(existing) if existing.status == EntryStatus::Committed => {
                let result = existing.result.clone().ok_or_else(|| DomainError {
                    code: ErrorCode::InvariantViolation,
                    message: "Committed idempotency entry is missing result".to_string(),
                    details: Some(serde_json::json!({ "command_id": command.command_id() })),
                })?;
                Ok(IdempotencyState::Replay(result))
            }
            Some(_) => Ok(IdempotencyState::Conflict),
        }
    }

    fn commit(&self, command_id: Uuid, result: &DispatchResult) -> DomainResult<()> {
        let mut guard = self.entries.lock().map_err(lock_poisoned)?;
        let entry = guard.get_mut(&command_id).ok_or_else(|| DomainError {
            code: ErrorCode::NotFound,
            message: "Idempotency entry not found on commit".to_string(),
            details: Some(serde_json::json!({ "command_id": command_id })),
        })?;

        entry.status = EntryStatus::Committed;
        entry.result = Some(result.clone());
        Ok(())
    }

    fn mark_failed(&self, command_id: Uuid, error: &DomainError) -> DomainResult<()> {
        let mut guard = self.entries.lock().map_err(lock_poisoned)?;
        let entry = guard.get_mut(&command_id).ok_or_else(|| DomainError {
            code: ErrorCode::NotFound,
            message: "Idempotency entry not found on mark_failed".to_string(),
            details: Some(serde_json::json!({ "command_id": command_id })),
        })?;

        entry.status = EntryStatus::Failed;
        entry.error = Some(error.clone());
        Ok(())
    }
}

#[derive(Clone, Default)]
pub struct InMemoryEventStore {
    events: Arc<Mutex<Vec<EventEnvelope>>>,
}

impl InMemoryEventStore {
    pub fn all_events(&self) -> DomainResult<Vec<EventEnvelope>> {
        let guard = self.events.lock().map_err(lock_poisoned)?;
        Ok(guard.clone())
    }
}

impl EventStore for InMemoryEventStore {
    fn append(&self, events: &[EventEnvelope]) -> DomainResult<()> {
        let mut guard = self.events.lock().map_err(lock_poisoned)?;
        guard.extend(events.iter().cloned());
        Ok(())
    }
}

#[derive(Clone, Default)]
pub struct InMemorySessionReader {
    statuses: Arc<Mutex<HashMap<Uuid, SessionStatus>>>,
}

impl InMemorySessionReader {
    pub fn set_status(&self, session_id: Uuid, status: SessionStatus) -> DomainResult<()> {
        let mut guard = self.statuses.lock().map_err(lock_poisoned)?;
        guard.insert(session_id, status);
        Ok(())
    }

    pub fn statuses(&self) -> DomainResult<HashMap<Uuid, SessionStatus>> {
        let guard = self.statuses.lock().map_err(lock_poisoned)?;
        Ok(guard.clone())
    }
}

impl crate::interfaces::SessionReader for InMemorySessionReader {
    fn get_status(&self, session_id: Uuid) -> DomainResult<SessionStatus> {
        let guard = self.statuses.lock().map_err(lock_poisoned)?;
        guard.get(&session_id).copied().ok_or_else(|| DomainError {
            code: ErrorCode::NotFound,
            message: "Session status not found".to_string(),
            details: Some(serde_json::json!({ "session_id": session_id })),
        })
    }
}

#[derive(Clone, Default)]
pub struct InMemoryProjectionWriter {
    statuses: Arc<Mutex<HashMap<Uuid, SessionStatus>>>,
    deltas: Arc<Mutex<Vec<serde_json::Value>>>,
    review_actions: Arc<Mutex<Vec<ReviewAction>>>,
    validation_triggers: Arc<Mutex<Vec<ValidationTrigger>>>,
}

impl InMemoryProjectionWriter {
    pub fn with_statuses(statuses: Arc<Mutex<HashMap<Uuid, SessionStatus>>>) -> Self {
        Self {
            statuses,
            deltas: Arc::new(Mutex::new(Vec::new())),
            review_actions: Arc::new(Mutex::new(Vec::new())),
            validation_triggers: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

impl ProjectionWriter for InMemoryProjectionWriter {
    fn apply_state_delta(&self, outcome: &CommandOutcome) -> DomainResult<()> {
        let mut guard = self.deltas.lock().map_err(lock_poisoned)?;
        guard.push(outcome.state_delta.data.clone());
        Ok(())
    }

    fn apply_review_actions(&self, actions: &[ReviewAction]) -> DomainResult<()> {
        let mut guard = self.review_actions.lock().map_err(lock_poisoned)?;
        guard.extend(actions.iter().cloned());
        Ok(())
    }

    fn apply_validation_trigger(&self, trigger: &ValidationTrigger) -> DomainResult<()> {
        let mut guard = self.validation_triggers.lock().map_err(lock_poisoned)?;
        guard.push(trigger.clone());
        Ok(())
    }

    fn update_session_status(&self, session_id: Uuid, next: SessionStatus) -> DomainResult<()> {
        let mut guard = self.statuses.lock().map_err(lock_poisoned)?;
        guard.insert(session_id, next);
        Ok(())
    }
}

#[derive(Clone, Default)]
pub struct NoopInvariantEngine;

impl InvariantEngine for NoopInvariantEngine {
    fn assert_all(&self, _session_id: Option<Uuid>) -> DomainResult<()> {
        Ok(())
    }
}

#[derive(Clone, Default)]
pub struct InMemoryUnitOfWork;

impl UnitOfWork for InMemoryUnitOfWork {
    fn within_tx<T, F>(&self, f: F) -> DomainResult<T>
    where
        F: FnOnce() -> DomainResult<T>,
    {
        f()
    }
}

#[derive(Clone, Default)]
pub struct SimpleEventFactory;

impl EventFactory for SimpleEventFactory {
    fn build_events(
        &self,
        command: &dyn CommandDto,
        outcome: &CommandOutcome,
    ) -> DomainResult<Vec<EventEnvelope>> {
        let event_type = if let Some(transition) = &outcome.transition {
            format!("{}:{}_to_{:?}", command.command_type(), "transition", transition.to)
        } else {
            format!("{}Processed", command.command_type())
        };

        Ok(vec![EventEnvelope {
            event_id: Uuid::now_v7(),
            caused_by: command.command_id(),
            event_type,
            timestamp: Utc::now(),
            data: serde_json::json!({
                "session_id": command.session_id(),
                "delta": outcome.state_delta.data,
            }),
        }])
    }
}

#[derive(Clone, Default)]
pub struct InMemoryReferenceBundle {
    pub idempotency: InMemoryIdempotencyStore,
    pub events: InMemoryEventStore,
    pub sessions: InMemorySessionReader,
    pub projections: InMemoryProjectionWriter,
    pub invariants: NoopInvariantEngine,
    pub event_factory: SimpleEventFactory,
    pub uow: InMemoryUnitOfWork,
}

impl InMemoryReferenceBundle {
    pub fn new() -> Self {
        let statuses = Arc::new(Mutex::new(HashMap::new()));
        Self {
            idempotency: InMemoryIdempotencyStore::default(),
            events: InMemoryEventStore::default(),
            sessions: InMemorySessionReader {
                statuses: statuses.clone(),
            },
            projections: InMemoryProjectionWriter::with_statuses(statuses),
            invariants: NoopInvariantEngine,
            event_factory: SimpleEventFactory,
            uow: InMemoryUnitOfWork,
        }
    }
}

fn lock_poisoned<T>(_err: std::sync::PoisonError<T>) -> DomainError {
    DomainError {
        code: ErrorCode::Internal,
        message: "In-memory store lock poisoned".to_string(),
        details: None,
    }
}
