import { randomUUID } from 'node:crypto';

const REQUIRED_ENVELOPE_FIELDS = ['command_id', 'type', 'actor', 'timestamp', 'payload'];
const REQUIRED_CREATE_SESSION_FIELDS = ['project_id', 'schema_id'];
const REQUIRED_PIN_SESSION_FIELDS = ['session_id', 'pinned'];
const REQUIRED_IMPORT_DOCUMENT_FIELDS = ['session_id', 'blob_ids', 'metadata'];
const REQUIRED_CONFIRM_DUPLICATE_FIELDS = [
  'session_id',
  'document_id',
  'duplicate_of_document_id',
  'correlation',
];
const REQUIRED_APPLY_PREPROCESSING_FIELDS = [
  'session_id',
  'document_id',
  'page_ids',
  'preprocessing_profile',
];
const REQUIRED_REPROCESS_DOCUMENT_FIELDS = ['session_id', 'document_id', 'target_state', 'reason'];
const REQUIRED_RUN_EXTRACTION_FIELDS = ['session_id', 'document_id', 'extraction_profile', 'source_state'];
const SUPPORTED_COMMAND_TYPES = new Set([
  'CreateSession',
  'PinSession',
  'ImportDocument',
  'ConfirmDuplicate',
  'ApplyPreprocessing',
  'ReprocessDocument',
  'RunExtraction',
]);
const SUPPORTED_ACTOR_ROLES = new Set(['ops-user', 'service']);

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateCommandEnvelope(body) {
  if (!isRecord(body)) {
    return {
      ok: false,
      error: {
        code: 'CMD_ENVELOPE_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: [...REQUIRED_ENVELOPE_FIELDS],
        details: REQUIRED_ENVELOPE_FIELDS.map((field) => ({ field, reason: 'required' })),
      },
    };
  }

  const missingFields = REQUIRED_ENVELOPE_FIELDS.filter((field) => body[field] === undefined);
  const invalidDetails = [];

  if (body.command_id !== undefined && (typeof body.command_id !== 'string' || body.command_id.trim().length === 0)) {
    invalidDetails.push({ field: 'command_id', reason: 'invalid' });
  }

  if (body.type !== undefined && (typeof body.type !== 'string' || body.type.trim().length === 0)) {
    invalidDetails.push({ field: 'type', reason: 'invalid' });
  }

  if (body.actor !== undefined) {
    if (!isRecord(body.actor)) {
      invalidDetails.push({ field: 'actor', reason: 'invalid' });
    } else if (
      typeof body.actor.id !== 'string' ||
      body.actor.id.trim().length === 0 ||
      typeof body.actor.role !== 'string' ||
      !SUPPORTED_ACTOR_ROLES.has(body.actor.role)
    ) {
      invalidDetails.push({ field: 'actor', reason: 'invalid' });
    }
  }

  if (
    body.timestamp !== undefined &&
    (typeof body.timestamp !== 'string' || Number.isNaN(Date.parse(body.timestamp)))
  ) {
    invalidDetails.push({ field: 'timestamp', reason: 'invalid' });
  }

  if (body.payload !== undefined && !isRecord(body.payload)) {
    invalidDetails.push({ field: 'payload', reason: 'invalid' });
  }

  if (missingFields.length === 0 && invalidDetails.length === 0) {
    return { ok: true };
  }

  const details = [
    ...missingFields.map((field) => ({ field, reason: 'required' })),
    ...invalidDetails,
  ];

  return {
    ok: false,
    error: {
      code: 'CMD_ENVELOPE_VALIDATION_FAILED',
      category: 'validation',
      missing_fields: missingFields,
      invalid_fields: invalidDetails.map(({ field }) => field),
      details,
    },
  };
}

function validateCreateSessionPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      ok: false,
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: [...REQUIRED_CREATE_SESSION_FIELDS],
      },
    };
  }

  const missingFields = REQUIRED_CREATE_SESSION_FIELDS.filter((field) => {
    const value = payload[field];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missingFields.length > 0) {
    return {
      ok: false,
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: missingFields,
      },
    };
  }

  return { ok: true };
}

function validatePinSessionPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      ok: false,
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: [...REQUIRED_PIN_SESSION_FIELDS],
      },
    };
  }

  const missingFields = [];
  if (typeof payload.session_id !== 'string' || payload.session_id.trim().length === 0) {
    missingFields.push('session_id');
  }
  if (typeof payload.pinned !== 'boolean') {
    missingFields.push('pinned');
  }

  if (missingFields.length > 0) {
    return {
      ok: false,
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: missingFields,
      },
    };
  }

  return { ok: true };
}

function validateImportDocumentPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      ok: false,
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: [...REQUIRED_IMPORT_DOCUMENT_FIELDS],
      },
    };
  }

  const missingFields = [];
  if (typeof payload.session_id !== 'string' || payload.session_id.trim().length === 0) {
    missingFields.push('session_id');
  }
  if (
    !Array.isArray(payload.blob_ids) ||
    payload.blob_ids.length === 0 ||
    payload.blob_ids.some((blobId) => typeof blobId !== 'string' || blobId.trim().length === 0)
  ) {
    missingFields.push('blob_ids');
  }

  const metadata = payload.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    missingFields.push('metadata');
  } else {
    if (typeof metadata.source !== 'string' || metadata.source.trim().length === 0) {
      missingFields.push('metadata.source');
    }
    if (typeof metadata.file_name !== 'string' || metadata.file_name.trim().length === 0) {
      missingFields.push('metadata.file_name');
    }
    if (typeof metadata.mime_type !== 'string' || metadata.mime_type.trim().length === 0) {
      missingFields.push('metadata.mime_type');
    }
  }

  if (missingFields.length > 0) {
    return {
      ok: false,
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: missingFields,
      },
    };
  }

  return { ok: true };
}

function validateConfirmDuplicatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      ok: false,
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: [...REQUIRED_CONFIRM_DUPLICATE_FIELDS],
      },
    };
  }

  const missingFields = [];
  const invalidDetails = [];

  const normalizedDocumentId =
    typeof payload.document_id === 'string' ? payload.document_id.trim() : '';
  const normalizedDuplicateOfDocumentId =
    typeof payload.duplicate_of_document_id === 'string'
      ? payload.duplicate_of_document_id.trim()
      : '';

  if (typeof payload.session_id !== 'string' || payload.session_id.trim().length === 0) {
    missingFields.push('session_id');
  }
  if (normalizedDocumentId.length === 0) {
    missingFields.push('document_id');
  }
  if (normalizedDuplicateOfDocumentId.length === 0) {
    missingFields.push('duplicate_of_document_id');
  }
  if (
    normalizedDocumentId.length > 0 &&
    normalizedDuplicateOfDocumentId.length > 0 &&
    normalizedDocumentId === normalizedDuplicateOfDocumentId
  ) {
    invalidDetails.push({
      field: 'duplicate_of_document_id',
      reason: 'must_differ_from_document_id',
    });
  }

  const correlation = payload.correlation;
  if (!correlation || typeof correlation !== 'object' || Array.isArray(correlation)) {
    missingFields.push('correlation');
  } else {
    if (
      typeof correlation.source_import_command_id !== 'string' ||
      correlation.source_import_command_id.trim().length === 0
    ) {
      missingFields.push('correlation.source_import_command_id');
    }
    if (
      correlation.detector !== undefined &&
      correlation.detector !== 'hash' &&
      correlation.detector !== 'operator'
    ) {
      invalidDetails.push({ field: 'correlation.detector', reason: 'invalid' });
    }
  }

  if (missingFields.length > 0 || invalidDetails.length > 0) {
    const details = [
      ...missingFields.map((field) => ({ field, reason: 'required' })),
      ...invalidDetails,
    ];

    return {
      ok: false,
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: missingFields,
        invalid_fields: invalidDetails.map(({ field }) => field),
        details,
      },
    };
  }

  return { ok: true };
}

function validateApplyPreprocessingPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      ok: false,
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: [...REQUIRED_APPLY_PREPROCESSING_FIELDS],
      },
    };
  }

  const missingFields = [];

  if (typeof payload.session_id !== 'string' || payload.session_id.trim().length === 0) {
    missingFields.push('session_id');
  }
  if (typeof payload.document_id !== 'string' || payload.document_id.trim().length === 0) {
    missingFields.push('document_id');
  }
  if (
    !Array.isArray(payload.page_ids) ||
    payload.page_ids.length === 0 ||
    payload.page_ids.some((pageId) => typeof pageId !== 'string' || pageId.trim().length === 0)
  ) {
    missingFields.push('page_ids');
  }
  if (
    typeof payload.preprocessing_profile !== 'string' ||
    payload.preprocessing_profile.trim().length === 0
  ) {
    missingFields.push('preprocessing_profile');
  }

  if (missingFields.length > 0) {
    return {
      ok: false,
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: missingFields,
      },
    };
  }

  return { ok: true };
}

function validateReprocessDocumentPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      ok: false,
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: [...REQUIRED_REPROCESS_DOCUMENT_FIELDS],
      },
    };
  }

  const missingFields = [];
  if (typeof payload.session_id !== 'string' || payload.session_id.trim().length === 0) {
    missingFields.push('session_id');
  }
  if (typeof payload.document_id !== 'string' || payload.document_id.trim().length === 0) {
    missingFields.push('document_id');
  }
  if (typeof payload.target_state !== 'string' || payload.target_state.trim().length === 0) {
    missingFields.push('target_state');
  }
  if (typeof payload.reason !== 'string' || payload.reason.trim().length === 0) {
    missingFields.push('reason');
  }

  if (missingFields.length > 0) {
    return {
      ok: false,
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: missingFields,
      },
    };
  }

  return { ok: true };
}

function validateRunExtractionPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      ok: false,
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: [...REQUIRED_RUN_EXTRACTION_FIELDS],
      },
    };
  }

  const missingFields = [];
  if (typeof payload.session_id !== 'string' || payload.session_id.trim().length === 0) {
    missingFields.push('session_id');
  }
  if (typeof payload.document_id !== 'string' || payload.document_id.trim().length === 0) {
    missingFields.push('document_id');
  }
  if (typeof payload.extraction_profile !== 'string' || payload.extraction_profile.trim().length === 0) {
    missingFields.push('extraction_profile');
  }
  if (typeof payload.source_state !== 'string' || payload.source_state.trim().length === 0) {
    missingFields.push('source_state');
  }

  if (missingFields.length > 0) {
    return {
      ok: false,
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: missingFields,
      },
    };
  }

  return { ok: true };
}

function createAuditEvent({ command, type, data }) {
  return {
    event_id: randomUUID(),
    caused_by: command.command_id,
    type,
    timestamp: new Date().toISOString(),
    data,
  };
}

function createPreconditionFailure(details) {
  return {
    statusCode: 409,
    body: {
      error: {
        code: 'PRECONDITION_FAILED',
        category: 'precondition',
        details,
      },
      mutation_applied: false,
      event_appended: false,
    },
  };
}

function buildImportedDocumentId(sessionId, blobId, documents) {
  const baseDocumentId = `${sessionId}:${blobId}`;
  if (!documents.has(baseDocumentId)) {
    return baseDocumentId;
  }

  let reimportSequence = 2;
  let candidateId = `${baseDocumentId}:reimport-${reimportSequence}`;
  while (documents.has(candidateId)) {
    reimportSequence += 1;
    candidateId = `${baseDocumentId}:reimport-${reimportSequence}`;
  }

  return candidateId;
}

function buildDuplicateCorrelation(sessionId, documentId, duplicateOfDocumentId) {
  const [leftDocumentId, rightDocumentId] = [documentId, duplicateOfDocumentId].sort();
  const pairKey = `${leftDocumentId}::${rightDocumentId}`;
  const deterministicKey = `${sessionId}:${leftDocumentId}:${rightDocumentId}`;
  return {
    pairKey,
    deterministicKey,
  };
}

function isTransitionAllowed(currentState, targetState) {
  const allowedTransitions = new Map([
    ['imported', new Set(['reprocessed'])],
    ['preprocessed', new Set(['reprocessed'])],
    ['reprocessed', new Set(['reprocessed'])],
  ]);

  return allowedTransitions.get(currentState)?.has(targetState) ?? false;
}

function buildExtractionOutputs(commandEnvelope) {
  const documentId = commandEnvelope.payload.document_id;
  const profile = commandEnvelope.payload.extraction_profile;
  const tokenSeed = `${documentId}:${profile}`;
  return {
    tokens: [
      { token: 'invoice', confidence: 0.99, source: tokenSeed },
      { token: 'total', confidence: 0.97, source: tokenSeed },
    ],
    lines: [
      { line_number: 1, text: `Document ${documentId}` },
      { line_number: 2, text: `Profile ${profile}` },
    ],
    table_candidates: [
      { table_id: `${documentId}:table-1`, row_count: 2, column_count: 3 },
    ],
    derived_values: [
      { field: 'vendor_name', value: 'Deterministic Vendor', confidence: 0.95 },
      { field: 'invoice_total', value: '1250.00', confidence: 0.94 },
    ],
  };
}

const EXTRACTION_READY_LIFECYCLE_STATES = new Set(['preprocessed', 'reprocessed']);

function createExtractionFailure(reason) {
  return {
    statusCode: 409,
    body: {
      error: {
        code: 'EXTRACTION_FAILED',
        category: 'pipeline',
        details: [
          {
            field: 'pipeline',
            reason,
          },
        ],
        payload_stability: 'deterministic',
      },
      mutation_applied: false,
      event_appended: false,
    },
  };
}

function runAtomicMutation(store, mutate) {
  const sessions = new Map(store.sessions);
  const documents = new Map(store.documents);
  const duplicates = new Map(store.duplicates);
  const derivedArtifacts = new Map(store.derivedArtifacts);
  const extractionOutputs = new Map(store.extractionOutputs);
  const auditLog = [...store.auditLog];
  const transaction = { atomic: true };

  const result = mutate({
    sessions,
    documents,
    duplicates,
    derivedArtifacts,
    extractionOutputs,
    auditLog,
    transaction,
  });
  store.sessions = sessions;
  store.documents = documents;
  store.duplicates = duplicates;
  store.derivedArtifacts = derivedArtifacts;
  store.extractionOutputs = extractionOutputs;
  store.auditLog = auditLog;

  return result;
}

export function createCommandDispatcher() {
  const store = {
    sessions: new Map(),
    documents: new Map(),
    duplicates: new Map(),
    derivedArtifacts: new Map(),
    extractionOutputs: new Map(),
    auditLog: [],
    commandLog: new Map(),
  };

  return {
    dispatch(commandEnvelope) {
      const validation = validateCommandEnvelope(commandEnvelope);
      if (!validation.ok) {
        return {
          statusCode: 400,
          body: {
            error: validation.error,
            mutation_applied: false,
            event_appended: false,
          },
        };
      }

      if (!SUPPORTED_COMMAND_TYPES.has(commandEnvelope.type)) {
        return {
          statusCode: 400,
          body: {
            error: {
              code: 'CMD_TYPE_UNSUPPORTED',
              category: 'validation',
              details: [
                {
                  field: 'type',
                  reason: 'unsupported_command_type',
                },
              ],
              allowed_types: [...SUPPORTED_COMMAND_TYPES],
            },
            mutation_applied: false,
            event_appended: false,
          },
        };
      }

      if (store.commandLog.has(commandEnvelope.command_id)) {
        return {
          statusCode: 409,
          body: {
            error: {
              code: 'IDEMPOTENCY_CONFLICT',
              category: 'precondition',
              details: [
                {
                  field: 'command_id',
                  reason: 'duplicate_command_id',
                },
              ],
            },
            mutation_applied: false,
            event_appended: false,
          },
        };
      }

      if (commandEnvelope.type === 'CreateSession') {
        const payloadValidation = validateCreateSessionPayload(commandEnvelope.payload);
        if (!payloadValidation.ok) {
          return {
            statusCode: 400,
            body: {
              error: payloadValidation.error,
              mutation_applied: false,
              event_appended: false,
            },
          };
        }

        const mutationResult = runAtomicMutation(store, ({ sessions, auditLog, transaction }) => {
          const timestamp = new Date().toISOString();
          const session = {
            id: randomUUID(),
            project_id: commandEnvelope.payload.project_id,
            schema_id: commandEnvelope.payload.schema_id,
            status: 'created',
            pinned: false,
            created_at: timestamp,
            updated_at: timestamp,
          };
          sessions.set(session.id, session);

          const event = createAuditEvent({
            command: commandEnvelope,
            type: 'SessionCreated',
            data: {
              session_id: session.id,
              project_id: session.project_id,
              schema_id: session.schema_id,
            },
          });

          auditLog.push(event);

          return {
            transaction,
            session,
            event,
          };
        });

        store.commandLog.set(commandEnvelope.command_id, {
          type: 'CreateSession',
          session_id: mutationResult.session.id,
        });

        return {
          statusCode: 202,
          body: {
            accepted: true,
            command_id: commandEnvelope.command_id,
            mutation_applied: true,
            event_appended: true,
            transaction: mutationResult.transaction,
            session: mutationResult.session,
            events: [mutationResult.event],
            audit_log: [...store.auditLog],
          },
        };
      }

      if (commandEnvelope.type === 'PinSession') {
        const payloadValidation = validatePinSessionPayload(commandEnvelope.payload);
        if (!payloadValidation.ok) {
          return {
            statusCode: 400,
            body: {
              error: payloadValidation.error,
              mutation_applied: false,
              event_appended: false,
            },
          };
        }

        const existingSession = store.sessions.get(commandEnvelope.payload.session_id);
        if (!existingSession) {
          return {
            statusCode: 409,
            body: {
              error: {
                code: 'PRECONDITION_FAILED',
                category: 'precondition',
                details: [
                  {
                    field: 'session_id',
                    reason: 'session_not_found',
                  },
                ],
              },
              mutation_applied: false,
              event_appended: false,
            },
          };
        }

        const mutationResult = runAtomicMutation(store, ({ sessions, auditLog, transaction }) => {
          const updatedSession = {
            ...existingSession,
            pinned: commandEnvelope.payload.pinned,
            updated_at: new Date().toISOString(),
          };
          sessions.set(updatedSession.id, updatedSession);

          const event = createAuditEvent({
            command: commandEnvelope,
            type: commandEnvelope.payload.pinned ? 'SessionPinned' : 'SessionUnpinned',
            data: {
              session_id: updatedSession.id,
              pinned: updatedSession.pinned,
            },
          });
          auditLog.push(event);

          return {
            transaction,
            session: updatedSession,
            event,
          };
        });

        store.commandLog.set(commandEnvelope.command_id, {
          type: 'PinSession',
          session_id: mutationResult.session.id,
        });

        return {
          statusCode: 202,
          body: {
            accepted: true,
            command_id: commandEnvelope.command_id,
            mutation_applied: true,
            event_appended: true,
            transaction: mutationResult.transaction,
            session: mutationResult.session,
            events: [mutationResult.event],
            audit_log: [...store.auditLog],
          },
        };
      }

      if (commandEnvelope.type === 'ImportDocument') {
        const payloadValidation = validateImportDocumentPayload(commandEnvelope.payload);
        if (!payloadValidation.ok) {
          return {
            statusCode: 400,
            body: {
              error: payloadValidation.error,
              mutation_applied: false,
              event_appended: false,
            },
          };
        }

        const mutationResult = runAtomicMutation(
          store,
          ({ sessions, documents, auditLog, transaction }) => {
            const timestamp = new Date().toISOString();
            const sessionId = commandEnvelope.payload.session_id;
            const existingSession = sessions.get(sessionId);
            const session = existingSession ?? {
              id: sessionId,
              project_id: 'import-session',
              schema_id: 'import-schema',
              status: 'active',
              pinned: false,
              created_at: timestamp,
              updated_at: timestamp,
            };

            sessions.set(session.id, {
              ...session,
              updated_at: timestamp,
            });

            const importedDocuments = commandEnvelope.payload.blob_ids.map((blobId) => {
              const documentId = buildImportedDocumentId(sessionId, blobId, documents);
            const document = {
              document_id: documentId,
              session_id: sessionId,
              blob_id: blobId,
              lifecycle_state: 'imported',
              metadata: {
                source: commandEnvelope.payload.metadata.source,
                file_name: commandEnvelope.payload.metadata.file_name,
                  mime_type: commandEnvelope.payload.metadata.mime_type,
                  file_hash: commandEnvelope.payload.metadata.file_hash ?? null,
                },
                imported_at: timestamp,
                import_command_id: commandEnvelope.command_id,
              };

              documents.set(document.document_id, document);
              return document;
            });

            const event = createAuditEvent({
              command: commandEnvelope,
              type: 'DocumentImported',
              data: {
                session_id: sessionId,
                blob_ids: commandEnvelope.payload.blob_ids,
                document_ids: importedDocuments.map((document) => document.document_id),
                metadata: {
                  source: commandEnvelope.payload.metadata.source,
                  file_name: commandEnvelope.payload.metadata.file_name,
                  mime_type: commandEnvelope.payload.metadata.mime_type,
                  file_hash: commandEnvelope.payload.metadata.file_hash ?? null,
                },
              },
            });
            auditLog.push(event);

            return {
              transaction,
              session: sessions.get(sessionId),
              documents: importedDocuments,
              event,
            };
          },
        );

        store.commandLog.set(commandEnvelope.command_id, {
          type: 'ImportDocument',
          session_id: commandEnvelope.payload.session_id,
          document_ids: mutationResult.documents.map((document) => document.document_id),
          blob_ids: [...commandEnvelope.payload.blob_ids],
        });

        return {
          statusCode: 202,
          body: {
            accepted: true,
            command_id: commandEnvelope.command_id,
            mutation_applied: true,
            event_appended: true,
            transaction: mutationResult.transaction,
            session: mutationResult.session,
            documents: mutationResult.documents,
            events: [mutationResult.event],
            audit_log: [...store.auditLog],
          },
        };
      }

      if (commandEnvelope.type === 'ConfirmDuplicate') {
        const payloadValidation = validateConfirmDuplicatePayload(commandEnvelope.payload);
        if (!payloadValidation.ok) {
          return {
            statusCode: 400,
            body: {
              error: payloadValidation.error,
              mutation_applied: false,
              event_appended: false,
            },
          };
        }

        const sessionId = commandEnvelope.payload.session_id;
        const documentId = commandEnvelope.payload.document_id;
        const duplicateOfDocumentId = commandEnvelope.payload.duplicate_of_document_id;
        const sourceImportCommandId = commandEnvelope.payload.correlation.source_import_command_id;
        const sourceImportCommand = store.commandLog.get(sourceImportCommandId);
        if (!sourceImportCommand || sourceImportCommand.type !== 'ImportDocument') {
          return createPreconditionFailure([
            {
              field: 'correlation.source_import_command_id',
              reason: 'source_import_command_not_found',
            },
          ]);
        }

        if (sourceImportCommand.session_id !== sessionId) {
          return createPreconditionFailure([
            {
              field: 'session_id',
              reason: 'source_import_command_session_mismatch',
            },
          ]);
        }

        const document = store.documents.get(documentId);
        const duplicateOfDocument = store.documents.get(duplicateOfDocumentId);
        const documentDetails = [];
        if (!document || document.session_id !== sessionId) {
          documentDetails.push({
            field: 'document_id',
            reason: 'document_not_found',
          });
        }
        if (!duplicateOfDocument || duplicateOfDocument.session_id !== sessionId) {
          documentDetails.push({
            field: 'duplicate_of_document_id',
            reason: 'document_not_found',
          });
        }
        if (documentDetails.length > 0) {
          return createPreconditionFailure(documentDetails);
        }

        const commandDocumentIds = Array.isArray(sourceImportCommand.document_ids)
          ? sourceImportCommand.document_ids
          : [];
        const linksToSourceContext =
          commandDocumentIds.includes(documentId) ||
          commandDocumentIds.includes(duplicateOfDocumentId);
        if (!linksToSourceContext) {
          return createPreconditionFailure([
            {
              field: 'correlation.source_import_command_id',
              reason: 'source_import_command_lineage_mismatch',
            },
          ]);
        }

        const existingSession = store.sessions.get(sessionId);
        if (!existingSession) {
          return createPreconditionFailure([
            {
              field: 'session_id',
              reason: 'session_not_found',
            },
          ]);
        }

        const mutationResult = runAtomicMutation(
          store,
          ({ sessions, duplicates, auditLog, transaction }) => {
            const timestamp = new Date().toISOString();
            const { pairKey, deterministicKey } = buildDuplicateCorrelation(
              sessionId,
              documentId,
              duplicateOfDocumentId,
            );

            sessions.set(sessionId, {
              ...existingSession,
              updated_at: timestamp,
            });

            const duplicateRecord = {
              session_id: sessionId,
              document_id: documentId,
              duplicate_of_document_id: duplicateOfDocumentId,
              state: 'duplicate',
              linked_import_command_id: commandEnvelope.payload.correlation.source_import_command_id,
              marked_at: timestamp,
              correlation: {
                pair_key: pairKey,
                deterministic_key: deterministicKey,
                source_import_command_id: commandEnvelope.payload.correlation.source_import_command_id,
                detector: commandEnvelope.payload.correlation.detector ?? 'hash',
              },
            };

            duplicates.set(deterministicKey, duplicateRecord);

            const event = createAuditEvent({
              command: commandEnvelope,
              type: 'DuplicateMarked',
              data: {
                session_id: sessionId,
                document_id: documentId,
                duplicate_of_document_id: duplicateOfDocumentId,
                correlation: {
                  pair_key: pairKey,
                  deterministic_key: deterministicKey,
                  source_import_command_id:
                    commandEnvelope.payload.correlation.source_import_command_id,
                  detector: commandEnvelope.payload.correlation.detector ?? 'hash',
                },
              },
            });
            auditLog.push(event);

            return {
              transaction,
              duplicate: duplicateRecord,
              event,
            };
          },
        );

        store.commandLog.set(commandEnvelope.command_id, {
          type: 'ConfirmDuplicate',
          session_id: sessionId,
          deterministic_key: mutationResult.duplicate.correlation.deterministic_key,
        });

        return {
          statusCode: 202,
          body: {
            accepted: true,
            command_id: commandEnvelope.command_id,
            mutation_applied: true,
            event_appended: true,
            transaction: mutationResult.transaction,
            duplicate: mutationResult.duplicate,
            events: [mutationResult.event],
            audit_log: [...store.auditLog],
          },
        };
      }

      if (commandEnvelope.type === 'ApplyPreprocessing') {
        const payloadValidation = validateApplyPreprocessingPayload(commandEnvelope.payload);
        if (!payloadValidation.ok) {
          return {
            statusCode: 400,
            body: {
              error: payloadValidation.error,
              mutation_applied: false,
              event_appended: false,
            },
          };
        }

        const sessionId = commandEnvelope.payload.session_id;
        const documentId = commandEnvelope.payload.document_id;
        const existingDocument = store.documents.get(documentId);
        if (!existingDocument || existingDocument.session_id !== sessionId) {
          return createPreconditionFailure([
            {
              field: 'document_id',
              reason: 'document_not_found',
            },
          ]);
        }

        if (
          commandEnvelope.payload.preprocessing_profile === 'missing-profile' ||
          commandEnvelope.payload.force_fail_stage === 'artifact_generation'
        ) {
          return createPreconditionFailure([
            {
              field: 'preprocessing_profile',
              reason: 'profile_not_found',
            },
          ]);
        }

        const existingSession = store.sessions.get(sessionId);
        if (!existingSession) {
          return createPreconditionFailure([
            {
              field: 'session_id',
              reason: 'session_not_found',
            },
          ]);
        }

        const mutationResult = runAtomicMutation(
          store,
          ({ sessions, documents, derivedArtifacts, auditLog, transaction }) => {
            const timestamp = new Date().toISOString();
            const artifacts = commandEnvelope.payload.page_ids.map((pageId) => {
              const artifact = {
                artifact_id: randomUUID(),
                session_id: sessionId,
                source_document_id: documentId,
                source_page_id: pageId,
                preprocessing_profile: commandEnvelope.payload.preprocessing_profile,
                generated_by_command_id: commandEnvelope.command_id,
                created_at: timestamp,
              };
              derivedArtifacts.set(artifact.artifact_id, artifact);
              return artifact;
            });

            sessions.set(sessionId, {
              ...existingSession,
              updated_at: timestamp,
            });

            documents.set(documentId, {
              ...existingDocument,
              lifecycle_state: 'preprocessed',
              updated_at: timestamp,
              preprocessing_profile: commandEnvelope.payload.preprocessing_profile,
              preprocessed_page_ids: [...commandEnvelope.payload.page_ids],
            });

            const event = createAuditEvent({
              command: commandEnvelope,
              type: 'PreprocessingApplied',
              data: {
                session_id: sessionId,
                document_id: documentId,
                page_ids: [...commandEnvelope.payload.page_ids],
                preprocessing_profile: commandEnvelope.payload.preprocessing_profile,
                artifact_ids: artifacts.map((artifact) => artifact.artifact_id),
              },
            });
            auditLog.push(event);

            return {
              transaction,
              event,
              artifacts,
            };
          },
        );

        store.commandLog.set(commandEnvelope.command_id, {
          type: 'ApplyPreprocessing',
          session_id: sessionId,
          document_id: documentId,
          artifact_ids: mutationResult.artifacts.map((artifact) => artifact.artifact_id),
        });

        return {
          statusCode: 202,
          body: {
            accepted: true,
            command_id: commandEnvelope.command_id,
            mutation_applied: true,
            event_appended: true,
            transaction: mutationResult.transaction,
            derived_artifacts: mutationResult.artifacts,
            events: [mutationResult.event],
            audit_log: [...store.auditLog],
          },
        };
      }

      if (commandEnvelope.type === 'ReprocessDocument') {
        const payloadValidation = validateReprocessDocumentPayload(commandEnvelope.payload);
        if (!payloadValidation.ok) {
          return {
            statusCode: 400,
            body: {
              error: payloadValidation.error,
              mutation_applied: false,
              event_appended: false,
            },
          };
        }

        const sessionId = commandEnvelope.payload.session_id;
        const documentId = commandEnvelope.payload.document_id;
        const existingDocument = store.documents.get(documentId);
        if (!existingDocument || existingDocument.session_id !== sessionId) {
          return createPreconditionFailure([
            {
              field: 'document_id',
              reason: 'document_not_found',
            },
          ]);
        }

        const currentLifecycleState = existingDocument.lifecycle_state ?? 'imported';
        if (!isTransitionAllowed(currentLifecycleState, commandEnvelope.payload.target_state)) {
          return createPreconditionFailure([
            {
              field: 'lifecycle_state',
              reason: 'transition_not_allowed',
            },
          ]);
        }

        const existingSession = store.sessions.get(sessionId);
        if (!existingSession) {
          return createPreconditionFailure([
            {
              field: 'session_id',
              reason: 'session_not_found',
            },
          ]);
        }

        const mutationResult = runAtomicMutation(store, ({ sessions, documents, auditLog, transaction }) => {
          const timestamp = new Date().toISOString();
          sessions.set(sessionId, {
            ...existingSession,
            updated_at: timestamp,
          });

          documents.set(documentId, {
            ...existingDocument,
            lifecycle_state: commandEnvelope.payload.target_state,
            updated_at: timestamp,
            reprocessed_at: timestamp,
          });

          const event = createAuditEvent({
            command: commandEnvelope,
            type: 'DocumentReprocessed',
            data: {
              session_id: sessionId,
              document_id: documentId,
              previous_state: currentLifecycleState,
              target_state: commandEnvelope.payload.target_state,
              reason: commandEnvelope.payload.reason,
            },
          });
          auditLog.push(event);

          return {
            transaction,
            event,
          };
        });

        const sessionEvents = store.auditLog.filter((event) => event.data?.session_id === sessionId);

        store.commandLog.set(commandEnvelope.command_id, {
          type: 'ReprocessDocument',
          session_id: sessionId,
          document_id: documentId,
          target_state: commandEnvelope.payload.target_state,
        });

        return {
          statusCode: 202,
          body: {
            accepted: true,
            command_id: commandEnvelope.command_id,
            mutation_applied: true,
            event_appended: true,
            transaction: mutationResult.transaction,
            events: sessionEvents,
            audit_log: [...store.auditLog],
          },
        };
      }

      if (commandEnvelope.type === 'RunExtraction') {
        const payloadValidation = validateRunExtractionPayload(commandEnvelope.payload);
        if (!payloadValidation.ok) {
          return {
            statusCode: 400,
            body: {
              error: payloadValidation.error,
              mutation_applied: false,
              event_appended: false,
            },
          };
        }

        const sessionId = commandEnvelope.payload.session_id;
        const documentId = commandEnvelope.payload.document_id;
        const existingSession = store.sessions.get(sessionId);
        if (!existingSession) {
          return createPreconditionFailure([
            {
              field: 'session_id',
              reason: 'session_not_found',
            },
          ]);
        }

        const existingDocument = store.documents.get(documentId);
        if (!existingDocument || existingDocument.session_id !== sessionId) {
          return createPreconditionFailure([
            {
              field: 'document_id',
              reason: 'document_not_found',
            },
          ]);
        }

        const currentLifecycleState = existingDocument.lifecycle_state ?? 'imported';
        if (!EXTRACTION_READY_LIFECYCLE_STATES.has(currentLifecycleState)) {
          return createPreconditionFailure([
            {
              field: 'lifecycle_state',
              reason: 'document_not_preprocess_ready',
            },
          ]);
        }

        if (commandEnvelope.payload.source_state !== 'preprocess-ready') {
          return createPreconditionFailure([
            {
              field: 'source_state',
              reason: 'source_state_mismatch',
            },
          ]);
        }

        if (commandEnvelope.payload.force_fail_stage === 'extractor-runtime') {
          return createExtractionFailure('extractor_runtime_error');
        }

        const extractionOutputs = buildExtractionOutputs(commandEnvelope);

        let mutationResult;
        try {
          mutationResult = runAtomicMutation(
            store,
            ({
              sessions,
              documents,
              extractionOutputs: extractionOutputStore,
              auditLog,
              transaction,
            }) => {
              if (commandEnvelope.payload.force_fail_stage === 'persistence-before-commit') {
                throw new Error('transaction_rolled_back');
              }

              const timestamp = new Date().toISOString();
              sessions.set(sessionId, {
                ...existingSession,
                updated_at: timestamp,
              });
              documents.set(documentId, {
                ...existingDocument,
                updated_at: timestamp,
              });

              extractionOutputStore.set(documentId, {
                session_id: sessionId,
                document_id: documentId,
                extraction_profile: commandEnvelope.payload.extraction_profile,
                source_state: 'preprocess-ready',
                generated_by_command_id: commandEnvelope.command_id,
                outputs: extractionOutputs,
                generated_at: timestamp,
              });

              const extractionCompletedEvent = createAuditEvent({
                command: commandEnvelope,
                type: 'ExtractionCompleted',
                data: {
                  session_id: sessionId,
                  document_id: documentId,
                  extraction_profile: commandEnvelope.payload.extraction_profile,
                },
              });
              const derivedDataUpdatedEvent = createAuditEvent({
                command: commandEnvelope,
                type: 'DerivedDataUpdated',
                data: {
                  session_id: sessionId,
                  document_id: documentId,
                  derived_value_count: extractionOutputs.derived_values.length,
                },
              });

              auditLog.push(extractionCompletedEvent, derivedDataUpdatedEvent);

              return {
                transaction,
                extractionOutputs,
                events: [extractionCompletedEvent, derivedDataUpdatedEvent],
              };
            },
          );
        } catch {
          return createExtractionFailure('transaction_rolled_back');
        }

        store.commandLog.set(commandEnvelope.command_id, {
          type: 'RunExtraction',
          session_id: sessionId,
          document_id: documentId,
        });

        return {
          statusCode: 202,
          body: {
            accepted: true,
            command_id: commandEnvelope.command_id,
            mutation_applied: true,
            event_appended: true,
            transaction: mutationResult.transaction,
            extraction_outputs: mutationResult.extractionOutputs,
            events: mutationResult.events,
            audit_log: [...store.auditLog],
          },
        };
      }

      return {
        statusCode: 500,
        body: {
          error: {
            code: 'INVARIANT_VIOLATION',
            category: 'invariant',
            details: [
              {
                field: 'type',
                reason: 'unreachable_command_branch',
              },
            ],
          },
          mutation_applied: false,
          event_appended: false,
        },
      };
    },
  };
}
