import { test, expect } from '../support/fixtures';
import { story15ExpectedErrorCodes, story15RedPhaseData } from '../support/fixtures/story-1-5-red-phase-data';

test.describe('Story 1.5 E2E automation coverage', () => {
  test(
    '[P1][AC1] should dispatch RunExtraction and show persisted extraction telemetry in the shell',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
      const dispatchResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 202,
      );

      await page.goto('/');
      await page.getByTestId('command-type-input').fill(story15RedPhaseData.runExtraction.commandType);
      await page.getByTestId('run-extraction-session-id-input').fill('session-story-1-5-ui-run');
      await page.getByTestId('run-extraction-document-id-input').fill('session-story-1-5-ui-run:doc-001');
      await page
        .getByTestId('run-extraction-profile-input')
        .fill(story15RedPhaseData.runExtraction.extractionProfile);
      await page.getByTestId('command-submit-button').click();

      const response = await dispatchResponse;
      expect(response.status()).toBe(202);

      await expect(page.getByTestId('mutation-state')).toHaveText('applied');
      await expect(page.getByTestId('event-append-state')).toHaveText('appended');
      await expect(page.getByTestId('audit-event-type-latest')).toHaveText('DerivedDataUpdated');
      await expect(page.getByTestId('extraction-derived-values-count')).toContainText(/\d+/);
      await expect(page.getByTestId('extraction-table-candidates-count')).toContainText(/\d+/);
    },
  );

  test(
    '[P1][AC2] should keep extraction failure payloads deterministic across repeated RunExtraction submissions',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
      await page.goto('/');

      const firstDispatchResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 409,
      );

      await page.getByTestId('command-type-input').fill('RunExtraction');
      await page.getByTestId('run-extraction-session-id-input').fill('session-story-1-5-ui-fail');
      await page.getByTestId('run-extraction-document-id-input').fill('session-story-1-5-ui-fail:doc-001');
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
          response.status() === 409,
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
