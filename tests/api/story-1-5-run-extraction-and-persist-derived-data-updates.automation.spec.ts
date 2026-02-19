import { test, expect } from '../support/fixtures';
import { createImportDocumentCommandEnvelope } from '../support/fixtures/factories/document-import-command-factory';
import { createRunExtractionCommandEnvelope } from '../support/fixtures/factories/extraction-command-factory';
import { createApplyPreprocessingCommandEnvelope } from '../support/fixtures/factories/preprocessing-command-factory';
import { story15ExpectedErrorCodes, story15RedPhaseData } from '../support/fixtures/story-1-5-red-phase-data';

test.describe('Story 1.5 API automation coverage', () => {
  async function provisionPreprocessReadyDocument(
    apiRequest: <TResponseBody>(request: {
      method: 'POST';
      path: string;
      body: unknown;
    }) => Promise<{ status: number; body: TResponseBody }>,
    sessionId: string,
    blobId: string,
  ) {
    const importCommand = createImportDocumentCommandEnvelope({
      payload: {
        session_id: sessionId,
        blob_ids: [blobId],
      },
    });
    const importResult = await apiRequest<{
      accepted: boolean;
      documents: Array<{ document_id: string }>;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: importCommand,
    });
    expect(importResult.status).toBe(202);
    expect(importResult.body.accepted).toBe(true);

    const documentId = importResult.body.documents[0]?.document_id;
    expect(typeof documentId).toBe('string');
    expect(documentId.length).toBeGreaterThan(0);

    const preprocessingCommand = createApplyPreprocessingCommandEnvelope({
      payload: {
        session_id: sessionId,
        document_id: documentId,
        page_ids: ['page-1', 'page-2'],
        preprocessing_profile: 'ocr-enhance',
      },
    });
    const preprocessingResult = await apiRequest<{ accepted: boolean }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: preprocessingCommand,
    });
    expect(preprocessingResult.status).toBe(202);
    expect(preprocessingResult.body.accepted).toBe(true);

    return documentId;
  }

  test('[P0][AC1] should accept RunExtraction, persist extraction outputs, and append extraction events', async ({
    apiRequest,
  }) => {
    const sessionId = 'session-story-1-5-api-run';
    const documentId = await provisionPreprocessReadyDocument(apiRequest, sessionId, 'blob-story-1-5-api-run');

    const command = createRunExtractionCommandEnvelope({
      payload: {
        session_id: sessionId,
        document_id: documentId,
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
    const sessionId = 'session-story-1-5-api-repeat';
    const documentId = await provisionPreprocessReadyDocument(
      apiRequest,
      sessionId,
      'blob-story-1-5-api-repeat',
    );

    const command = createRunExtractionCommandEnvelope({
      payload: {
        session_id: sessionId,
        document_id: documentId,
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

  test('[P0][AC2] should roll back persistence-before-commit failures with deterministic payloads and no committed command side effects', async ({
    apiRequest,
  }) => {
    const sessionId = 'session-story-1-5-api-rollback';
    const documentId = await provisionPreprocessReadyDocument(
      apiRequest,
      sessionId,
      'blob-story-1-5-api-rollback',
    );
    const commandId = '11111111-1111-4111-8111-111111111111';

    const rollbackCommand = createRunExtractionCommandEnvelope({
      commandId,
      payload: {
        session_id: sessionId,
        document_id: documentId,
        force_fail_stage: 'persistence-before-commit',
      },
    });
    const failed = await apiRequest<{
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
      body: rollbackCommand,
    });

    expect(failed.status).toBe(409);
    expect(failed.body.error.code).toBe(story15ExpectedErrorCodes.extractionFailed);
    expect(failed.body.error.payload_stability).toBe('deterministic');
    expect(failed.body.error.details[0]).toMatchObject({
      field: 'pipeline',
      reason: story15ExpectedErrorCodes.extractionRollbackReason,
    });
    expect(failed.body.mutation_applied).toBe(false);
    expect(failed.body.event_appended).toBe(false);

    const successfulRetry = createRunExtractionCommandEnvelope({
      commandId,
      payload: {
        session_id: sessionId,
        document_id: documentId,
      },
    });
    const retried = await apiRequest<{
      accepted: boolean;
      command_id: string;
      events: Array<{ type: string; caused_by: string }>;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: successfulRetry,
    });

    expect(retried.status).toBe(202);
    expect(retried.body.accepted).toBe(true);
    expect(retried.body.command_id).toBe(commandId);
    expect(retried.body.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'ExtractionCompleted', caused_by: commandId }),
        expect.objectContaining({ type: 'DerivedDataUpdated', caused_by: commandId }),
      ]),
    );
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
