import { test, expect } from '../support/fixtures';
import { story15ExpectedErrorCodes, story15RedPhaseData } from '../support/fixtures/story-1-5-red-phase-data';

test.describe('Story 1.5 E2E automation coverage', () => {
  test(
    '[P1][AC1] should show deterministic unsupported-command feedback when RunExtraction is dispatched from the shell',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
      const dispatchResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 400,
      );

      await page.goto('/');
      await page.getByTestId('command-type-input').fill(story15RedPhaseData.runExtraction.commandType);
      await page.getByTestId('command-submit-button').click();

      const response = await dispatchResponse;
      expect(response.status()).toBe(400);

      await expect(page.getByTestId('command-error-code')).toHaveText(story15ExpectedErrorCodes.unsupportedType);
      await expect(page.getByTestId('command-error-detail-latest')).toHaveText(
        story15ExpectedErrorCodes.unsupportedReason,
      );
      await expect(page.getByTestId('mutation-state')).toHaveText('none');
      await expect(page.getByTestId('event-append-state')).toHaveText('none');
    },
  );

  test(
    '[P1][AC2] should keep unsupported-command UI payloads deterministic across repeated RunExtraction submissions',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
      await page.goto('/');

      const firstDispatchResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 400,
      );

      await page.getByTestId('command-type-input').fill('RunExtraction');
      await page.getByTestId('command-submit-button').click();
      await firstDispatchResponse;

      await expect(page.getByTestId('command-error-code')).toHaveText('CMD_TYPE_UNSUPPORTED');
      await expect(page.getByTestId('command-error-detail-latest')).toHaveText('unsupported_command_type');
      await expect(page.getByTestId('mutation-state')).toHaveText('none');
      await expect(page.getByTestId('event-append-state')).toHaveText('none');

      const secondDispatchResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 400,
      );

      await page.getByTestId('command-submit-button').click();
      await secondDispatchResponse;

      await expect(page.getByTestId('command-error-code')).toHaveText('CMD_TYPE_UNSUPPORTED');
      await expect(page.getByTestId('command-error-detail-latest')).toHaveText('unsupported_command_type');
      await expect(page.getByTestId('mutation-state')).toHaveText('none');
      await expect(page.getByTestId('event-append-state')).toHaveText('none');
    },
  );
});
