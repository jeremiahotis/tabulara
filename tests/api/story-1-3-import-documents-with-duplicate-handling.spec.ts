import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  createImportDocumentCommandEnvelope,
  createConfirmDuplicateCommandEnvelope,
} from '../support/fixtures/factories/document-import-command-factory';

async function seedDuplicateImportContext(request: APIRequestContext) {
  const sessionId = `session-import-${crypto.randomUUID()}`;
  const importCommand = createImportDocumentCommandEnvelope({
    payload: {
      session_id: sessionId,
      blob_ids: ['blob-original-001', 'blob-duplicate-001'],
      metadata: {
        source: 'import',
        file_name: 'invoice-seed.pdf',
        mime_type: 'application/pdf',
        file_hash: 'b'.repeat(64),
      },
    },
  });

  const importResponse = await request.post('/api/v1/commands/dispatch', {
    data: importCommand,
  });
  expect(importResponse.status()).toBe(202);
  const importBody = (await importResponse.json()) as {
    documents?: Array<{
      document_id?: string;
    }>;
  };

  const importedDocumentIds = (importBody.documents ?? [])
    .map((document) => document.document_id ?? '')
    .filter((documentId) => documentId.length > 0);
  expect(importedDocumentIds.length).toBeGreaterThanOrEqual(2);

  return {
    sessionId,
    sourceImportCommandId: importCommand.command_id,
    documentId: importedDocumentIds[0],
    duplicateOfDocumentId: importedDocumentIds[1],
  };
}

test.describe('Story 1.3 import + duplicate command handlers (ATDD RED)', () => {
  test(
    '[P0][AC1] should persist import metadata and blob references through ImportDocument command handlers',
    async ({ request }) => {
      const command = createImportDocumentCommandEnvelope();

      const response = await request.post('/api/v1/commands/dispatch', {
        data: command,
      });

      expect(response.status()).toBe(202);
      const body = await response.json();
      expect(body).toMatchObject({
        accepted: true,
        command_id: command.command_id,
        mutation_applied: true,
        event_appended: true,
        session: expect.objectContaining({
          id: command.payload.session_id,
        }),
        documents: expect.arrayContaining([
          expect.objectContaining({
            blob_id: command.payload.blob_ids[0],
            metadata: expect.objectContaining({
              source: command.payload.metadata.source,
              file_name: command.payload.metadata.file_name,
              mime_type: command.payload.metadata.mime_type,
            }),
          }),
        ]),
      });
    },
  );

  test(
    '[P0][AC1] should append DocumentImported with deterministic caused_by linkage',
    async ({ request }) => {
      const command = createImportDocumentCommandEnvelope();

      const response = await request.post('/api/v1/commands/dispatch', {
        data: command,
      });

      expect(response.status()).toBe(202);
      const body = await response.json();
      expect(body.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'DocumentImported',
            caused_by: command.command_id,
            data: expect.objectContaining({
              session_id: command.payload.session_id,
              blob_ids: command.payload.blob_ids,
              metadata: expect.objectContaining({
                source: command.payload.metadata.source,
              }),
            }),
          }),
        ]),
      );
    },
  );

  test(
    '[P0][AC2] should persist duplicate linkage to original import context through ConfirmDuplicate command handlers',
    async ({ request }) => {
      const context = await seedDuplicateImportContext(request);
      const command = createConfirmDuplicateCommandEnvelope({
        payload: {
          session_id: context.sessionId,
          document_id: context.documentId,
          duplicate_of_document_id: context.duplicateOfDocumentId,
        },
      });
      command.payload.correlation.source_import_command_id = context.sourceImportCommandId;

      const response = await request.post('/api/v1/commands/dispatch', {
        data: command,
      });

      expect(response.status()).toBe(202);
      const body = await response.json();
      expect(body).toMatchObject({
        accepted: true,
        command_id: command.command_id,
        mutation_applied: true,
        event_appended: true,
        duplicate: expect.objectContaining({
          document_id: command.payload.document_id,
          duplicate_of_document_id: command.payload.duplicate_of_document_id,
          linked_import_command_id: command.payload.correlation.source_import_command_id,
        }),
      });
    },
  );

  test(
    '[P1][AC2] should append DuplicateMarked with deterministic correlation fields',
    async ({ request }) => {
      const context = await seedDuplicateImportContext(request);
      const command = createConfirmDuplicateCommandEnvelope({
        payload: {
          session_id: context.sessionId,
          document_id: context.duplicateOfDocumentId,
          duplicate_of_document_id: context.documentId,
        },
      });
      command.payload.correlation.source_import_command_id = context.sourceImportCommandId;
      const [leftDocumentId, rightDocumentId] = [
        command.payload.document_id,
        command.payload.duplicate_of_document_id,
      ].sort();
      const expectedPairKey = `${leftDocumentId}::${rightDocumentId}`;
      const expectedDeterministicKey = `${command.payload.session_id}:${leftDocumentId}:${rightDocumentId}`;

      const response = await request.post('/api/v1/commands/dispatch', {
        data: command,
      });

      expect(response.status()).toBe(202);
      const body = await response.json();
      expect(body.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'DuplicateMarked',
            caused_by: command.command_id,
            data: expect.objectContaining({
              session_id: command.payload.session_id,
              document_id: command.payload.document_id,
              duplicate_of_document_id: command.payload.duplicate_of_document_id,
              correlation: expect.objectContaining({
                pair_key: expectedPairKey,
                source_import_command_id: command.payload.correlation.source_import_command_id,
                deterministic_key: expectedDeterministicKey,
              }),
            }),
          }),
        ]),
      );
    },
  );

  test(
    '[P1][AC2] should reject ConfirmDuplicate when source_import_command_id does not reference an import command',
    async ({ request }) => {
      const context = await seedDuplicateImportContext(request);
      const command = createConfirmDuplicateCommandEnvelope({
        payload: {
          session_id: context.sessionId,
          document_id: context.documentId,
          duplicate_of_document_id: context.duplicateOfDocumentId,
        },
      });
      command.payload.correlation.source_import_command_id = crypto.randomUUID();

      const response = await request.post('/api/v1/commands/dispatch', {
        data: command,
      });

      expect(response.status()).toBe(409);
      const body = await response.json();
      expect(body).toMatchObject({
        error: {
          code: 'PRECONDITION_FAILED',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'correlation.source_import_command_id',
              reason: 'source_import_command_not_found',
            }),
          ]),
        },
        mutation_applied: false,
        event_appended: false,
      });
    },
  );

  test('[P1][AC2] should reject self-duplicate payloads', async ({ request }) => {
    const context = await seedDuplicateImportContext(request);
    const command = createConfirmDuplicateCommandEnvelope({
      payload: {
        session_id: context.sessionId,
        document_id: context.documentId,
        duplicate_of_document_id: context.documentId,
      },
    });
    command.payload.correlation.source_import_command_id = context.sourceImportCommandId;

    const response = await request.post('/api/v1/commands/dispatch', {
      data: command,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({
      error: {
        code: 'CMD_PAYLOAD_VALIDATION_FAILED',
        invalid_fields: expect.arrayContaining(['duplicate_of_document_id']),
      },
      mutation_applied: false,
      event_appended: false,
    });
  });

  test(
    '[P1][AC2] should reject ConfirmDuplicate when referenced documents are missing',
    async ({ request }) => {
      const context = await seedDuplicateImportContext(request);
      const command = createConfirmDuplicateCommandEnvelope({
        payload: {
          session_id: context.sessionId,
          document_id: context.documentId,
          duplicate_of_document_id: `missing-${crypto.randomUUID()}`,
        },
      });
      command.payload.correlation.source_import_command_id = context.sourceImportCommandId;

      const response = await request.post('/api/v1/commands/dispatch', {
        data: command,
      });

      expect(response.status()).toBe(409);
      const body = await response.json();
      expect(body).toMatchObject({
        error: {
          code: 'PRECONDITION_FAILED',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'duplicate_of_document_id',
              reason: 'document_not_found',
            }),
          ]),
        },
        mutation_applied: false,
        event_appended: false,
      });
    },
  );
});
