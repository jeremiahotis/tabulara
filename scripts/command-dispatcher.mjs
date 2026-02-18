const REQUIRED_ENVELOPE_FIELDS = ['command_id', 'type', 'actor', 'timestamp', 'payload'];

function validateCommandEnvelope(body) {
  const missingFields = REQUIRED_ENVELOPE_FIELDS.filter((field) => body[field] === undefined);

  if (missingFields.length === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    error: {
      code: 'CMD_ENVELOPE_VALIDATION_FAILED',
      category: 'validation',
      missing_fields: missingFields,
      details: missingFields.map((field) => ({ field, reason: 'required' })),
    },
  };
}

export function createCommandDispatcher() {
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

      return {
        statusCode: 202,
        body: {
          accepted: true,
          command_id: commandEnvelope.command_id,
          mutation_applied: true,
          event_appended: true,
        },
      };
    },
  };
}
