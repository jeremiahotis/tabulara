use std::collections::{HashMap, HashSet};

use crate::errors::{DomainError, DomainResult, ErrorCode};
use crate::interfaces::TransitionPolicy;
use crate::types::SessionStatus;

pub struct MatrixTransitionPolicy {
    allowed_by_status: HashMap<SessionStatus, HashSet<&'static str>>,
    legal_transitions: HashSet<(SessionStatus, SessionStatus)>,
}

impl MatrixTransitionPolicy {
    pub fn new() -> Self {
        use SessionStatus::{Created, Exported, Locked, Processing, Review, Validated};

        let mut allowed_by_status: HashMap<SessionStatus, HashSet<&'static str>> = HashMap::new();

        allowed_by_status.insert(
            Created,
            set(&[
                "ImportDocument",
                "PinSession",
                "AddAnchorRule",
                "DisableAnchorRule",
                "AddDictionaryRule",
                "DisableDictionaryRule",
            ]),
        );

        allowed_by_status.insert(
            Processing,
            set(&[
                "PinSession",
                "ImportDocument",
                "ConfirmDuplicate",
                "ApplyPreprocessing",
                "ReprocessDocument",
                "RunExtraction",
                "ReRunExtraction",
                "AssignFieldValue",
                "LockField",
                "AddItemRow",
                "DeleteItemRow",
                "AssignItemValue",
                "LockItemRow",
                "AddExtraRow",
                "AssignExtraValue",
                "ResolveReviewTask",
                "RunValidation",
                "AddAnchorRule",
                "DisableAnchorRule",
                "AddDictionaryRule",
                "DisableDictionaryRule",
            ]),
        );

        allowed_by_status.insert(
            Review,
            set(&[
                "PinSession",
                "ImportDocument",
                "ConfirmDuplicate",
                "ApplyPreprocessing",
                "ReprocessDocument",
                "RunExtraction",
                "ReRunExtraction",
                "AssignFieldValue",
                "LockField",
                "AddItemRow",
                "DeleteItemRow",
                "AssignItemValue",
                "LockItemRow",
                "AddExtraRow",
                "AssignExtraValue",
                "ResolveReviewTask",
                "SkipReviewTask",
                "BatchResolveField",
                "RunValidation",
                "OverrideValidation",
                "AddAnchorRule",
                "DisableAnchorRule",
                "AddDictionaryRule",
                "DisableDictionaryRule",
            ]),
        );

        allowed_by_status.insert(
            Validated,
            set(&[
                "PinSession",
                "ConfirmDuplicate",
                "AssignFieldValue",
                "AddItemRow",
                "DeleteItemRow",
                "AssignItemValue",
                "AddExtraRow",
                "AssignExtraValue",
                "ResolveReviewTask",
                "RunValidation",
                "OverrideValidation",
                "ExportSession",
                "AddAnchorRule",
                "DisableAnchorRule",
                "AddDictionaryRule",
                "DisableDictionaryRule",
            ]),
        );

        allowed_by_status.insert(
            Exported,
            set(&[
                "PinSession",
                "CreateCorrectionSession",
                "LockSession",
                "AddAnchorRule",
                "DisableAnchorRule",
                "AddDictionaryRule",
                "DisableDictionaryRule",
            ]),
        );

        allowed_by_status.insert(
            Locked,
            set(&[
                "PinSession",
                "CreateCorrectionSession",
                "AddAnchorRule",
                "DisableAnchorRule",
                "AddDictionaryRule",
                "DisableDictionaryRule",
            ]),
        );

        let legal_transitions = HashSet::from([
            (Created, Processing),
            (Processing, Review),
            (Review, Processing),
            (Review, Validated),
            (Validated, Review),
            (Validated, Exported),
            (Exported, Locked),
        ]);

        Self {
            allowed_by_status,
            legal_transitions,
        }
    }
}

impl Default for MatrixTransitionPolicy {
    fn default() -> Self {
        Self::new()
    }
}

impl TransitionPolicy for MatrixTransitionPolicy {
    fn assert_allowed(&self, command_type: &str, status: SessionStatus) -> DomainResult<()> {
        if status == SessionStatus::Locked && is_mutating_session_command(command_type) {
            return Err(DomainError {
                code: ErrorCode::SessionLocked,
                message: "Mutating command denied for locked session".to_string(),
                details: Some(serde_json::json!({ "command_type": command_type })),
            });
        }

        let allowed = self
            .allowed_by_status
            .get(&status)
            .is_some_and(|commands| commands.contains(command_type));

        if allowed {
            Ok(())
        } else {
            Err(DomainError {
                code: ErrorCode::CommandNotAllowedInState,
                message: "Command not allowed in current session state".to_string(),
                details: Some(serde_json::json!({
                    "command_type": command_type,
                    "status": status,
                })),
            })
        }
    }

    fn assert_transition(&self, from: SessionStatus, to: SessionStatus) -> DomainResult<()> {
        if from == to {
            return Ok(());
        }

        if self.legal_transitions.contains(&(from, to)) {
            Ok(())
        } else {
            Err(DomainError {
                code: ErrorCode::InvalidStateTransition,
                message: "Illegal session status transition".to_string(),
                details: Some(serde_json::json!({ "from": from, "to": to })),
            })
        }
    }
}

fn set(items: &'static [&'static str]) -> HashSet<&'static str> {
    items.iter().copied().collect::<HashSet<_>>()
}

fn is_mutating_session_command(command_type: &str) -> bool {
    !matches!(
        command_type,
        "PinSession"
            | "CreateCorrectionSession"
            | "AddAnchorRule"
            | "DisableAnchorRule"
            | "AddDictionaryRule"
            | "DisableDictionaryRule"
    )
}
