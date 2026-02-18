import { test, expect } from '../support/fixtures';
import { createCommandEnvelope } from '../support/fixtures/factories/command-envelope-factory';

test.describe('Story 1.1 API automation coverage', () => {
  test('[P0][AC1] should expose /api/v1/health for startup readiness checks', async ({ apiRequest }) => {
    const { status, body } = await apiRequest<{
      status: string;
      services: { frontend: string; backend: string };
      apiVersion: string;
    }>({
      method: 'GET',
      path: '/api/v1/health',
    });

    expect(status).toBe(200);
    expect(body).toMatchObject({
      status: 'ok',
      services: {
        frontend: 'up',
        backend: 'up',
      },
      apiVersion: 'v1',
    });
  });

  test('[P0][AC1] should accept a valid command envelope on /api/v1/commands/dispatch', async ({
    apiRequest,
  }) => {
    const envelope = createCommandEnvelope();

    const { status, body } = await apiRequest<{
      accepted: boolean;
      command_id: string;
      mutation_applied: boolean;
      event_appended: boolean;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: envelope,
    });

    expect(status).toBe(202);
    expect(body).toMatchObject({
      accepted: true,
      command_id: envelope.command_id,
      mutation_applied: true,
      event_appended: true,
    });
  });

  test('[P0][AC2] should reject envelopes with missing required fields and no mutation side effects', async ({
    apiRequest,
  }) => {
    const invalidEnvelope = {
      type: 'session.initialize',
      payload: { document_path: '/tmp/demo.pdf' },
    };

    const { status, body } = await apiRequest<{
      error: { code: string; category: string; missing_fields: string[] };
      mutation_applied: boolean;
      event_appended: boolean;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: invalidEnvelope,
    });

    expect(status).toBe(400);
    expect(body).toMatchObject({
      error: {
        code: 'CMD_ENVELOPE_VALIDATION_FAILED',
        category: 'validation',
      },
      mutation_applied: false,
      event_appended: false,
    });
    expect(body.error.missing_fields).toEqual(
      expect.arrayContaining(['command_id', 'actor', 'timestamp']),
    );
  });

  test('[P1][AC2] should return deterministic field-level validation details for each required field', async ({
    apiRequest,
  }) => {
    const requiredFields = ['command_id', 'type', 'actor', 'timestamp', 'payload'] as const;

    for (const field of requiredFields) {
      const envelope = createCommandEnvelope();
      const invalid = { ...envelope } as Record<string, unknown>;
      delete invalid[field];

      const { status, body } = await apiRequest<{
        error: {
          code: string;
          missing_fields: string[];
          details: Array<{ field: string; reason: string }>;
        };
        mutation_applied: boolean;
        event_appended: boolean;
      }>({
        method: 'POST',
        path: '/api/v1/commands/dispatch',
        body: invalid,
      });

      expect(status).toBe(400);
      expect(body.error.code).toBe('CMD_ENVELOPE_VALIDATION_FAILED');
      expect(body.error.missing_fields).toContain(field);
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field,
            reason: 'required',
          }),
        ]),
      );
      expect(body.mutation_applied).toBe(false);
      expect(body.event_appended).toBe(false);
    }
  });
});
