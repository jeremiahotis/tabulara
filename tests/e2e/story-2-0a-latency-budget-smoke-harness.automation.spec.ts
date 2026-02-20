import { test, expect } from '../support/fixtures';
import { story20aRedPhaseData } from '../support/fixtures/story-2-0a-red-phase-data';

test.describe('Story 2.0a E2E automation coverage', () => {
  test('[P1][AC1] should keep latency-smoke controls unavailable until harness UI is implemented', async ({ page }) => {
    await page.goto('/quality/latency-smoke');

    await expect(page.getByTestId('app-shell-ready')).toHaveText('ready');
    await expect(page.getByTestId('latency-smoke-run-button')).toHaveCount(0);
    await expect(page.getByTestId('latency-smoke-seed-input')).toHaveCount(0);
  });

  test('[P0][AC2] should return deterministic machine-readable not-found output for latency smoke run endpoint in browser context', async ({
    page,
  }) => {
    const response = await page.request.post('/api/v1/perf/latency-smoke/run', {
      data: {
        scenario_seed: story20aRedPhaseData.scenarioSeed,
        scenarios: story20aRedPhaseData.scenarios,
        thresholds: {
          highlight_ms_max: 1,
          queue_advance_ms_max: 1,
        },
      },
    });

    expect(response.status()).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Not found' });
  });

  test('[P1][AC3] should return deterministic not-found output for latency smoke artifact endpoint in browser context', async ({
    page,
  }) => {
    const response = await page.request.get('/api/v1/perf/latency-smoke/runs/fake-run-id/artifact');

    expect(response.status()).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Not found' });
  });
});
