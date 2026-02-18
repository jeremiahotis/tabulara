use crate::commands::AnyCommand;
use crate::errors::{DomainError, DomainResult, ErrorCode};
use crate::interfaces::GenericCommandHandler;

pub struct CommandRouter<'a> {
    handlers: Vec<&'a dyn GenericCommandHandler>,
}

impl<'a> CommandRouter<'a> {
    pub fn new() -> Self {
        Self { handlers: Vec::new() }
    }

    pub fn with_handlers(handlers: Vec<&'a dyn GenericCommandHandler>) -> Self {
        Self { handlers }
    }

    pub fn register(&mut self, handler: &'a dyn GenericCommandHandler) {
        self.handlers.push(handler);
    }

    pub fn handlers(&self) -> Vec<&'a dyn GenericCommandHandler> {
        self.handlers.clone()
    }

    pub fn resolve(&self, command: &AnyCommand) -> DomainResult<&'a dyn GenericCommandHandler> {
        let command_type = command_type(command);
        self.handlers
            .iter()
            .copied()
            .find(|h| h.can_handle(command_type))
            .ok_or_else(|| DomainError {
                code: ErrorCode::NotFound,
                message: format!("No handler registered for command type {command_type}"),
                details: None,
            })
    }
}

impl<'a> Default for CommandRouter<'a> {
    fn default() -> Self {
        Self::new()
    }
}

pub fn command_type(command: &AnyCommand) -> &'static str {
    match command {
        AnyCommand::CreateSession(_) => "CreateSession",
        AnyCommand::CreateCorrectionSession(_) => "CreateCorrectionSession",
        AnyCommand::LockSession(_) => "LockSession",
        AnyCommand::PinSession(_) => "PinSession",
        AnyCommand::ImportDocument(_) => "ImportDocument",
        AnyCommand::ConfirmDuplicate(_) => "ConfirmDuplicate",
        AnyCommand::ApplyPreprocessing(_) => "ApplyPreprocessing",
        AnyCommand::ReprocessDocument(_) => "ReprocessDocument",
        AnyCommand::RunExtraction(_) => "RunExtraction",
        AnyCommand::ReRunExtraction(_) => "ReRunExtraction",
        AnyCommand::AssignFieldValue(_) => "AssignFieldValue",
        AnyCommand::LockField(_) => "LockField",
        AnyCommand::AddItemRow(_) => "AddItemRow",
        AnyCommand::DeleteItemRow(_) => "DeleteItemRow",
        AnyCommand::AssignItemValue(_) => "AssignItemValue",
        AnyCommand::LockItemRow(_) => "LockItemRow",
        AnyCommand::AddExtraRow(_) => "AddExtraRow",
        AnyCommand::AssignExtraValue(_) => "AssignExtraValue",
        AnyCommand::AddAnchorRule(_) => "AddAnchorRule",
        AnyCommand::DisableAnchorRule(_) => "DisableAnchorRule",
        AnyCommand::AddDictionaryRule(_) => "AddDictionaryRule",
        AnyCommand::DisableDictionaryRule(_) => "DisableDictionaryRule",
        AnyCommand::ResolveReviewTask(_) => "ResolveReviewTask",
        AnyCommand::SkipReviewTask(_) => "SkipReviewTask",
        AnyCommand::BatchResolveField(_) => "BatchResolveField",
        AnyCommand::RunValidation(_) => "RunValidation",
        AnyCommand::OverrideValidation(_) => "OverrideValidation",
        AnyCommand::ExportSession(_) => "ExportSession",
    }
}
