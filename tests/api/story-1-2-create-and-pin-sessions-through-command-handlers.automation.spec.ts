import { test, expect } from '../support/fixtures';
import {
  createCreateSessionCommandEnvelope,
  createPinSessionCommandEnvelope,
} from '../support/fixtures/factories/session-command-factory';

test.describe('Story 1.2 API automation coverage', () => {
  test('[P0][AC1] should accept CreateSession envelopes through the dispatcher contract', async ({
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
    });
  });

  test('[P0][AC2] should accept PinSession pin envelopes and mark mutation/event append as applied', async ({
    apiRequest,
  }) => {
    const command = createPinSessionCommandEnvelope({
      payload: { pinned: true },
    });

    const { status, body } = await apiRequest<{
      accepted: boolean;
      command_id: string;
      mutation_applied: boolean;
      event_appended: boolean;
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
    });
  });

  test('[P1][AC2] should accept PinSession unpin envelopes and preserve dispatcher success contract', async ({
    apiRequest,
  }) => {
    const command = createPinSessionCommandEnvelope({
      payload: { pinned: false },
    });

    const { status, body } = await apiRequest<{
      accepted: boolean;
      command_id: string;
      mutation_applied: boolean;
      event_appended: boolean;
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
    });
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
