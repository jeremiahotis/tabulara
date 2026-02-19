import { test, expect } from '../support/fixtures';
import {
  createApplyPreprocessingCommandEnvelope,
  createReprocessDocumentCommandEnvelope,
} from '../support/fixtures/factories/preprocessing-command-factory';
import {
  story14ExpectedErrorCodes,
  story14RedPhaseData,
} from '../support/fixtures/story-1-4-red-phase-data';

test.describe('Story 1.4 API automation coverage', () => {
  test('[P0][AC1] should reject ApplyPreprocessing until command support is implemented without mutation side effects', async ({
    apiRequest,
  }) => {
    const command = createApplyPreprocessingCommandEnvelope({
      payload: {
        session_id: 'session-story-1-4-api-preprocess',
        document_id: 'session-story-1-4-api-preprocess:doc-001',
        page_ids: story14RedPhaseData.applyPreprocessing.samplePageIds,
        preprocessing_profile: story14RedPhaseData.applyPreprocessing.preprocessingProfile,
      },
    });

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

    expect(status).toBe(400);
    expect(body).toMatchObject({
      error: {
        code: 'CMD_TYPE_UNSUPPORTED',
        category: 'validation',
      },
      mutation_applied: false,
      event_appended: false,
    });
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'type',
          reason: 'unsupported_command_type',
        }),
      ]),
    );
  });

  test('[P0][AC2] should reject ReprocessDocument until transition guards are implemented without mutating audit state', async ({
    apiRequest,
  }) => {
    const command = createReprocessDocumentCommandEnvelope({
      payload: {
        session_id: 'session-story-1-4-api-reprocess',
        document_id: 'session-story-1-4-api-reprocess:doc-001',
        target_state: story14RedPhaseData.reprocessDocument.allowedTargetState,
      },
    });

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

    expect(status).toBe(400);
    expect(body).toMatchObject({
      error: {
        code: 'CMD_TYPE_UNSUPPORTED',
        category: 'validation',
      },
      mutation_applied: false,
      event_appended: false,
    });
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'type',
          reason: 'unsupported_command_type',
        }),
      ]),
    );
  });

  test('[P1][AC1] should generate deterministic ApplyPreprocessing envelope defaults for page linkage inputs', async () => {
    const command = createApplyPreprocessingCommandEnvelope({
      payload: {
        session_id: 'session-story-1-4-factory-preprocess',
        document_id: 'session-story-1-4-factory-preprocess:doc-001',
      },
    });

    expect(command.type).toBe(story14RedPhaseData.applyPreprocessing.commandType);
    expect(command.command_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(command.payload).toMatchObject({
      session_id: 'session-story-1-4-factory-preprocess',
      document_id: 'session-story-1-4-factory-preprocess:doc-001',
      preprocessing_profile: 'ocr-enhance',
    });
    expect(command.payload.page_ids).toEqual(['page-1', 'page-2']);
  });

  test('[P1][AC2] should generate deterministic ReprocessDocument envelope defaults for controlled transition intent', async () => {
    const command = createReprocessDocumentCommandEnvelope({
      payload: {
        session_id: 'session-story-1-4-factory-reprocess',
        document_id: 'session-story-1-4-factory-reprocess:doc-002',
      },
    });

    expect(command.type).toBe(story14RedPhaseData.reprocessDocument.commandType);
    expect(command.payload).toMatchObject({
      session_id: 'session-story-1-4-factory-reprocess',
      document_id: 'session-story-1-4-factory-reprocess:doc-002',
      target_state: story14RedPhaseData.reprocessDocument.allowedTargetState,
      reason: 'operator_requested_quality_upgrade',
    });
    expect(story14ExpectedErrorCodes.preconditionFailed).toBe('PRECONDITION_FAILED');
  });
});
