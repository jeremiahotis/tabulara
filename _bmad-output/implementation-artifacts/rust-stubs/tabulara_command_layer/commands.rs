use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::types::{
    DictionaryScope, ExportFormat, MatchType, SourceType, ValidationRuleScope,
};

pub trait CommandDto {
    fn command_id(&self) -> Uuid;
    fn command_type(&self) -> &'static str;
    fn actor(&self) -> &str;
    fn timestamp(&self) -> DateTime<Utc>;
    fn session_id(&self) -> Option<Uuid>;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandEnvelope<TPayload> {
    pub command_id: Uuid,
    #[serde(rename = "type")]
    pub command_type: String,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: TPayload,
}

macro_rules! impl_command_dto {
    ($cmd:ident, $type_name:literal, $session_expr:expr) => {
        impl CommandDto for $cmd {
            fn command_id(&self) -> Uuid { self.command_id }
            fn command_type(&self) -> &'static str { $type_name }
            fn actor(&self) -> &str { &self.actor }
            fn timestamp(&self) -> DateTime<Utc> { self.timestamp }
            fn session_id(&self) -> Option<Uuid> { $session_expr(self) }
        }
    };
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSession {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: CreateSessionPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSessionPayload {
    pub project_id: Uuid,
    pub schema_id: Uuid,
    pub source: String,
}
impl_command_dto!(CreateSession, "CreateSession", |_| None);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCorrectionSession {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: CreateCorrectionSessionPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCorrectionSessionPayload {
    pub project_id: Uuid,
    pub schema_id: Uuid,
    pub base_session_id: Uuid,
}
impl_command_dto!(CreateCorrectionSession, "CreateCorrectionSession", |_| None);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockSession {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: LockSessionPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockSessionPayload {
    pub session_id: Uuid,
    pub reason: Option<String>,
}
impl_command_dto!(LockSession, "LockSession", |c: &LockSession| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PinSession {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: PinSessionPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PinSessionPayload {
    pub session_id: Uuid,
    pub pinned: bool,
}
impl_command_dto!(PinSession, "PinSession", |c: &PinSession| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportDocument {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: ImportDocumentPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportDocumentPayload {
    pub session_id: Uuid,
    pub blob_ids: Vec<Uuid>,
    pub metadata: Option<serde_json::Value>,
}
impl_command_dto!(ImportDocument, "ImportDocument", |c: &ImportDocument| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfirmDuplicate {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: ConfirmDuplicatePayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfirmDuplicatePayload {
    pub session_id: Uuid,
    pub document_id: Uuid,
    pub duplicate_of_document_id: Uuid,
}
impl_command_dto!(ConfirmDuplicate, "ConfirmDuplicate", |c: &ConfirmDuplicate| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplyPreprocessing {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: ApplyPreprocessingPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplyPreprocessingPayload {
    pub session_id: Uuid,
    pub page_id: Uuid,
    pub params: serde_json::Value,
}
impl_command_dto!(ApplyPreprocessing, "ApplyPreprocessing", |c: &ApplyPreprocessing| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReprocessDocument {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: ReprocessDocumentPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReprocessDocumentPayload {
    pub session_id: Uuid,
    pub document_id: Uuid,
    pub params: serde_json::Value,
}
impl_command_dto!(ReprocessDocument, "ReprocessDocument", |c: &ReprocessDocument| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunExtraction {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: RunExtractionPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunExtractionPayload {
    pub session_id: Uuid,
    pub engine: String,
    pub params: serde_json::Value,
}
impl_command_dto!(RunExtraction, "RunExtraction", |c: &RunExtraction| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReRunExtraction {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: ReRunExtractionPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReRunExtractionPayload {
    pub session_id: Uuid,
    pub scope: String,
    pub target_id: Uuid,
    pub params: serde_json::Value,
}
impl_command_dto!(ReRunExtraction, "ReRunExtraction", |c: &ReRunExtraction| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignFieldValue {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: AssignFieldValuePayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignFieldValuePayload {
    pub session_id: Uuid,
    pub document_id: Uuid,
    pub schema_field_id: Uuid,
    pub raw_value: String,
    pub normalized_value: Option<String>,
    pub source: SourceType,
    pub source_ref: serde_json::Value,
}
impl_command_dto!(AssignFieldValue, "AssignFieldValue", |c: &AssignFieldValue| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockField {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: LockFieldPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockFieldPayload {
    pub session_id: Uuid,
    pub field_value_id: Uuid,
    pub locked: bool,
}
impl_command_dto!(LockField, "LockField", |c: &LockField| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddItemRow {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: AddItemRowPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddItemRowPayload {
    pub session_id: Uuid,
    pub document_id: Uuid,
    pub row_index: i32,
}
impl_command_dto!(AddItemRow, "AddItemRow", |c: &AddItemRow| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeleteItemRow {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: DeleteItemRowPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeleteItemRowPayload {
    pub session_id: Uuid,
    pub item_id: Uuid,
}
impl_command_dto!(DeleteItemRow, "DeleteItemRow", |c: &DeleteItemRow| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignItemValue {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: AssignItemValuePayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignItemValuePayload {
    pub session_id: Uuid,
    pub item_id: Uuid,
    pub schema_field_id: Uuid,
    pub raw_value: String,
    pub normalized_value: Option<String>,
    pub source: SourceType,
    pub source_ref: serde_json::Value,
}
impl_command_dto!(AssignItemValue, "AssignItemValue", |c: &AssignItemValue| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockItemRow {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: LockItemRowPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockItemRowPayload {
    pub session_id: Uuid,
    pub item_id: Uuid,
    pub locked: bool,
}
impl_command_dto!(LockItemRow, "LockItemRow", |c: &LockItemRow| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddExtraRow {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: AddExtraRowPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddExtraRowPayload {
    pub session_id: Uuid,
    pub document_id: Uuid,
    pub table_name: String,
    pub row_index: i32,
}
impl_command_dto!(AddExtraRow, "AddExtraRow", |c: &AddExtraRow| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignExtraValue {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: AssignExtraValuePayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignExtraValuePayload {
    pub session_id: Uuid,
    pub extra_row_id: Uuid,
    pub schema_field_id: Uuid,
    pub raw_value: String,
    pub normalized_value: Option<String>,
    pub source: SourceType,
    pub source_ref: serde_json::Value,
}
impl_command_dto!(AssignExtraValue, "AssignExtraValue", |c: &AssignExtraValue| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddAnchorRule {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: AddAnchorRulePayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddAnchorRulePayload {
    pub project_id: Uuid,
    pub schema_field_id: Uuid,
    pub rule_json: serde_json::Value,
}
impl_command_dto!(AddAnchorRule, "AddAnchorRule", |_| None);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisableAnchorRule {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: DisableAnchorRulePayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisableAnchorRulePayload {
    pub project_id: Uuid,
    pub anchor_id: Uuid,
    pub enabled: bool,
}
impl_command_dto!(DisableAnchorRule, "DisableAnchorRule", |_| None);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddDictionaryRule {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: AddDictionaryRulePayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddDictionaryRulePayload {
    pub project_id: Uuid,
    pub scope: DictionaryScope,
    pub match_type: MatchType,
    pub match_value: String,
    pub replace_value: String,
}
impl_command_dto!(AddDictionaryRule, "AddDictionaryRule", |_| None);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisableDictionaryRule {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: DisableDictionaryRulePayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisableDictionaryRulePayload {
    pub project_id: Uuid,
    pub dictionary_rule_id: Uuid,
    pub enabled: bool,
}
impl_command_dto!(DisableDictionaryRule, "DisableDictionaryRule", |_| None);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolveReviewTask {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: ResolveReviewTaskPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolveReviewTaskPayload {
    pub session_id: Uuid,
    pub review_task_id: Uuid,
    pub resolution: String,
}
impl_command_dto!(ResolveReviewTask, "ResolveReviewTask", |c: &ResolveReviewTask| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkipReviewTask {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: SkipReviewTaskPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkipReviewTaskPayload {
    pub session_id: Uuid,
    pub review_task_id: Uuid,
    pub reason: String,
}
impl_command_dto!(SkipReviewTask, "SkipReviewTask", |c: &SkipReviewTask| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchResolveField {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: BatchResolveFieldPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchResolveFieldPayload {
    pub session_id: Uuid,
    pub field_key: String,
    pub action: String,
}
impl_command_dto!(BatchResolveField, "BatchResolveField", |c: &BatchResolveField| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunValidation {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: RunValidationPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunValidationPayload {
    pub session_id: Uuid,
    pub rule_scope: ValidationRuleScope,
}
impl_command_dto!(RunValidation, "RunValidation", |c: &RunValidation| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverrideValidation {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: OverrideValidationPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverrideValidationPayload {
    pub session_id: Uuid,
    pub validation_result_id: Uuid,
    pub reason: String,
}
impl_command_dto!(OverrideValidation, "OverrideValidation", |c: &OverrideValidation| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportSession {
    pub command_id: Uuid,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    pub payload: ExportSessionPayload,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportSessionPayload {
    pub session_id: Uuid,
    pub format: ExportFormat,
    pub include_in_vault: bool,
    pub export_path: Option<String>,
}
impl_command_dto!(ExportSession, "ExportSession", |c: &ExportSession| Some(c.payload.session_id));

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum AnyCommand {
    CreateSession(CreateSession),
    CreateCorrectionSession(CreateCorrectionSession),
    LockSession(LockSession),
    PinSession(PinSession),
    ImportDocument(ImportDocument),
    ConfirmDuplicate(ConfirmDuplicate),
    ApplyPreprocessing(ApplyPreprocessing),
    ReprocessDocument(ReprocessDocument),
    RunExtraction(RunExtraction),
    ReRunExtraction(ReRunExtraction),
    AssignFieldValue(AssignFieldValue),
    LockField(LockField),
    AddItemRow(AddItemRow),
    DeleteItemRow(DeleteItemRow),
    AssignItemValue(AssignItemValue),
    LockItemRow(LockItemRow),
    AddExtraRow(AddExtraRow),
    AssignExtraValue(AssignExtraValue),
    AddAnchorRule(AddAnchorRule),
    DisableAnchorRule(DisableAnchorRule),
    AddDictionaryRule(AddDictionaryRule),
    DisableDictionaryRule(DisableDictionaryRule),
    ResolveReviewTask(ResolveReviewTask),
    SkipReviewTask(SkipReviewTask),
    BatchResolveField(BatchResolveField),
    RunValidation(RunValidation),
    OverrideValidation(OverrideValidation),
    ExportSession(ExportSession),
}
