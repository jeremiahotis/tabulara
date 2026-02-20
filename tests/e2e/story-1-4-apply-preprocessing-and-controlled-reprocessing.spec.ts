import { test, expect, type Page } from '@playwright/test';

async function dispatchImportForSession(page: Page, sessionId: string, blobIds: string) {
  const importResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/commands/dispatch') &&
      response.request().method() === 'POST' &&
      response.status() === 202,
  );

  await page.getByTestId('command-type-input').fill('ImportDocument');
  await page.getByTestId('import-session-id-input').fill(sessionId);
  await page.getByTestId('import-blob-ids-input').fill(blobIds);
  await page.getByTestId('import-metadata-source-input').fill('import');
  await page.getByTestId('import-file-name-input').fill('story-1-4-seed.pdf');
  await page.getByTestId('command-submit-button').click();
  await importResponse;
}

test.describe('Story 1.4 preprocessing and controlled reprocessing workflow (ATDD RED)', () => {
  test(
    '[P0][AC1] should run ApplyPreprocessing and surface derived artifact linkage plus PreprocessingApplied evidence',
    async ({ page }) => {
      await page.goto('/');
      const sessionId = 'session-preprocess-e2e-001';
      await dispatchImportForSession(page, sessionId, 'blob-pre-001');

      const preprocessingResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 202,
      );

      await page.getByTestId('command-type-input').fill('ApplyPreprocessing');
      await page.getByTestId('preprocessing-session-id-input').fill(sessionId);
      await page
        .getByTestId('preprocessing-document-id-input')
        .fill(sessionId + ':blob-pre-001');
      await page.getByTestId('preprocessing-page-ids-input').fill('page-1,page-2');
      await page.getByTestId('preprocessing-profile-input').fill('ocr-enhance');
      await page.getByTestId('command-submit-button').click();

      await preprocessingResponse;

      await expect(page.getByTestId('mutation-state')).toHaveText('applied');
      await expect(page.getByTestId('event-append-state')).toHaveText('appended');
      await expect(page.getByTestId('audit-event-type-latest')).toHaveText('PreprocessingApplied');
      await expect(page.getByTestId('derived-artifact-source-page-latest')).toHaveText('page-1');
      await expect(page.getByTestId('derived-artifact-source-document-latest')).toHaveText(
        sessionId + ':blob-pre-001',
      );
    },
  );

  test('[P1][AC1] should reject ApplyPreprocessing for missing documents with stable operator-visible error details', async ({ page }) => {
    await page.goto('/');

    const failedPreprocessResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/commands/dispatch') &&
        response.request().method() === 'POST' &&
        response.status() === 409,
    );

    await page.getByTestId('command-type-input').fill('ApplyPreprocessing');
    await page.getByTestId('preprocessing-session-id-input').fill('session-missing-001');
    await page
      .getByTestId('preprocessing-document-id-input')
      .fill('session-missing-001:missing-document-001');
    await page.getByTestId('preprocessing-page-ids-input').fill('page-1');
    await page.getByTestId('preprocessing-profile-input').fill('ocr-enhance');
    await page.getByTestId('command-submit-button').click();

    await failedPreprocessResponse;

    await expect(page.getByTestId('mutation-state')).toHaveText('not-applied');
    await expect(page.getByTestId('event-append-state')).toHaveText('not-appended');
    await expect(page.getByTestId('command-error-code')).toHaveText('PRECONDITION_FAILED');
    await expect(page.getByTestId('command-error-detail-latest')).toHaveText('document_not_found');
  });

  test(
    '[P0][AC2] should allow ReprocessDocument on permitted transitions and append DocumentReprocessed while preserving prior audit evidence',
    async ({ page }) => {
      await page.goto('/');
      const sessionId = 'session-reprocess-e2e-001';
      await dispatchImportForSession(page, sessionId, 'blob-reprocess-001');

      const applyResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 202,
      );

      await page.getByTestId('command-type-input').fill('ApplyPreprocessing');
      await page.getByTestId('preprocessing-session-id-input').fill(sessionId);
      await page
        .getByTestId('preprocessing-document-id-input')
        .fill(sessionId + ':blob-reprocess-001');
      await page.getByTestId('preprocessing-page-ids-input').fill('page-1');
      await page.getByTestId('preprocessing-profile-input').fill('ocr-enhance');
      await page.getByTestId('command-submit-button').click();
      await applyResponse;

      const reprocessResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 202,
      );

      await page.getByTestId('command-type-input').fill('ReprocessDocument');
      await page.getByTestId('reprocess-session-id-input').fill(sessionId);
      await page.getByTestId('reprocess-document-id-input').fill(sessionId + ':blob-reprocess-001');
      await page.getByTestId('reprocess-target-state-input').fill('reprocessed');
      await page.getByTestId('reprocess-reason-input').fill('operator_requested_quality_upgrade');
      await page.getByTestId('command-submit-button').click();

      await reprocessResponse;

      await expect(page.getByTestId('mutation-state')).toHaveText('applied');
      await expect(page.getByTestId('event-append-state')).toHaveText('appended');
      await expect(page.getByTestId('audit-event-type-latest')).toHaveText('DocumentReprocessed');
      await expect(page.getByTestId('audit-history-preserved')).toHaveText('true');
    },
  );

  test('[P0][AC2] should block disallowed lifecycle transitions with deterministic transition guard errors', async ({ page }) => {
    await page.goto('/');
    const sessionId = 'session-reprocess-e2e-002';
    await dispatchImportForSession(page, sessionId, 'blob-reprocess-002');

    const rejectedReprocessResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/commands/dispatch') &&
        response.request().method() === 'POST' &&
        response.status() === 409,
    );

    await page.getByTestId('command-type-input').fill('ReprocessDocument');
    await page.getByTestId('reprocess-session-id-input').fill(sessionId);
    await page.getByTestId('reprocess-document-id-input').fill(sessionId + ':blob-reprocess-002');
    await page.getByTestId('reprocess-target-state-input').fill('archived');
    await page.getByTestId('reprocess-reason-input').fill('operator_requested_quality_upgrade');
    await page.getByTestId('command-submit-button').click();

    await rejectedReprocessResponse;

    await expect(page.getByTestId('mutation-state')).toHaveText('not-applied');
    await expect(page.getByTestId('event-append-state')).toHaveText('not-appended');
    await expect(page.getByTestId('command-error-code')).toHaveText('PRECONDITION_FAILED');
    await expect(page.getByTestId('command-error-detail-latest')).toHaveText('transition_not_allowed');
  });
});
