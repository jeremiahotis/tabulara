import { test, expect } from '@playwright/test';
import {
  createImportDocumentCommandEnvelope,
  createConfirmDuplicateCommandEnvelope,
} from '../support/fixtures/factories/document-import-command-factory';

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
      const command = createConfirmDuplicateCommandEnvelope();

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
      const command = createConfirmDuplicateCommandEnvelope();

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
                pair_key: command.payload.correlation.pair_key,
                source_import_command_id: command.payload.correlation.source_import_command_id,
                deterministic_key: `${command.payload.session_id}:${command.payload.document_id}:${command.payload.duplicate_of_document_id}`,
              }),
            }),
          }),
        ]),
      );
    },
  );
});
