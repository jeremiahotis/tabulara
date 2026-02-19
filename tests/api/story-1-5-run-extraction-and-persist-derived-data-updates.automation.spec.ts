import { test, expect } from '../support/fixtures';
import { createRunExtractionCommandEnvelope } from '../support/fixtures/factories/extraction-command-factory';
import { story15ExpectedErrorCodes, story15RedPhaseData } from '../support/fixtures/story-1-5-red-phase-data';

test.describe('Story 1.5 API automation coverage', () => {
  test('[P0][AC1] should reject RunExtraction as unsupported and keep mutation/event side effects disabled', async ({
    apiRequest,
  }) => {
    const command = createRunExtractionCommandEnvelope({
      payload: {
        session_id: 'session-story-1-5-api-run',
        document_id: 'session-story-1-5-api-run:doc-001',
      },
    });

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
        code: story15ExpectedErrorCodes.unsupportedType,
        category: 'validation',
      },
      mutation_applied: false,
      event_appended: false,
    });
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'type',
          reason: story15ExpectedErrorCodes.unsupportedReason,
        }),
      ]),
    );
    expect(body.error.allowed_types).toEqual(
      expect.arrayContaining([
        'CreateSession',
        'PinSession',
        'ImportDocument',
        'ConfirmDuplicate',
        'ApplyPreprocessing',
        'ReprocessDocument',
      ]),
    );
  });

  test('[P0][AC2] should return deterministic unsupported-command payloads for repeated RunExtraction dispatches', async ({
    apiRequest,
  }) => {
    const command = createRunExtractionCommandEnvelope({
      payload: {
        session_id: 'session-story-1-5-api-repeat',
        document_id: 'session-story-1-5-api-repeat:doc-001',
      },
    });

    const first = await apiRequest<{
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

    expect(first.status).toBe(400);
    expect(second.status).toBe(400);
    expect(first.body.error.code).toBe(story15ExpectedErrorCodes.unsupportedType);
    expect(second.body.error.code).toBe(story15ExpectedErrorCodes.unsupportedType);
    expect(first.body.error.details[0]).toMatchObject({
      field: 'type',
      reason: story15ExpectedErrorCodes.unsupportedReason,
    });
    expect(second.body.error.details[0]).toMatchObject({
      field: 'type',
      reason: story15ExpectedErrorCodes.unsupportedReason,
    });
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
