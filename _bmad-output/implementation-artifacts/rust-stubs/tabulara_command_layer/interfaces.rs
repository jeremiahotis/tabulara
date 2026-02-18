use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::commands::{AnyCommand, CommandDto};
use crate::errors::{DomainError, DomainResult};
use crate::types::{DispatchResult, EventEnvelope, SessionStatus, SessionStatusTransition};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateDelta {
    pub summary: String,
    pub data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewAction {
    pub kind: String,
    pub payload: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationTrigger {
    None,
    Async,
    Sync,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandOutcome {
    pub state_delta: StateDelta,
    pub transition: Option<SessionStatusTransition>,
    pub review_actions: Vec<ReviewAction>,
    pub validation_trigger: ValidationTrigger,
}

#[derive(Debug, Clone)]
pub struct CommandContext {
    pub now: DateTime<Utc>,
    pub actor: String,
}

pub trait GenericCommandHandler {
    fn can_handle(&self, command_type: &str) -> bool;
    fn handle(&self, ctx: &mut CommandContext, cmd: &AnyCommand) -> DomainResult<CommandOutcome>;
}

pub trait TransitionPolicy {
    fn assert_allowed(&self, command_type: &str, status: SessionStatus) -> DomainResult<()>;
    fn assert_transition(&self, from: SessionStatus, to: SessionStatus) -> DomainResult<()>;
}

pub trait IdempotencyStore {
    fn begin(&self, command: &dyn CommandDto, request_hash: &str) -> DomainResult<IdempotencyState>;
    fn commit(&self, command_id: Uuid, result: &DispatchResult) -> DomainResult<()>;
    fn mark_failed(&self, command_id: Uuid, error: &DomainError) -> DomainResult<()>;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IdempotencyState {
    New,
    Replay(DispatchResult),
    Conflict,
}

pub trait EventFactory {
    fn build_events(
        &self,
        command: &dyn CommandDto,
        outcome: &CommandOutcome,
    ) -> DomainResult<Vec<EventEnvelope>>;
}

pub trait EventStore {
    fn append(&self, events: &[EventEnvelope]) -> DomainResult<()>;
}

pub trait InvariantEngine {
    fn assert_all(&self, session_id: Option<Uuid>) -> DomainResult<()>;
}

pub trait SessionReader {
    fn get_status(&self, session_id: Uuid) -> DomainResult<SessionStatus>;
}

pub trait ProjectionWriter {
    fn apply_state_delta(&self, outcome: &CommandOutcome) -> DomainResult<()>;
    fn apply_review_actions(&self, actions: &[ReviewAction]) -> DomainResult<()>;
    fn apply_validation_trigger(&self, trigger: &ValidationTrigger) -> DomainResult<()>;
    fn update_session_status(&self, session_id: Uuid, next: SessionStatus) -> DomainResult<()>;
}

pub trait UnitOfWork {
    fn within_tx<T, F>(&self, f: F) -> DomainResult<T>
    where
        F: FnOnce() -> DomainResult<T>;
}

pub trait CommandDispatcher {
    fn dispatch(&self, command: AnyCommand) -> DomainResult<DispatchResult>;
}

pub struct DispatcherDeps<'a, U: UnitOfWork> {
    pub handlers: Vec<&'a dyn GenericCommandHandler>,
    pub transitions: &'a dyn TransitionPolicy,
    pub idempotency: &'a dyn IdempotencyStore,
    pub events: &'a dyn EventStore,
    pub event_factory: &'a dyn EventFactory,
    pub invariants: &'a dyn InvariantEngine,
    pub sessions: &'a dyn SessionReader,
    pub projections: &'a dyn ProjectionWriter,
    pub uow: &'a U,
}
