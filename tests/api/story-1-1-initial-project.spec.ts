import { test, expect } from '@playwright/test';
import { createCommandEnvelope } from '../support/fixtures/factories/command-envelope-factory';

test.describe('Story 1.1 API acceptance tests (ATDD RED)', () => {
  test.skip('[P0][AC1] should expose /api/v1 health status for desktop + local backend readiness', async ({ request }) => {
    // Given a freshly scaffolded local app runtime
    // When the versioned health endpoint is queried
    const response = await request.get('/api/v1/health');

    // Then the API surface and health contract are available
    expect(response.status()).toBe(200);
    await expect(response).toBeOK();

    const body = await response.json();
    expect(body).toMatchObject({
      status: 'ok',
      services: {
        frontend: 'up',
        backend: 'up',
      },
      apiVersion: 'v1',
    });
  });

  test.skip('[P0][AC1] should accept a valid command envelope on /api/v1 command dispatcher', async ({ request }) => {
    // Given a valid command payload
    const envelope = createCommandEnvelope();

    // When command is dispatched
    const response = await request.post('/api/v1/commands/dispatch', {
      data: envelope,
    });

    // Then mutation endpoint under /api/v1 is available and accepts envelope
    expect(response.status()).toBe(202);
    const body = await response.json();
    expect(body).toMatchObject({
      accepted: true,
      command_id: envelope.command_id,
    });
  });

  test.skip('[P0][AC2] should reject missing envelope fields with deterministic machine-readable codes and no mutation', async ({ request }) => {
    // Given an invalid command payload missing required fields
    const invalidEnvelope = {
      type: 'session.initialize',
      payload: { document_path: '/tmp/demo.pdf' },
    };

    // When command is dispatched
    const response = await request.post('/api/v1/commands/dispatch', {
      data: invalidEnvelope,
    });

    // Then the command is rejected and no state mutation/event append occurs
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({
      error: {
        code: 'CMD_ENVELOPE_VALIDATION_FAILED',
        category: 'validation',
        missing_fields: ['command_id', 'actor', 'timestamp'],
      },
      mutation_applied: false,
      event_appended: false,
    });
  });

  test.skip('[P1][AC2] should return deterministic per-field validation details for each required envelope field', async ({ request }) => {
    // Given command envelopes with one missing required field each
    const requiredFields = ['command_id', 'type', 'actor', 'timestamp', 'payload'] as const;

    for (const field of requiredFields) {
      const envelope = createCommandEnvelope();
      const invalid = { ...envelope } as Record<string, unknown>;
      delete invalid[field];

      // When dispatcher validates the envelope
      const response = await request.post('/api/v1/commands/dispatch', {
        data: invalid,
      });

      // Then deterministic error codes and details are returned for that field
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('CMD_ENVELOPE_VALIDATION_FAILED');
      expect(body.error.missing_fields).toContain(field);
      expect(body.error.details[0]).toMatchObject({
        field,
        reason: 'required',
      });
      expect(body.mutation_applied).toBe(false);
      expect(body.event_appended).toBe(false);
    }
  });
});
