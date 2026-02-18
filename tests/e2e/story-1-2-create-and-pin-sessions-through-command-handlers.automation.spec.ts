import { test, expect } from '../support/fixtures';
import { mockDispatchAccepted } from '../support/fixtures/network-mocks';

test.describe('Story 1.2 E2E automation coverage', () => {
  test('[P0][AC1] should dispatch CreateSession from the UI and surface accepted mutation/event states', async ({
    page,
  }) => {
    let dispatchedType = '';

    await mockDispatchAccepted(page, {
      onDispatch: (payload) => {
        dispatchedType = String(payload.type ?? '');
      },
    });

    const dispatchResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/commands/dispatch') &&
        response.request().method() === 'POST' &&
        response.status() === 202,
    );

    await page.goto('/');
    await page.getByTestId('command-type-input').fill('CreateSession');
    await page.getByTestId('command-submit-button').click();

    const response = await dispatchResponse;
    expect(response.status()).toBe(202);
    expect(dispatchedType).toBe('CreateSession');

    await expect(page.getByTestId('mutation-state')).toHaveText('applied');
    await expect(page.getByTestId('event-append-state')).toHaveText('appended');
    await expect(page.getByTestId('command-error-code')).toHaveText('');
  });

  test('[P0][AC2] should dispatch PinSession from the UI and preserve accepted mutation/event indicators', async ({
    page,
  }) => {
    let dispatchedType = '';

    await mockDispatchAccepted(page, {
      onDispatch: (payload) => {
        dispatchedType = String(payload.type ?? '');
      },
    });

    const dispatchResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/commands/dispatch') &&
        response.request().method() === 'POST' &&
        response.status() === 202,
    );

    await page.goto('/');
    await page.getByTestId('command-type-input').fill('PinSession');
    await page.getByTestId('command-submit-button').click();

    const response = await dispatchResponse;
    expect(response.status()).toBe(202);
    expect(dispatchedType).toBe('PinSession');

    await expect(page.getByTestId('mutation-state')).toHaveText('applied');
    await expect(page.getByTestId('event-append-state')).toHaveText('appended');
    await expect(page.getByTestId('command-error-code')).toHaveText('');
  });

  test(
    '[P1][AC1] should keep deterministic validation feedback while full envelope inputs are unavailable in UI',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
    const dispatchResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/commands/dispatch') &&
        response.request().method() === 'POST',
    );

    await page.goto('/');
    await page.getByTestId('command-type-input').fill('CreateSession');
    await page.getByTestId('command-submit-button').click();

    const response = await dispatchResponse;
    expect(response.status()).toBe(400);

    await expect(page.getByTestId('command-error-code')).toHaveText('CMD_ENVELOPE_VALIDATION_FAILED');
    await expect(page.getByTestId('command-error-missing-fields')).toContainText('command_id, actor, timestamp, payload');
    await expect(page.getByTestId('mutation-state')).toHaveText('none');
    await expect(page.getByTestId('event-append-state')).toHaveText('none');
    },
  );
});
