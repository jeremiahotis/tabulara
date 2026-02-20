import { test, expect } from '@playwright/test';

test.describe('Story 2.0a latency budget smoke harness UX (ATDD RED)', () => {
  test.skip('[P0][AC1] should display deterministic seeded run results with p50/p95/p99 metrics for highlight and queue-advance', async ({
    page,
  }) => {
    await page.goto('/quality/latency-smoke');

    await page.getByTestId('latency-smoke-seed-input').fill('latency-budget-smoke-v1');
    await page.getByTestId('latency-smoke-run-button').click();

    await expect(page.getByTestId('latency-metric-highlight-p50')).toBeVisible();
    await expect(page.getByTestId('latency-metric-highlight-p95')).toBeVisible();
    await expect(page.getByTestId('latency-metric-highlight-p99')).toBeVisible();

    await expect(page.getByTestId('latency-metric-queue-advance-p50')).toBeVisible();
    await expect(page.getByTestId('latency-metric-queue-advance-p95')).toBeVisible();
    await expect(page.getByTestId('latency-metric-queue-advance-p99')).toBeVisible();

    await expect(page.getByTestId('latency-threshold-status-highlight')).toContainText('within budget');
    await expect(page.getByTestId('latency-threshold-status-queue-advance')).toContainText('within budget');
  });

  test.skip('[P0][AC2] should block merge gate view with deterministic machine-readable threshold breach details when a budget is exceeded', async ({
    page,
  }) => {
    await page.goto('/quality/latency-smoke');

    await page.getByTestId('latency-threshold-highlight-input').fill('1');
    await page.getByTestId('latency-threshold-queue-advance-input').fill('1');
    await page.getByTestId('latency-smoke-run-button').click();

    await expect(page.getByTestId('latency-gate-status')).toHaveText('failed');
    await expect(page.getByTestId('latency-gate-exit-code')).toHaveText('1');
    await expect(page.getByTestId('latency-failure-error-code')).toHaveText('LATENCY_THRESHOLD_EXCEEDED');

    await expect(page.getByTestId('latency-failure-scenario')).toBeVisible();
    await expect(page.getByTestId('latency-failure-metric')).toBeVisible();
    await expect(page.getByTestId('latency-failure-observed-percentile')).toBeVisible();
    await expect(page.getByTestId('latency-failure-threshold-ms')).toBeVisible();
  });

  test.skip('[P1][AC3] should expose artifact summary metadata path and trend-comparison run metadata after a successful run', async ({ page }) => {
    await page.goto('/quality/latency-smoke');

    await page.getByTestId('latency-smoke-run-button').click();

    await expect(page.getByTestId('latency-artifact-path')).toContainText('_bmad-output/test-artifacts');
    await expect(page.getByTestId('latency-artifact-run-id')).toBeVisible();
    await expect(page.getByTestId('latency-artifact-harness-version')).toBeVisible();
    await expect(page.getByTestId('latency-artifact-commit-sha')).toBeVisible();
    await expect(page.getByTestId('latency-artifact-started-at')).toBeVisible();
    await expect(page.getByTestId('latency-artifact-completed-at')).toBeVisible();
  });
});
