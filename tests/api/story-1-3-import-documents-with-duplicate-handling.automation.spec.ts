import { test, expect } from '../support/fixtures';
import {
  createImportDocumentCommandEnvelope,
  createConfirmDuplicateCommandEnvelope,
} from '../support/fixtures/factories/document-import-command-factory';

test.describe('Story 1.3 API automation coverage', () => {
  test('[P0][AC1] should accept ImportDocument and append DocumentImported with deterministic caused_by linkage', async ({
    apiRequest,
  }) => {
    const command = createImportDocumentCommandEnvelope({
      payload: {
        session_id: 'session-import-p0',
        blob_ids: ['blob-import-001', 'blob-import-002'],
        metadata: {
          source: 'import',
          file_name: 'invoice-001.pdf',
          mime_type: 'application/pdf',
          file_hash: 'a'.repeat(64),
        },
      },
    });

    const { status, body } = await apiRequest<{
      accepted: boolean;
      command_id: string;
      mutation_applied: boolean;
      event_appended: boolean;
      session: {
        id: string;
      };
      documents: Array<{
        blob_id: string;
        metadata: {
          source: string;
          file_name: string;
          mime_type: string;
        };
      }>;
      events: Array<{
        type: string;
        caused_by: string;
      }>;
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
      session: {
        id: command.payload.session_id,
      },
    });
    expect(body.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blob_id: 'blob-import-001',
          metadata: expect.objectContaining({
            source: 'import',
            file_name: 'invoice-001.pdf',
            mime_type: 'application/pdf',
          }),
        }),
      ]),
    );
    expect(body.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'DocumentImported',
          caused_by: command.command_id,
        }),
      ]),
    );
  });

  test('[P0][AC2] should accept ConfirmDuplicate and append DuplicateMarked with deterministic correlation fields', async ({
    apiRequest,
  }) => {
    const importCommand = createImportDocumentCommandEnvelope({
      payload: {
        session_id: 'session-duplicate-p0',
        blob_ids: ['blob-original-001', 'blob-duplicate-001'],
        metadata: {
          source: 'import',
          file_name: 'invoice-dup-seed.pdf',
          mime_type: 'application/pdf',
          file_hash: 'c'.repeat(64),
        },
      },
    });
    const importResult = await apiRequest<{
      accepted: boolean;
      command_id: string;
      documents: Array<{
        document_id: string;
      }>;
    }>({
      method: 'POST',
      path: '/api/v1/commands/dispatch',
      body: importCommand,
    });
    expect(importResult.status).toBe(202);
    const importedDocumentIds = (importResult.body.documents ?? [])
      .map((document) => document.document_id)
      .filter((documentId) => documentId.length > 0);
    expect(importedDocumentIds.length).toBeGreaterThanOrEqual(2);
    const [documentId, duplicateOfDocumentId] = importedDocumentIds;

    const command = createConfirmDuplicateCommandEnvelope({
      payload: {
        session_id: 'session-duplicate-p0',
        document_id: documentId,
        duplicate_of_document_id: duplicateOfDocumentId,
      },
    });
    command.payload.correlation.source_import_command_id = importCommand.command_id;
    const [leftDocumentId, rightDocumentId] = [documentId, duplicateOfDocumentId].sort();

    const { status, body } = await apiRequest<{
      accepted: boolean;
      command_id: string;
      mutation_applied: boolean;
      event_appended: boolean;
      duplicate: {
        document_id: string;
        duplicate_of_document_id: string;
        linked_import_command_id: string;
        correlation: {
          pair_key: string;
          deterministic_key: string;
          source_import_command_id: string;
        };
      };
      events: Array<{
        type: string;
        caused_by: string;
      }>;
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
      duplicate: {
        document_id: command.payload.document_id,
        duplicate_of_document_id: command.payload.duplicate_of_document_id,
        linked_import_command_id: command.payload.correlation.source_import_command_id,
      },
    });
    expect(body.duplicate.correlation).toMatchObject({
      pair_key: `${leftDocumentId}::${rightDocumentId}`,
      source_import_command_id: command.payload.correlation.source_import_command_id,
      deterministic_key: `${command.payload.session_id}:${leftDocumentId}:${rightDocumentId}`,
    });
    expect(body.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'DuplicateMarked',
          caused_by: command.command_id,
        }),
      ]),
    );
  });

  test('[P1][AC1] should generate deterministic ImportDocument envelope defaults with stable metadata shape', async () => {
    const command = createImportDocumentCommandEnvelope({
      payload: {
        session_id: 'session-import-p1',
        blob_ids: ['blob-a', 'blob-b'],
      },
    });

    expect(command.type).toBe('ImportDocument');
    expect(command.command_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(command.payload).toMatchObject({
      session_id: 'session-import-p1',
      blob_ids: ['blob-a', 'blob-b'],
      metadata: {
        source: 'import',
        file_name: expect.any(String),
        mime_type: expect.any(String),
      },
    });
    expect(command.payload.metadata.file_hash).toMatch(/^[0-9a-f]{64}$/i);
  });

  test('[P1][AC2] should generate deterministic duplicate correlation fields from session/document identifiers', async () => {
    const command = createConfirmDuplicateCommandEnvelope({
      payload: {
        session_id: 'session-dup-p1',
        document_id: 'doc-z',
        duplicate_of_document_id: 'doc-a',
      },
    });

    expect(command.type).toBe('ConfirmDuplicate');
    expect(command.payload.correlation).toMatchObject({
      deterministic_key: 'session-dup-p1:doc-a:doc-z',
      pair_key: 'doc-a::doc-z',
      detector: 'hash',
    });
    expect(command.payload.correlation.source_import_command_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
