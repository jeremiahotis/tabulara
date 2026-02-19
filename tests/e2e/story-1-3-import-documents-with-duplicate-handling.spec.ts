import { test, expect } from '@playwright/test';

test.describe('Story 1.3 document import + duplicate handling workflow (ATDD RED)', () => {
  test(
    '[P0][AC1] should import document command payload and surface DocumentImported traceability',
    async ({ page }) => {
      const importResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 202,
      );

      await page.goto('/');
      await page.getByTestId('command-type-input').fill('ImportDocument');
      await page.getByTestId('import-session-id-input').fill('session-import-001');
      await page.getByTestId('import-blob-ids-input').fill('blob-import-001,blob-import-002');
      await page.getByTestId('import-metadata-source-input').fill('import');
      await page.getByTestId('import-file-name-input').fill('invoice-001.pdf');
      await page.getByTestId('command-submit-button').click();

      await importResponse;

      await expect(page.getByTestId('mutation-state')).toHaveText('applied');
      await expect(page.getByTestId('event-append-state')).toHaveText('appended');
      await expect(page.getByTestId('document-last-imported-blob-id')).toHaveText(/blob-import-001/);
      await expect(page.getByTestId('audit-event-type-latest')).toHaveText('DocumentImported');
      await expect(page.getByTestId('audit-event-caused-by-latest')).toHaveText(/.+/);
    },
  );

  test(
    '[P0][AC2] should confirm duplicate candidate and persist duplicate linkage state',
    async ({ page }) => {
      const importResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 202,
      );

      await page.goto('/');
      await page.getByTestId('command-type-input').fill('ImportDocument');
      await page.getByTestId('import-session-id-input').fill('session-import-002');
      await page.getByTestId('import-blob-ids-input').fill('blob-dup-source');
      await page.getByTestId('import-metadata-source-input').fill('import');
      await page.getByTestId('import-file-name-input').fill('invoice-dup-source.pdf');
      await page.getByTestId('command-submit-button').click();
      await importResponse;

      const duplicateResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 202,
      );

      await page.getByTestId('command-type-input').fill('ConfirmDuplicate');
      await page.getByTestId('duplicate-session-id-input').fill('session-import-002');
      await page.getByTestId('duplicate-document-id-input').fill('doc-duplicate-001');
      await page.getByTestId('duplicate-of-document-id-input').fill('doc-original-001');
      await page.getByTestId('duplicate-source-command-id-input').fill('cmd-import-001');
      await page.getByTestId('command-submit-button').click();

      await duplicateResponse;

      await expect(page.getByTestId('duplicate-state-latest')).toHaveText('duplicate');
      await expect(page.getByTestId('duplicate-of-document-id-latest')).toHaveText('doc-original-001');
      await expect(page.getByTestId('audit-event-type-latest')).toHaveText('DuplicateMarked');
    },
  );

  test(
    '[P1][AC2] should surface deterministic duplicate correlation evidence for operators',
    async ({ page }) => {
      const duplicateResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 202,
      );

      await page.goto('/');
      await page.getByTestId('command-type-input').fill('ConfirmDuplicate');
      await page.getByTestId('duplicate-session-id-input').fill('session-import-003');
      await page.getByTestId('duplicate-document-id-input').fill('doc-duplicate-003');
      await page.getByTestId('duplicate-of-document-id-input').fill('doc-original-003');
      await page.getByTestId('duplicate-source-command-id-input').fill('cmd-import-003');
      await page.getByTestId('command-submit-button').click();

      await duplicateResponse;

      await expect(page.getByTestId('duplicate-correlation-key-latest')).toHaveText(
        /session-import-003:doc-duplicate-003:doc-original-003/,
      );
      await expect(page.getByTestId('duplicate-linked-import-command-latest')).toHaveText('cmd-import-003');
      await expect(page.getByTestId('audit-event-caused-by-latest')).toHaveText(/.+/);
    },
  );
});
