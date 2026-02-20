import { test, expect } from '../support/fixtures';
import { story14RedPhaseData } from '../support/fixtures/story-1-4-red-phase-data';

test.describe('Story 1.4 E2E automation coverage', () => {
  test(
    '[P1][AC1] should show deterministic operator feedback when ApplyPreprocessing is dispatched for an unknown document',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
      const dispatchResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 409,
      );

      await page.goto('/');
      await page.getByTestId('command-type-input').fill(story14RedPhaseData.applyPreprocessing.commandType);
      await page.getByTestId('preprocessing-session-id-input').fill('session-story-1-4-e2e-preprocess');
      await page
        .getByTestId('preprocessing-document-id-input')
        .fill('session-story-1-4-e2e-preprocess:missing-document');
      await page.getByTestId('preprocessing-page-ids-input').fill('page-1,page-2');
      await page
        .getByTestId('preprocessing-profile-input')
        .fill(story14RedPhaseData.applyPreprocessing.preprocessingProfile);
      await page.getByTestId('command-submit-button').click();

      const response = await dispatchResponse;
      expect(response.status()).toBe(409);

      await expect(page.getByTestId('command-error-code')).toHaveText('PRECONDITION_FAILED');
      await expect(page.getByTestId('command-error-detail-latest')).toHaveText('document_not_found');
      await expect(page.getByTestId('mutation-state')).toHaveText('not-applied');
      await expect(page.getByTestId('event-append-state')).toHaveText('not-appended');
    },
  );

  test(
    '[P1][AC2] should show deterministic transition guard feedback when ReprocessDocument target is disallowed',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
      await page.goto('/');

      const importResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 202,
      );

      await page.getByTestId('command-type-input').fill('ImportDocument');
      await page.getByTestId('import-session-id-input').fill('session-story-1-4-e2e-reprocess');
      await page.getByTestId('import-blob-ids-input').fill('blob-story-1-4-e2e-reprocess');
      await page.getByTestId('import-metadata-source-input').fill('import');
      await page.getByTestId('import-file-name-input').fill('story-1-4-e2e-reprocess.pdf');
      await page.getByTestId('command-submit-button').click();
      await importResponse;

      const dispatchResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 409,
      );

      await page.getByTestId('command-type-input').fill(story14RedPhaseData.reprocessDocument.commandType);
      await page.getByTestId('reprocess-session-id-input').fill('session-story-1-4-e2e-reprocess');
      await page
        .getByTestId('reprocess-document-id-input')
        .fill('session-story-1-4-e2e-reprocess:blob-story-1-4-e2e-reprocess');
      await page
        .getByTestId('reprocess-target-state-input')
        .fill(story14RedPhaseData.reprocessDocument.disallowedTargetState);
      await page.getByTestId('reprocess-reason-input').fill('operator_requested_quality_upgrade');
      await page.getByTestId('command-submit-button').click();

      const response = await dispatchResponse;
      expect(response.status()).toBe(409);

      await expect(page.getByTestId('command-error-code')).toHaveText('PRECONDITION_FAILED');
      await expect(page.getByTestId('command-error-detail-latest')).toHaveText('transition_not_allowed');
      await expect(page.getByTestId('mutation-state')).toHaveText('not-applied');
      await expect(page.getByTestId('event-append-state')).toHaveText('not-appended');
    },
  );
});
