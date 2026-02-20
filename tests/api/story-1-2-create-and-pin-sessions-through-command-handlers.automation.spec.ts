import { test, expect } from '../support/fixtures';
import {
  createCreateSessionCommandEnvelope,
  createPinSessionCommandEnvelope,
} from '../support/fixtures/factories/session-command-factory';

test.describe('Story 1.2 API automation coverage', () => {
  test('[P0][AC1] should create a session through command handlers and append SessionCreated with caused_by linkage', async ({
    apiRequest,
  }) => {
    const command = createCreateSessionCommandEnvelope({
      payload: {
        project_id: 'project-123',
        schema_id: 'schema-123',
      },
    });

    const { status, body } = await apiRequest<{
      accepted: boolean;
      command_id: string;
      mutation_applied: boolean;
      event_appended: boolean;
      session: {
        id: string;
        project_id: string;
        schema_id: string;
        status: string;
      };
      audit_log: Array<{
        type: string;
        caused_by: string;
        data: {
          session_id: string;
          project_id: string;
          schema_id: string;
        };
      }>;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: command,
    });

    expect(status).toBe(202);
    expect(body).toMatchObject({
      accepted: true,
      command_id: command.command_id,
      mutation_applied: true,
      event_appended: true,
      session: {
        project_id: command.payload.project_id,
        schema_id: command.payload.schema_id,
        status: 'created',
      },
    });
    expect(body.session.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(body.audit_log).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'SessionCreated',
          caused_by: command.command_id,
          data: expect.objectContaining({
            session_id: body.session.id,
            project_id: command.payload.project_id,
            schema_id: command.payload.schema_id,
          }),
        }),
      ]),
    );
  });

  test('[P0][AC2] should pin a session atomically and append SessionPinned in the same transaction', async ({
    apiRequest,
  }) => {
    const createSessionCommand = createCreateSessionCommandEnvelope();
    const { body: createdSession } = await apiRequest<{
      session: { id: string };
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: createSessionCommand,
    });

    const command = createPinSessionCommandEnvelope({
      payload: { session_id: createdSession.session.id, pinned: true },
    });

    const { status, body } = await apiRequest<{
      accepted: boolean;
      command_id: string;
      mutation_applied: boolean;
      event_appended: boolean;
      transaction: {
        atomic: boolean;
      };
      session: {
        id: string;
        pinned: boolean;
      };
      events: Array<{
        type: string;
        caused_by: string;
      }>;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: command,
    });

    expect(status).toBe(202);
    expect(body).toMatchObject({
      accepted: true,
      command_id: command.command_id,
      mutation_applied: true,
      event_appended: true,
      transaction: {
        atomic: true,
      },
      session: {
        id: command.payload.session_id,
        pinned: true,
      },
    });
    expect(body.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'SessionPinned',
          caused_by: command.command_id,
        }),
      ]),
    );
  });

  test('[P1][AC2] should unpin a session atomically and append SessionUnpinned in the same transaction', async ({
    apiRequest,
  }) => {
    const createSessionCommand = createCreateSessionCommandEnvelope();
    const created = await apiRequest<{
      session: { id: string };
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: createSessionCommand,
    });
    const pinCommand = createPinSessionCommandEnvelope({
      payload: { session_id: created.body.session.id, pinned: true },
    });
    await apiRequest({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: pinCommand,
    });

    const command = createPinSessionCommandEnvelope({
      payload: { session_id: created.body.session.id, pinned: false },
    });

    const { status, body } = await apiRequest<{
      accepted: boolean;
      command_id: string;
      mutation_applied: boolean;
      event_appended: boolean;
      transaction: {
        atomic: boolean;
      };
      session: {
        id: string;
        pinned: boolean;
      };
      events: Array<{
        type: string;
        caused_by: string;
      }>;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: command,
    });

    expect(status).toBe(202);
    expect(body).toMatchObject({
      accepted: true,
      command_id: command.command_id,
      mutation_applied: true,
      event_appended: true,
      transaction: {
        atomic: true,
      },
      session: {
        id: command.payload.session_id,
        pinned: false,
      },
    });
    expect(body.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'SessionUnpinned',
          caused_by: command.command_id,
        }),
      ]),
    );
  });

  test('[P1][AC2] should reject PinSession for unknown sessions without mutation or event append', async ({
    apiRequest,
  }) => {
    const command = createPinSessionCommandEnvelope();

    const { status, body } = await apiRequest<{
      error: {
        code: string;
        category: string;
        details: Array<{ field: string; reason: string }>;
      };
      mutation_applied: boolean;
      event_appended: boolean;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: command,
    });

    expect(status).toBe(409);
    expect(body).toMatchObject({
      error: {
        code: 'PRECONDITION_FAILED',
        category: 'precondition',
      },
      mutation_applied: false,
      event_appended: false,
    });
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'session_id',
          reason: 'session_not_found',
        }),
      ]),
    );
  });

  test('[P1][AC1] should reject unsupported command types without mutation or event append', async ({
    apiRequest,
  }) => {
    const createSessionCommand = createCreateSessionCommandEnvelope();
    const command = {
      ...createSessionCommand,
      type: 'UnknownCommand',
    };

    const { status, body } = await apiRequest<{
      error: {
        code: string;
        category: string;
        details: Array<{ field: string; reason: string }>;
        allowed_types: string[];
      };
      mutation_applied: boolean;
      event_appended: boolean;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: command,
    });

    expect(status).toBe(400);
    expect(body).toMatchObject({
      error: {
        code: 'CMD_TYPE_UNSUPPORTED',
        category: 'validation',
      },
      mutation_applied: false,
      event_appended: false,
    });
    expect(body.error.allowed_types).toEqual(expect.arrayContaining(['CreateSession', 'PinSession']));
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'type',
          reason: 'unsupported_command_type',
        }),
      ]),
    );
  });

  test('[P1][AC1] should reject malformed envelope metadata even when required fields are present', async ({
    apiRequest,
  }) => {
    const malformedEnvelope = {
      command_id: '',
      type: 'CreateSession',
      actor: 'ops-user',
      timestamp: 'not-a-timestamp',
      payload: {
        project_id: 'project-123',
        schema_id: 'schema-123',
      },
    };

    const { status, body } = await apiRequest<{
      error: {
        code: string;
        category: string;
        missing_fields: string[];
        invalid_fields: string[];
        details: Array<{ field: string; reason: string }>;
      };
      mutation_applied: boolean;
      event_appended: boolean;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: malformedEnvelope,
    });

    expect(status).toBe(400);
    expect(body).toMatchObject({
      error: {
        code: 'CMD_ENVELOPE_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: [],
      },
      mutation_applied: false,
      event_appended: false,
    });
    expect(body.error.invalid_fields).toEqual(
      expect.arrayContaining(['command_id', 'actor', 'timestamp']),
    );
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'command_id',
          reason: 'invalid',
        }),
        expect.objectContaining({
          field: 'actor',
          reason: 'invalid',
        }),
        expect.objectContaining({
          field: 'timestamp',
          reason: 'invalid',
        }),
      ]),
    );
  });

  test('[P1][AC1] should reject duplicate command_id values to enforce idempotency conflict handling', async ({
    apiRequest,
  }) => {
    const command = createCreateSessionCommandEnvelope();

    const firstResult = await apiRequest<{
      accepted: boolean;
      command_id: string;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: command,
    });
    const secondResult = await apiRequest<{
      error: {
        code: string;
        category: string;
        details: Array<{ field: string; reason: string }>;
      };
      mutation_applied: boolean;
      event_appended: boolean;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: command,
    });

    expect(firstResult.status).toBe(202);
    expect(firstResult.body).toMatchObject({
      accepted: true,
      command_id: command.command_id,
    });

    expect(secondResult.status).toBe(409);
    expect(secondResult.body).toMatchObject({
      error: {
        code: 'IDEMPOTENCY_CONFLICT',
        category: 'precondition',
      },
      mutation_applied: false,
      event_appended: false,
    });
    expect(secondResult.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'command_id',
          reason: 'duplicate_command_id',
        }),
      ]),
    );
  });

  test('[P1][AC1][AC2] should maintain caused_by linkage for CreateSession and PinSession audit events', async ({
    apiRequest,
  }) => {
    const createCommand = createCreateSessionCommandEnvelope({
      payload: {
        project_id: 'project-caused-by',
        schema_id: 'schema-caused-by',
      },
    });
    const createResponse = await apiRequest<{
      session: { id: string };
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: createCommand,
    });

    const pinCommand = createPinSessionCommandEnvelope({
      payload: {
        session_id: createResponse.body.session.id,
        pinned: true,
      },
    });
    const { status, body } = await apiRequest<{
      audit_log: Array<{
        type: string;
        caused_by: string;
        data: {
          session_id: string;
          pinned?: boolean;
          project_id?: string;
          schema_id?: string;
        };
      }>;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: pinCommand,
    });

    expect(status).toBe(202);
    expect(body.audit_log).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'SessionCreated',
          caused_by: createCommand.command_id,
          data: expect.objectContaining({
            session_id: createResponse.body.session.id,
            project_id: 'project-caused-by',
            schema_id: 'schema-caused-by',
          }),
        }),
        expect.objectContaining({
          type: 'SessionPinned',
          caused_by: pinCommand.command_id,
          data: expect.objectContaining({
            session_id: createResponse.body.session.id,
            pinned: true,
          }),
        }),
      ]),
    );
  });

  test('[P1][AC1] should reject string payloads as envelope validation failures with no side effects', async ({
    request,
  }) => {
    const response = await request.post('/api/v1/commands/dispatch', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: '{',
    });

    expect(response.status()).toBe(400);
    const body = (await response.json()) as {
      error: {
        code: string;
        category: string;
        missing_fields: string[];
      };
      mutation_applied: boolean;
      event_appended: boolean;
    };

    expect(body).toMatchObject({
      error: {
        code: 'CMD_ENVELOPE_VALIDATION_FAILED',
        category: 'validation',
      },
      mutation_applied: false,
      event_appended: false,
    });
    expect(body.error.missing_fields).toEqual(
      expect.arrayContaining(['command_id', 'type', 'actor', 'timestamp', 'payload']),
    );
  });
});
