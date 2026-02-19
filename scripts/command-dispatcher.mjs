import { randomUUID } from 'node:crypto';

const REQUIRED_ENVELOPE_FIELDS = ['command_id', 'type', 'actor', 'timestamp', 'payload'];
const REQUIRED_CREATE_SESSION_FIELDS = ['project_id', 'schema_id'];
const REQUIRED_PIN_SESSION_FIELDS = ['session_id', 'pinned'];
const SUPPORTED_COMMAND_TYPES = new Set(['CreateSession', 'PinSession']);
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
  const auditLog = [...store.auditLog];
  const transaction = { atomic: true };

  const result = mutate({ sessions, auditLog, transaction });
  store.sessions = sessions;
  store.auditLog = auditLog;

  return result;
}

export function createCommandDispatcher() {
  const store = {
    sessions: new Map(),
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
