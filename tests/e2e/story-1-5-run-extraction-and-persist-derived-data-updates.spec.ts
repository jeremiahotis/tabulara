import { test, expect, type Page } from '@playwright/test';

async function submitRunExtractionCommand(page: Page, params: {
  sessionId: string;
  documentId: string;
  profile: string;
}) {
  await page.getByTestId('command-type-input').fill('RunExtraction');
  await page.getByTestId('run-extraction-session-id-input').fill(params.sessionId);
  await page.getByTestId('run-extraction-document-id-input').fill(params.documentId);
  await page.getByTestId('run-extraction-profile-input').fill(params.profile);
  await page.getByTestId('command-submit-button').click();
}

test.describe('Story 1.5 extraction flow (ATDD RED)', () => {
  test.skip(
    '[P1][AC1] should submit RunExtraction from command workspace and surface persisted extraction telemetry',
    async ({ page }) => {
      await page.goto('/');

      const response = page.waitForResponse(
        (res) =>
          res.url().includes('/api/v1/commands/dispatch') &&
          res.request().method() === 'POST' &&
          res.status() === 202,
      );

      await submitRunExtractionCommand(page, {
        sessionId: 'session-extract-e2e-001',
        documentId: 'session-extract-e2e-001:doc-001',
        profile: 'operations-default',
      });

      await response;

      await expect(page.getByTestId('mutation-state')).toHaveText('applied');
      await expect(page.getByTestId('event-append-state')).toHaveText('appended');
      await expect(page.getByTestId('audit-event-type-latest')).toHaveText('ExtractionCompleted');
      await expect(page.getByTestId('extraction-derived-values-count')).toContainText(/\d+/);
      await expect(page.getByTestId('extraction-table-candidates-count')).toContainText(/\d+/);
    },
  );

  test.skip(
    '[P1][AC2] should show deterministic operator-facing extraction failure details when pipeline aborts pre-completion',
    async ({ page }) => {
      await page.goto('/');

      const failureResponse = page.waitForResponse(
        (res) =>
          res.url().includes('/api/v1/commands/dispatch') &&
          res.request().method() === 'POST' &&
          res.status() === 409,
      );

      await page.getByTestId('command-type-input').fill('RunExtraction');
      await page.getByTestId('run-extraction-session-id-input').fill('session-extract-e2e-fail-001');
      await page.getByTestId('run-extraction-document-id-input').fill('session-extract-e2e-fail-001:doc-missing');
      await page.getByTestId('run-extraction-profile-input').fill('operations-default');
      await page.getByTestId('run-extraction-force-fail-stage-input').fill('extractor-runtime');
      await page.getByTestId('command-submit-button').click();

      await failureResponse;

      await expect(page.getByTestId('mutation-state')).toHaveText('not-applied');
      await expect(page.getByTestId('event-append-state')).toHaveText('not-appended');
      await expect(page.getByTestId('command-error-code')).toHaveText('EXTRACTION_FAILED');
      await expect(page.getByTestId('command-error-detail-latest')).toHaveText('extractor_runtime_error');
      await expect(page.getByTestId('command-error-payload-stability')).toHaveText('deterministic');
    },
  );
});