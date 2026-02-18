import type { Page } from '@playwright/test';

export async function mockV1HealthRoute(page: Page): Promise<void> {
  await page.route('**/api/v1/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        services: {
          frontend: 'up',
          backend: 'up',
        },
        apiVersion: 'v1',
      }),
    });
  });
}

export async function mockDispatchValidationFailure(page: Page): Promise<void> {
  await page.route('**/api/v1/commands/dispatch', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'CMD_ENVELOPE_VALIDATION_FAILED',
          category: 'validation',
          missing_fields: ['command_id', 'actor', 'timestamp', 'payload'],
        },
        mutation_applied: false,
        event_appended: false,
      }),
    });
  });
}
