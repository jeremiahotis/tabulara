import { test, expect } from '@playwright/test';

test.describe('Story 1.2 session creation + pinning workflow (ATDD RED)', () => {
  test.skip(
    '[P0][AC1] should create session through CreateSession command and surface SessionCreated traceability',
    async ({ page }) => {
      const dispatchResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 202,
      );

      await page.goto('/');
      await page.getByTestId('command-type-input').fill('CreateSession');
      await page.getByTestId('project-id-input').fill('project-123');
      await page.getByTestId('schema-id-input').fill('schema-123');
      await page.getByTestId('command-submit-button').click();

      await dispatchResponse;

      await expect(page.getByTestId('session-list-item-latest')).toBeVisible();
      await expect(page.getByTestId('session-status-latest')).toHaveText('created');
      await expect(page.getByTestId('audit-event-type-latest')).toHaveText('SessionCreated');
      await expect(page.getByTestId('audit-event-caused-by-latest')).toHaveText(/.+/);
    },
  );

  test.skip(
    '[P0][AC2] should pin an existing session and append SessionPinned atomically',
    async ({ page }) => {
      const pinResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 202,
      );

      await page.goto('/');
      await page.getByTestId('session-list-item-latest').click();
      await page.getByTestId('session-pin-toggle').click();

      await pinResponse;

      await expect(page.getByTestId('session-pinned-indicator')).toHaveText('pinned');
      await expect(page.getByTestId('audit-event-type-latest')).toHaveText('SessionPinned');
      await expect(page.getByTestId('transaction-status-latest')).toHaveText('atomic');
    },
  );

  test.skip(
    '[P1][AC2] should unpin an existing session and append SessionUnpinned atomically',
    async ({ page }) => {
      const unpinResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/commands/dispatch') &&
          response.request().method() === 'POST' &&
          response.status() === 202,
      );

      await page.goto('/');
      await page.getByTestId('session-list-item-latest').click();
      await page.getByTestId('session-pin-toggle').click();

      await unpinResponse;

      await expect(page.getByTestId('session-pinned-indicator')).toHaveText('unpinned');
      await expect(page.getByTestId('audit-event-type-latest')).toHaveText('SessionUnpinned');
      await expect(page.getByTestId('transaction-status-latest')).toHaveText('atomic');
    },
  );
});
