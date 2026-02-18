use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

use chrono::Utc;
use serde_json;
use uuid::Uuid;

use crate::commands::{AnyCommand, CommandDto};
use crate::errors::{DomainError, DomainResult, ErrorCode};
use crate::interfaces::{
    CommandContext, CommandDispatcher, DispatcherDeps, GenericCommandHandler, IdempotencyState,
    UnitOfWork,
};
use crate::types::{DispatchResult, SessionStatus};

pub struct DefaultCommandDispatcher<'a, U: UnitOfWork> {
    deps: DispatcherDeps<'a, U>,
}

impl<'a, U: UnitOfWork> DefaultCommandDispatcher<'a, U> {
    pub fn new(deps: DispatcherDeps<'a, U>) -> Self {
        Self { deps }
    }

    fn command_dto<'c>(&self, command: &'c AnyCommand) -> &'c dyn CommandDto {
        match command {
            AnyCommand::CreateSession(c) => c,
            AnyCommand::CreateCorrectionSession(c) => c,
            AnyCommand::LockSession(c) => c,
            AnyCommand::PinSession(c) => c,
            AnyCommand::ImportDocument(c) => c,
            AnyCommand::ConfirmDuplicate(c) => c,
            AnyCommand::ApplyPreprocessing(c) => c,
            AnyCommand::ReprocessDocument(c) => c,
            AnyCommand::RunExtraction(c) => c,
            AnyCommand::ReRunExtraction(c) => c,
            AnyCommand::AssignFieldValue(c) => c,
            AnyCommand::LockField(c) => c,
            AnyCommand::AddItemRow(c) => c,
            AnyCommand::DeleteItemRow(c) => c,
            AnyCommand::AssignItemValue(c) => c,
            AnyCommand::LockItemRow(c) => c,
            AnyCommand::AddExtraRow(c) => c,
            AnyCommand::AssignExtraValue(c) => c,
            AnyCommand::AddAnchorRule(c) => c,
            AnyCommand::DisableAnchorRule(c) => c,
            AnyCommand::AddDictionaryRule(c) => c,
            AnyCommand::DisableDictionaryRule(c) => c,
            AnyCommand::ResolveReviewTask(c) => c,
            AnyCommand::SkipReviewTask(c) => c,
            AnyCommand::BatchResolveField(c) => c,
            AnyCommand::RunValidation(c) => c,
            AnyCommand::OverrideValidation(c) => c,
            AnyCommand::ExportSession(c) => c,
        }
    }

    fn find_handler<'h>(&'h self, command_type: &str) -> Option<&'h dyn GenericCommandHandler> {
        self.deps
            .handlers
            .iter()
            .copied()
            .find(|handler| handler.can_handle(command_type))
    }

    fn request_hash(command: &AnyCommand) -> DomainResult<String> {
        let bytes = serde_json::to_vec(command).map_err(|e| DomainError {
            code: ErrorCode::PreconditionFailed,
            message: "Unable to serialize command for idempotency hash".to_string(),
            details: Some(serde_json::json!({ "error": e.to_string() })),
        })?;

        let mut hasher = DefaultHasher::new();
        bytes.hash(&mut hasher);
        Ok(format!("{:x}", hasher.finish()))
    }

    fn choose_status(current: Option<SessionStatus>, candidate: Option<SessionStatus>) -> Option<SessionStatus> {
        candidate.or(current)
    }
}

impl<'a, U: UnitOfWork> CommandDispatcher for DefaultCommandDispatcher<'a, U> {
    fn dispatch(&self, command: AnyCommand) -> DomainResult<DispatchResult> {
        let request_hash = Self::request_hash(&command)?;
        let dto = self.command_dto(&command);

        match self.deps.idempotency.begin(dto, &request_hash)? {
            IdempotencyState::Replay(existing) => return Ok(existing),
            IdempotencyState::Conflict => {
                return Err(DomainError {
                    code: ErrorCode::IdempotencyConflict,
                    message: "Command ID already used with different payload".to_string(),
                    details: Some(serde_json::json!({ "command_id": dto.command_id() })),
                })
            }
            IdempotencyState::New => {}
        }

        let result = self.deps.uow.within_tx(|| {
            let session_id = dto.session_id();
            let command_type = dto.command_type();

            let mut current_status = None;
            if let Some(sid) = session_id {
                let status = self.deps.sessions.get_status(sid)?;
                self.deps.transitions.assert_allowed(command_type, status)?;
                current_status = Some(status);
            }

            let handler = self.find_handler(command_type).ok_or_else(|| DomainError {
                code: ErrorCode::NotFound,
                message: format!("No handler registered for command type {command_type}"),
                details: None,
            })?;

            let mut ctx = CommandContext {
                now: Utc::now(),
                actor: dto.actor().to_string(),
            };

            let outcome = handler.handle(&mut ctx, &command)?;

            if let (Some(from), Some(transition)) = (current_status, &outcome.transition) {
                self.deps.transitions.assert_transition(from, transition.to)?;
            }

            self.deps.projections.apply_state_delta(&outcome)?;
            self.deps.projections.apply_review_actions(&outcome.review_actions)?;
            self.deps
                .projections
                .apply_validation_trigger(&outcome.validation_trigger)?;

            if let (Some(sid), Some(transition)) = (session_id, &outcome.transition) {
                self.deps
                    .projections
                    .update_session_status(sid, transition.to)?;
            }

            let events = self.deps.event_factory.build_events(dto, &outcome)?;
            if events.is_empty() {
                return Err(DomainError {
                    code: ErrorCode::InvariantViolation,
                    message: "Accepted command must emit at least one event".to_string(),
                    details: Some(serde_json::json!({ "command_type": command_type })),
                });
            }

            self.deps.events.append(&events)?;
            self.deps.invariants.assert_all(session_id)?;

            let next = outcome.transition.as_ref().map(|t| t.to);
            let session_status = Self::choose_status(current_status, next);

            Ok(DispatchResult {
                command_id: dto.command_id(),
                event_ids: events.iter().map(|e| e.event_id).collect::<Vec<Uuid>>(),
                session_status,
                idempotent_replay: false,
            })
        });

        match result {
            Ok(ref committed) => {
                self.deps.idempotency.commit(dto.command_id(), committed)?;
            }
            Err(ref err) => {
                // Best-effort status write for observability; dispatch error is returned regardless.
                let _ = self.deps.idempotency.mark_failed(dto.command_id(), err);
            }
        }

        result
    }
}
