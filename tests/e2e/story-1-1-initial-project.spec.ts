import { test, expect } from '@playwright/test';

test.describe('Story 1.1 startup and envelope behavior (ATDD RED)', () => {
  test.skip('[P0][AC1] should show desktop shell booted with frontend and backend health checks passing', async ({ page }) => {
    // Given the app is launched in development mode
    // When the operator opens the initial workspace
    await page.goto('/');

    // Then shell and health checks are visible as passing
    await expect(page.getByTestId('app-shell-ready')).toHaveText('ready');
    await expect(page.getByTestId('frontend-health-status')).toHaveText('up');
    await expect(page.getByTestId('backend-health-status')).toHaveText('up');
    await expect(page.getByTestId('api-version-badge')).toHaveText('/api/v1');
  });

  test.skip('[P0][AC2] should reject command submission when envelope fields are missing', async ({ page }) => {
    // Given operator opens command dispatcher UI
    await page.goto('/');

    // When required envelope fields are omitted and command is submitted
    await page.getByTestId('command-type-input').fill('session.initialize');
    await page.getByTestId('command-submit-button').click();

    // Then deterministic machine-readable errors are shown and no mutation occurs
    await expect(page.getByTestId('command-error-code')).toHaveText('CMD_ENVELOPE_VALIDATION_FAILED');
    await expect(page.getByTestId('command-error-missing-fields')).toContainText('command_id, actor, timestamp, payload');
    await expect(page.getByTestId('mutation-state')).toHaveText('none');
    await expect(page.getByTestId('event-append-state')).toHaveText('none');
  });
});
