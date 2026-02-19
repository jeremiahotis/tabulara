import { test, expect } from '../support/fixtures';

test.describe('Story 1.3 E2E automation coverage', () => {
  test(
    '[P1][AC1] should surface deterministic import acceptance feedback when ImportDocument is dispatched from the shell',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
      const dispatchResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 202,
      );

      await page.goto('/');
      await page.getByTestId('command-type-input').fill('ImportDocument');
      await page.getByTestId('command-submit-button').click();

      const response = await dispatchResponse;
      expect(response.status()).toBe(202);
      const body = (await response.json()) as {
        accepted: boolean;
        command_id: string;
        mutation_applied: true;
        event_appended: true;
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
            type: 'DocumentImported',
            caused_by: body.command_id,
          }),
        ]),
      );

      await expect(page.getByTestId('command-error-code')).toHaveText('');
      await expect(page.getByTestId('mutation-state')).toHaveText('applied');
      await expect(page.getByTestId('event-append-state')).toHaveText('appended');
    },
  );

  test(
    '[P1][AC2] should surface deterministic duplicate acceptance feedback when ConfirmDuplicate is dispatched from the shell',
    { annotation: [{ type: 'skipNetworkMonitoring' }] },
    async ({ page }) => {
      const dispatchResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 202,
      );

      await page.goto('/');
      await page.getByTestId('command-type-input').fill('ConfirmDuplicate');
      await page.getByTestId('command-submit-button').click();

      const response = await dispatchResponse;
      expect(response.status()).toBe(202);
      const body = (await response.json()) as {
        accepted: boolean;
        command_id: string;
        mutation_applied: true;
        event_appended: true;
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
            type: 'DuplicateMarked',
            caused_by: body.command_id,
          }),
        ]),
      );

      await expect(page.getByTestId('command-error-code')).toHaveText('');
      await expect(page.getByTestId('mutation-state')).toHaveText('applied');
      await expect(page.getByTestId('event-append-state')).toHaveText('appended');
    },
  );
});
