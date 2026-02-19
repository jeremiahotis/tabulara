import { test, expect } from '../support/fixtures';
import { story15ExpectedErrorCodes, story15RedPhaseData } from '../support/fixtures/story-1-5-red-phase-data';

test.describe('Story 1.5 E2E automation coverage', () => {
  async function dispatchAndWait(page: import('@playwright/test').Page, commandType: string, status: number) {
    const dispatchResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/commands/dispatch') &&
        response.request().method() === 'POST' &&
        response.status() === status &&
        response.request().postDataJSON()?.type === commandType,
    );
    await page.getByTestId('command-submit-button').click();
    return dispatchResponse;
  }

  test(
    '[P1][AC1] should dispatch RunExtraction and show persisted extraction telemetry in the shell',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
      const sessionId = 'session-story-1-5-ui-run';
      const blobId = 'blob-story-1-5-ui-run';
      const documentId = `${sessionId}:${blobId}`;
      await page.goto('/');

      await page.getByTestId('command-type-input').fill('ImportDocument');
      await page.getByTestId('import-session-id-input').fill(sessionId);
      await page.getByTestId('import-blob-ids-input').fill(blobId);
      await page.getByTestId('import-file-name-input').fill('invoice-story-1-5-ui-run.pdf');
      const importResponse = await dispatchAndWait(page, 'ImportDocument', 202);
      expect((await importResponse).status()).toBe(202);

      await page.getByTestId('command-type-input').fill('ApplyPreprocessing');
      await page.getByTestId('preprocessing-session-id-input').fill(sessionId);
      await page.getByTestId('preprocessing-document-id-input').fill(documentId);
      await page.getByTestId('preprocessing-page-ids-input').fill('page-1,page-2');
      await page.getByTestId('preprocessing-profile-input').fill('ocr-enhance');
      const preprocessingResponse = await dispatchAndWait(page, 'ApplyPreprocessing', 202);
      expect((await preprocessingResponse).status()).toBe(202);

      await page.getByTestId('command-type-input').fill(story15RedPhaseData.runExtraction.commandType);
      await page.getByTestId('run-extraction-session-id-input').fill(sessionId);
      await page.getByTestId('run-extraction-document-id-input').fill(documentId);
      await page
        .getByTestId('run-extraction-profile-input')
        .fill(story15RedPhaseData.runExtraction.extractionProfile);
      const response = await dispatchAndWait(page, 'RunExtraction', 202);
      expect(response.status()).toBe(202);

      await expect(page.getByTestId('mutation-state')).toHaveText('applied');
      await expect(page.getByTestId('event-append-state')).toHaveText('appended');
      await expect(page.getByTestId('audit-event-type-latest')).toHaveText('DerivedDataUpdated');
      await expect(page.getByTestId('extraction-derived-values-count')).toHaveText(/^[1-9]\d*$/);
      await expect(page.getByTestId('extraction-table-candidates-count')).toHaveText(/^[1-9]\d*$/);
    },
  );

  test(
    '[P1][AC2] should keep extraction failure payloads deterministic across repeated RunExtraction submissions',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
      const sessionId = 'session-story-1-5-ui-fail';
      const blobId = 'blob-story-1-5-ui-fail';
      const documentId = `${sessionId}:${blobId}`;
      await page.goto('/');

      await page.getByTestId('command-type-input').fill('ImportDocument');
      await page.getByTestId('import-session-id-input').fill(sessionId);
      await page.getByTestId('import-blob-ids-input').fill(blobId);
      await page.getByTestId('import-file-name-input').fill('invoice-story-1-5-ui-fail.pdf');
      const importResponse = await dispatchAndWait(page, 'ImportDocument', 202);
      expect(importResponse.status()).toBe(202);

      await page.getByTestId('command-type-input').fill('ApplyPreprocessing');
      await page.getByTestId('preprocessing-session-id-input').fill(sessionId);
      await page.getByTestId('preprocessing-document-id-input').fill(documentId);
      await page.getByTestId('preprocessing-page-ids-input').fill('page-1,page-2');
      await page.getByTestId('preprocessing-profile-input').fill('ocr-enhance');
      const preprocessingResponse = await dispatchAndWait(page, 'ApplyPreprocessing', 202);
      expect(preprocessingResponse.status()).toBe(202);

      const firstDispatchResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 409 &&
          response.request().postDataJSON()?.type === 'RunExtraction',
      );

      await page.getByTestId('command-type-input').fill('RunExtraction');
      await page.getByTestId('run-extraction-session-id-input').fill(sessionId);
      await page.getByTestId('run-extraction-document-id-input').fill(documentId);
      await page.getByTestId('run-extraction-profile-input').fill('operations-default');
      await page.getByTestId('run-extraction-force-fail-stage-input').fill('extractor-runtime');
      await page.getByTestId('command-submit-button').click();
      await firstDispatchResponse;

      await expect(page.getByTestId('command-error-code')).toHaveText(story15ExpectedErrorCodes.extractionFailed);
      await expect(page.getByTestId('command-error-detail-latest')).toHaveText(
        story15ExpectedErrorCodes.extractionFailureReason,
      );
      await expect(page.getByTestId('command-error-payload-stability')).toHaveText('deterministic');
      await expect(page.getByTestId('mutation-state')).toHaveText('not-applied');
      await expect(page.getByTestId('event-append-state')).toHaveText('not-appended');

      const secondDispatchResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 409 &&
          response.request().postDataJSON()?.type === 'RunExtraction',
      );

      await page.getByTestId('command-submit-button').click();
      await secondDispatchResponse;

      await expect(page.getByTestId('command-error-code')).toHaveText(story15ExpectedErrorCodes.extractionFailed);
      await expect(page.getByTestId('command-error-detail-latest')).toHaveText(
        story15ExpectedErrorCodes.extractionFailureReason,
      );
      await expect(page.getByTestId('command-error-payload-stability')).toHaveText('deterministic');
      await expect(page.getByTestId('mutation-state')).toHaveText('not-applied');
      await expect(page.getByTestId('event-append-state')).toHaveText('not-appended');
    },
  );
});
