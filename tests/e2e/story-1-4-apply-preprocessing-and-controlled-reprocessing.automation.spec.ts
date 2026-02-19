import { test, expect } from '../support/fixtures';
import { story14RedPhaseData } from '../support/fixtures/story-1-4-red-phase-data';

test.describe('Story 1.4 E2E automation coverage', () => {
  test(
    '[P1][AC1] should keep deterministic validation feedback when ApplyPreprocessing is dispatched before backend support exists',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
      const dispatchResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 400,
      );

      await page.goto('/');
      await page
        .getByTestId('command-type-input')
        .fill(story14RedPhaseData.applyPreprocessing.commandType);
      await page.getByTestId('command-submit-button').click();

      const response = await dispatchResponse;
      expect(response.status()).toBe(400);

      await expect(page.getByTestId('command-error-code')).toHaveText('CMD_TYPE_UNSUPPORTED');
      await expect(page.getByTestId('mutation-state')).toHaveText('none');
      await expect(page.getByTestId('event-append-state')).toHaveText('none');
    },
  );

  test(
    '[P1][AC2] should keep deterministic validation feedback when ReprocessDocument is dispatched before transition policies are available',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
      const dispatchResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 400,
      );

      await page.goto('/');
      await page.getByTestId('command-type-input').fill(story14RedPhaseData.reprocessDocument.commandType);
      await page.getByTestId('command-submit-button').click();

      const response = await dispatchResponse;
      expect(response.status()).toBe(400);

      await expect(page.getByTestId('command-error-code')).toHaveText('CMD_TYPE_UNSUPPORTED');
      await expect(page.getByTestId('mutation-state')).toHaveText('none');
      await expect(page.getByTestId('event-append-state')).toHaveText('none');
    },
  );
});
