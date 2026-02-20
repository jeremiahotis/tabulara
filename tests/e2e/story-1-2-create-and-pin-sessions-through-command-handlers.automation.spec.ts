import { test, expect } from '../support/fixtures';

test.describe('Story 1.2 E2E automation coverage', () => {
  test('[P0][AC1] should dispatch CreateSession from the UI and surface accepted mutation/event states', async ({
    page,
  }) => {
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
    const body = (await response.json()) as {
      accepted: boolean;
      command_id: string;
      mutation_applied: boolean;
      event_appended: boolean;
      events: Array<{ type: string; caused_by: string }>;
    };
    expect(body).toMatchObject({
      accepted: true,
      mutation_applied: true,
      event_appended: true,
    });
    expect(body.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'SessionCreated',
          caused_by: body.command_id,
        }),
      ]),
    );

    await expect(page.getByTestId('mutation-state')).toHaveText('applied');
    await expect(page.getByTestId('event-append-state')).toHaveText('appended');
    await expect(page.getByTestId('command-error-code')).toHaveText('');
  });

  test('[P0][AC2] should dispatch PinSession from the UI and preserve accepted mutation/event indicators', async ({
    page,
  }) => {
    const createSessionResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/commands/dispatch') &&
        response.request().method() === 'POST' &&
        response.status() === 202,
    );

    await page.goto('/');
    await page.getByTestId('command-type-input').fill('CreateSession');
    await page.getByTestId('command-submit-button').click();
    await createSessionResponse;

    const pinSessionResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/commands/dispatch') &&
        response.request().method() === 'POST' &&
        response.status() === 202,
    );

    await page.getByTestId('command-type-input').fill('PinSession');
    await page.getByTestId('command-submit-button').click();

    const response = await pinSessionResponse;
    expect(response.status()).toBe(202);
    const body = (await response.json()) as {
      accepted: boolean;
      command_id: string;
      mutation_applied: boolean;
      event_appended: boolean;
      events: Array<{ type: string; caused_by: string }>;
    };
    expect(body).toMatchObject({
      accepted: true,
      mutation_applied: true,
      event_appended: true,
    });
    expect(body.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'SessionPinned',
          caused_by: body.command_id,
        }),
      ]),
    );

    await expect(page.getByTestId('mutation-state')).toHaveText('applied');
    await expect(page.getByTestId('event-append-state')).toHaveText('appended');
    await expect(page.getByTestId('command-error-code')).toHaveText('');
  });

  test(
    '[P1][AC1] should keep deterministic validation feedback for unsupported command types',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
    const dispatchResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/commands/dispatch') &&
        response.request().method() === 'POST' &&
        response.status() === 400,
    );

    await page.goto('/');
    await page.getByTestId('command-type-input').fill('UnknownCommand');
    await page.getByTestId('command-submit-button').click();

    const response = await dispatchResponse;
    expect(response.status()).toBe(400);

    await expect(page.getByTestId('command-error-code')).toHaveText('CMD_TYPE_UNSUPPORTED');
    await expect(page.getByTestId('mutation-state')).toHaveText('none');
    await expect(page.getByTestId('event-append-state')).toHaveText('none');
    },
  );
});
