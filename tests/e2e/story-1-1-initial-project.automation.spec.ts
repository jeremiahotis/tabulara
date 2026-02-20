import { test, expect } from '../support/fixtures';

test.describe('Story 1.1 startup and command envelope automation', () => {
  test('[P0][AC1] should show shell startup readiness and /api/v1 availability', async ({ page }) => {
    const healthResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/health') &&
        response.request().method() === 'GET' &&
        response.status() === 200,
    );

    await page.goto('/');
    await healthResponse;

    await expect(page.getByTestId('app-shell-ready')).toHaveText('ready');
    await expect(page.getByTestId('frontend-health-status')).toHaveText('up');
    await expect(page.getByTestId('backend-health-status')).toHaveText('up');
    await expect(page.getByTestId('api-version-badge')).toHaveText('/api/v1');
  });

  test(
    '[P1][AC2] should render deterministic validation errors for missing command envelope fields',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
    const dispatchResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/commands/dispatch') &&
        response.request().method() === 'POST',
    );

    await page.goto('/');
    await page.getByTestId('command-submit-button').click();

    const response = await dispatchResponse;
    expect(response.status()).toBe(400);

    await expect(page.getByTestId('command-error-code')).toHaveText(
      'CMD_ENVELOPE_VALIDATION_FAILED',
    );
    await expect(page.getByTestId('command-error-missing-fields')).toContainText(
      'command_id, type, actor, timestamp, payload',
    );
    await expect(page.getByTestId('mutation-state')).toHaveText('none');
    await expect(page.getByTestId('event-append-state')).toHaveText('none');
    },
  );
});
