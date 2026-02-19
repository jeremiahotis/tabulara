import { test, expect, type APIRequestContext } from '@playwright/test';

type CommandDispatchResponse = {
  accepted?: boolean;
  command_id?: string;
  mutation_applied?: boolean;
  event_appended?: boolean;
  events?: Array<{
    type?: string;
    caused_by?: string;
    data?: Record<string, unknown>;
  }>;
  documents?: Array<{
    document_id?: string;
  }>;
  derived_artifacts?: Array<{
    artifact_id?: string;
    source_document_id?: string;
    source_page_id?: string;
  }>;
  error?: {
    code?: string;
    details?: Array<{
      field?: string;
      reason?: string;
    }>;
  };
};

async function dispatchCommand(request: APIRequestContext, command: Record<string, unknown>) {
  return request.post('/api/v1/commands/dispatch', {
    data: command,
  });
}

async function seedImportedDocument(request: APIRequestContext) {
  const sessionId = 'session-preprocess-' + crypto.randomUUID();
  const blobId = 'blob-preprocess-' + crypto.randomUUID();

  const importCommand = {
    command_id: crypto.randomUUID(),
    command_type: 'ImportDocument',
    payload: {
      session_id: sessionId,
      blob_ids: [blobId],
      metadata: {
        source: 'import',
        file_name: 'preprocess-source.pdf',
        mime_type: 'application/pdf',
        file_hash: 'c'.repeat(64),
      },
    },
  };

  const importResponse = await dispatchCommand(request, importCommand);
  expect(importResponse.status()).toBe(202);
  const importBody = (await importResponse.json()) as CommandDispatchResponse;
  const importedDocumentId = importBody.documents?.[0]?.document_id;

  expect(importedDocumentId).toBeDefined();

  return {
    sessionId,
    documentId: importedDocumentId as string,
    sourceImportCommandId: importCommand.command_id,
  };
}

function createApplyPreprocessingCommand(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    command_id: crypto.randomUUID(),
    command_type: 'ApplyPreprocessing',
    payload: {
      session_id: 'session-preprocess-default',
      document_id: 'missing-document-id',
      page_ids: ['page-1'],
      preprocessing_profile: 'ocr-enhance',
      ...overrides,
    },
  };
}

function createReprocessDocumentCommand(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    command_id: crypto.randomUUID(),
    command_type: 'ReprocessDocument',
    payload: {
      session_id: 'session-reprocess-default',
      document_id: 'missing-document-id',
      target_state: 'reprocessed',
      reason: 'operator_requested_quality_upgrade',
      ...overrides,
    },
  };
}

test.describe('Story 1.4 preprocessing and controlled reprocessing command handlers (ATDD RED)', () => {
  test.skip(
    '[P0][AC1] should apply preprocessing, link derived artifacts to source pages, and append PreprocessingApplied in one transaction',
    async ({ request }) => {
      const context = await seedImportedDocument(request);
      const command = createApplyPreprocessingCommand({
        session_id: context.sessionId,
        document_id: context.documentId,
        page_ids: ['page-1', 'page-2'],
        preprocessing_profile: 'ocr-enhance',
      });

      const response = await dispatchCommand(request, command);

      expect(response.status()).toBe(202);
      const body = (await response.json()) as CommandDispatchResponse;
      expect(body).toMatchObject({
        accepted: true,
        command_id: command.command_id,
        mutation_applied: true,
        event_appended: true,
        derived_artifacts: expect.arrayContaining([
          expect.objectContaining({
            artifact_id: expect.any(String),
            source_document_id: context.documentId,
            source_page_id: expect.any(String),
          }),
        ]),
        events: expect.arrayContaining([
          expect.objectContaining({
            type: 'PreprocessingApplied',
            caused_by: command.command_id,
            data: expect.objectContaining({
              session_id: context.sessionId,
              document_id: context.documentId,
            }),
          }),
        ]),
      });
    },
  );

  test.skip(
    '[P0][AC1] should roll back mutation and event append when preprocessing artifact generation fails',
    async ({ request }) => {
      const context = await seedImportedDocument(request);
      const command = createApplyPreprocessingCommand({
        session_id: context.sessionId,
        document_id: context.documentId,
        preprocessing_profile: 'missing-profile',
        force_fail_stage: 'artifact_generation',
      });

      const response = await dispatchCommand(request, command);

      expect(response.status()).toBe(409);
      const body = (await response.json()) as CommandDispatchResponse;
      expect(body).toMatchObject({
        error: {
          code: 'PRECONDITION_FAILED',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'preprocessing_profile',
              reason: 'profile_not_found',
            }),
          ]),
        },
        mutation_applied: false,
        event_appended: false,
      });
    },
  );

  test.skip('[P1][AC1] should reject ApplyPreprocessing when referenced document does not exist', async ({ request }) => {
    const command = createApplyPreprocessingCommand({
      session_id: 'session-missing-' + crypto.randomUUID(),
      document_id: 'missing-document-' + crypto.randomUUID(),
      page_ids: ['page-1'],
    });

    const response = await dispatchCommand(request, command);

    expect(response.status()).toBe(409);
    const body = (await response.json()) as CommandDispatchResponse;
    expect(body).toMatchObject({
      error: {
        code: 'PRECONDITION_FAILED',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'document_id',
            reason: 'document_not_found',
          }),
        ]),
      },
      mutation_applied: false,
      event_appended: false,
    });
  });

  test.skip(
    '[P0][AC2] should allow permitted reprocessing transition and append DocumentReprocessed while preserving existing history',
    async ({ request }) => {
      const context = await seedImportedDocument(request);
      const applyCommand = createApplyPreprocessingCommand({
        session_id: context.sessionId,
        document_id: context.documentId,
        page_ids: ['page-1'],
        preprocessing_profile: 'ocr-enhance',
      });
      const applyResponse = await dispatchCommand(request, applyCommand);
      expect(applyResponse.status()).toBe(202);

      const reprocessCommand = createReprocessDocumentCommand({
        session_id: context.sessionId,
        document_id: context.documentId,
        target_state: 'reprocessed',
      });

      const response = await dispatchCommand(request, reprocessCommand);

      expect(response.status()).toBe(202);
      const body = (await response.json()) as CommandDispatchResponse;
      expect(body).toMatchObject({
        accepted: true,
        command_id: reprocessCommand.command_id,
        mutation_applied: true,
        event_appended: true,
        events: expect.arrayContaining([
          expect.objectContaining({
            type: 'DocumentImported',
          }),
          expect.objectContaining({
            type: 'DocumentReprocessed',
            caused_by: reprocessCommand.command_id,
            data: expect.objectContaining({
              session_id: context.sessionId,
              document_id: context.documentId,
              target_state: 'reprocessed',
            }),
          }),
        ]),
      });
    },
  );

  test.skip('[P0][AC2] should reject disallowed lifecycle transitions with deterministic guard errors', async ({ request }) => {
    const context = await seedImportedDocument(request);
    const command = createReprocessDocumentCommand({
      session_id: context.sessionId,
      document_id: context.documentId,
      target_state: 'archived',
    });

    const response = await dispatchCommand(request, command);

    expect(response.status()).toBe(409);
    const body = (await response.json()) as CommandDispatchResponse;
    expect(body).toMatchObject({
      error: {
        code: 'PRECONDITION_FAILED',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'lifecycle_state',
            reason: 'transition_not_allowed',
          }),
        ]),
      },
      mutation_applied: false,
      event_appended: false,
    });
  });

  test.skip('[P1][AC2] should reject ReprocessDocument when referenced document is unknown', async ({ request }) => {
    const command = createReprocessDocumentCommand({
      session_id: 'session-missing-' + crypto.randomUUID(),
      document_id: 'missing-document-' + crypto.randomUUID(),
      target_state: 'reprocessed',
    });

    const response = await dispatchCommand(request, command);

    expect(response.status()).toBe(409);
    const body = (await response.json()) as CommandDispatchResponse;
    expect(body).toMatchObject({
      error: {
        code: 'PRECONDITION_FAILED',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'document_id',
            reason: 'document_not_found',
          }),
        ]),
      },
      mutation_applied: false,
      event_appended: false,
    });
  });
});
