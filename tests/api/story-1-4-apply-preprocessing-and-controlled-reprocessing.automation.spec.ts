import { test, expect } from '../support/fixtures';
import {
  createApplyPreprocessingCommandEnvelope,
  createReprocessDocumentCommandEnvelope,
} from '../support/fixtures/factories/preprocessing-command-factory';
import { createImportDocumentCommandEnvelope } from '../support/fixtures/factories/document-import-command-factory';
import {
  story14ExpectedErrorCodes,
  story14RedPhaseData,
} from '../support/fixtures/story-1-4-red-phase-data';

test.describe('Story 1.4 API automation coverage', () => {
  test('[P0][AC1] should reject ApplyPreprocessing for unknown documents without mutation side effects', async ({
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

    expect(status).toBe(409);
    expect(body).toMatchObject({
      error: {
        code: story14ExpectedErrorCodes.preconditionFailed,
        category: 'precondition',
      },
      mutation_applied: false,
      event_appended: false,
    });
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'document_id',
          reason: story14ExpectedErrorCodes.documentNotFound,
        }),
      ]),
    );
  });

  test('[P0][AC2] should reject ReprocessDocument for disallowed target states with deterministic transition errors', async ({
    apiRequest,
  }) => {
    const importCommand = createImportDocumentCommandEnvelope({
      payload: {
        session_id: 'session-story-1-4-api-reprocess',
        blob_ids: ['blob-story-1-4-api-reprocess'],
        metadata: {
          source: 'import',
          file_name: 'story-1-4-api-reprocess.pdf',
          mime_type: 'application/pdf',
          file_hash: '1'.repeat(64),
        },
      },
    });

    const importResult = await apiRequest({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: importCommand,
    });
    expect(importResult.status).toBe(202);

    const importedDocumentId = importResult.body.documents?.[0]?.document_id;
    expect(importedDocumentId).toBeDefined();

    const command = createReprocessDocumentCommandEnvelope({
      payload: {
        session_id: 'session-story-1-4-api-reprocess',
        document_id: importedDocumentId,
        target_state: story14RedPhaseData.reprocessDocument.disallowedTargetState,
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

    expect(status).toBe(409);
    expect(body).toMatchObject({
      error: {
        code: story14ExpectedErrorCodes.preconditionFailed,
        category: 'precondition',
      },
      mutation_applied: false,
      event_appended: false,
    });
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'lifecycle_state',
          reason: story14ExpectedErrorCodes.transitionNotAllowed,
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
