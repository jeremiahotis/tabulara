use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SessionStatus {
    Created,
    Processing,
    Review,
    Validated,
    Exported,
    Locked,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SourceType {
    Manual,
    Anchor,
    Zone,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MatchType {
    Exact,
    Regex,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DictionaryScope {
    Global,
    FieldKey,
    Vendor,
    Name,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExportFormat {
    CsvBundle,
    Xlsx,
    Json,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ValidationRuleScope {
    All,
    ChangedOnly,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionStatusTransition {
    pub from: SessionStatus,
    pub to: SessionStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventEnvelope {
    pub event_id: Uuid,
    pub caused_by: Uuid,
    #[serde(rename = "type")]
    pub event_type: String,
    pub timestamp: DateTime<Utc>,
    pub data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DispatchResult {
    pub command_id: Uuid,
    pub event_ids: Vec<Uuid>,
    pub session_status: Option<SessionStatus>,
    pub idempotent_replay: bool,
}
