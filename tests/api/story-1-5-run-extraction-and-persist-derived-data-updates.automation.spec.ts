import { test, expect } from '../support/fixtures';
import { createRunExtractionCommandEnvelope } from '../support/fixtures/factories/extraction-command-factory';
import { story15ExpectedErrorCodes, story15RedPhaseData } from '../support/fixtures/story-1-5-red-phase-data';

test.describe('Story 1.5 API automation coverage', () => {
  test('[P0][AC1] should accept RunExtraction, persist extraction outputs, and append extraction events', async ({
    apiRequest,
  }) => {
    const command = createRunExtractionCommandEnvelope({
      payload: {
        session_id: 'session-story-1-5-api-run',
        document_id: 'session-story-1-5-api-run:doc-001',
      },
    });

    const { status, body } = await apiRequest<{
      accepted: boolean;
      command_id: string;
      mutation_applied: boolean;
      event_appended: boolean;
      extraction_outputs: {
        tokens: Array<Record<string, unknown>>;
        lines: Array<Record<string, unknown>>;
        table_candidates: Array<Record<string, unknown>>;
        derived_values: Array<Record<string, unknown>>;
      };
      events: Array<{ type: string; caused_by: string }>;
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
    expect(body.extraction_outputs).toMatchObject({
      tokens: expect.any(Array),
      lines: expect.any(Array),
      table_candidates: expect.any(Array),
      derived_values: expect.any(Array),
    });
    expect(body.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'ExtractionCompleted',
          caused_by: command.command_id,
        }),
        expect.objectContaining({
          type: 'DerivedDataUpdated',
          caused_by: command.command_id,
        }),
      ]),
    );
  });

  test('[P0][AC2] should return deterministic extractor failure payloads with mutation rollback semantics', async ({
    apiRequest,
  }) => {
    const command = createRunExtractionCommandEnvelope({
      payload: {
        session_id: 'session-story-1-5-api-repeat',
        document_id: 'session-story-1-5-api-repeat:doc-001',
        force_fail_stage: 'extractor-runtime',
      },
    });

    const first = await apiRequest<{
      error: {
        code: string;
        payload_stability: string;
        details: Array<{ field: string; reason: string }>;
      };
      mutation_applied: boolean;
      event_appended: boolean;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: command,
    });
    const second = await apiRequest<{
      error: {
        code: string;
        details: Array<{ field: string; reason: string }>;
      };
      mutation_applied: boolean;
      event_appended: boolean;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: command,
    });

    expect(first.status).toBe(409);
    expect(second.status).toBe(409);
    expect(first.body.error.code).toBe(story15ExpectedErrorCodes.extractionFailed);
    expect(second.body.error.code).toBe(story15ExpectedErrorCodes.extractionFailed);
    expect(first.body.error.details[0]).toMatchObject({
      field: 'pipeline',
      reason: story15ExpectedErrorCodes.extractionFailureReason,
    });
    expect(second.body.error.details[0]).toMatchObject({
      field: 'pipeline',
      reason: story15ExpectedErrorCodes.extractionFailureReason,
    });
    expect(first.body.error.payload_stability).toBe('deterministic');
    expect(second.body.error.payload_stability).toBe('deterministic');
    expect(first.body.mutation_applied).toBe(false);
    expect(second.body.mutation_applied).toBe(false);
    expect(first.body.event_appended).toBe(false);
    expect(second.body.event_appended).toBe(false);
  });

  test('[P1][AC1] should generate deterministic RunExtraction envelope defaults with preprocess-ready source metadata', async () => {
    const command = createRunExtractionCommandEnvelope({
      payload: {
        session_id: 'session-story-1-5-factory',
        document_id: 'session-story-1-5-factory:doc-001',
      },
    });

    expect(command.type).toBe(story15RedPhaseData.runExtraction.commandType);
    expect(command.command_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(command.payload).toMatchObject({
      session_id: 'session-story-1-5-factory',
      document_id: 'session-story-1-5-factory:doc-001',
      extraction_profile: story15RedPhaseData.runExtraction.extractionProfile,
      source_state: story15RedPhaseData.runExtraction.sourceState,
    });
  });

  test('[P1][AC2] should allow deterministic force-fail-stage overrides in RunExtraction envelopes for future failure-path expansion', async () => {
    const command = createRunExtractionCommandEnvelope({
      payload: {
        session_id: 'session-story-1-5-force-fail',
        document_id: 'session-story-1-5-force-fail:doc-001',
        force_fail_stage: 'extractor-runtime',
      },
    });

    expect(command.type).toBe('RunExtraction');
    expect(command.payload).toMatchObject({
      session_id: 'session-story-1-5-force-fail',
      document_id: 'session-story-1-5-force-fail:doc-001',
      extraction_profile: 'operations-default',
      source_state: 'preprocess-ready',
      force_fail_stage: 'extractor-runtime',
    });
  });
});
