use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainError {
    pub code: ErrorCode,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    SessionLocked,
    InvalidStateTransition,
    CommandNotAllowedInState,
    IdempotencyConflict,
    PreconditionFailed,
    InvariantViolation,
    NotFound,
    Internal,
}

pub type DomainResult<T> = Result<T, DomainError>;
