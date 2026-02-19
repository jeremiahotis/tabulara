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
const SUPPORTED_COMMAND_TYPES = new Set([
  'CreateSession',
  'PinSession',
  'ImportDocument',
  'ConfirmDuplicate',
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
  if (typeof payload.session_id !== 'string' || payload.session_id.trim().length === 0) {
    missingFields.push('session_id');
  }
  if (typeof payload.document_id !== 'string' || payload.document_id.trim().length === 0) {
    missingFields.push('document_id');
  }
  if (
    typeof payload.duplicate_of_document_id !== 'string' ||
    payload.duplicate_of_document_id.trim().length === 0
  ) {
    missingFields.push('duplicate_of_document_id');
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
      missingFields.push('correlation.detector');
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

function createAuditEvent({ command, type, data }) {
  return {
    event_id: randomUUID(),
    caused_by: command.command_id,
    type,
    timestamp: new Date().toISOString(),
    data,
  };
}

function runAtomicMutation(store, mutate) {
  const sessions = new Map(store.sessions);
  const documents = new Map(store.documents);
  const duplicates = new Map(store.duplicates);
  const auditLog = [...store.auditLog];
  const transaction = { atomic: true };

  const result = mutate({ sessions, documents, duplicates, auditLog, transaction });
  store.sessions = sessions;
  store.documents = documents;
  store.duplicates = duplicates;
  store.auditLog = auditLog;

  return result;
}

export function createCommandDispatcher() {
  const store = {
    sessions: new Map(),
    documents: new Map(),
    duplicates: new Map(),
    auditLog: [],
    commandLog: new Set(),
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

        store.commandLog.add(commandEnvelope.command_id);

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

        store.commandLog.add(commandEnvelope.command_id);

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
              const document = {
                document_id: `${sessionId}:${blobId}`,
                session_id: sessionId,
                blob_id: blobId,
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

        store.commandLog.add(commandEnvelope.command_id);

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

        const mutationResult = runAtomicMutation(
          store,
          ({ sessions, duplicates, auditLog, transaction }) => {
            const timestamp = new Date().toISOString();
            const sessionId = commandEnvelope.payload.session_id;
            const documentId = commandEnvelope.payload.document_id;
            const duplicateOfDocumentId = commandEnvelope.payload.duplicate_of_document_id;
            const deterministicKey = `${sessionId}:${documentId}:${duplicateOfDocumentId}`;
            const pairKey =
              typeof commandEnvelope.payload.correlation.pair_key === 'string' &&
              commandEnvelope.payload.correlation.pair_key.trim().length > 0
                ? commandEnvelope.payload.correlation.pair_key
                : [documentId, duplicateOfDocumentId].sort().join('::');

            const existingSession = sessions.get(sessionId);
            if (!existingSession) {
              sessions.set(sessionId, {
                id: sessionId,
                project_id: 'import-session',
                schema_id: 'import-schema',
                status: 'active',
                pinned: false,
                created_at: timestamp,
                updated_at: timestamp,
              });
            } else {
              sessions.set(sessionId, {
                ...existingSession,
                updated_at: timestamp,
              });
            }

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

        store.commandLog.add(commandEnvelope.command_id);

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
