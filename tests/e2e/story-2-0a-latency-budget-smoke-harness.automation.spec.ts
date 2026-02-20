import { test, expect } from '../support/fixtures';
import { story20aRedPhaseData } from '../support/fixtures/story-2-0a-red-phase-data';

test.describe('Story 2.0a E2E automation coverage', () => {
  test('[P1][AC1] should keep latency-smoke controls unavailable until harness UI is implemented', async ({ page }) => {
    await page.goto('/quality/latency-smoke');

    await expect(page.getByTestId('app-shell-ready')).toHaveText('ready');
    await expect(page.getByTestId('latency-smoke-run-button')).toHaveCount(0);
    await expect(page.getByTestId('latency-smoke-seed-input')).toHaveCount(0);
  });

  test('[P0][AC2] should return deterministic machine-readable threshold failures for latency smoke run endpoint in browser context', async ({
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

    expect(response.status()).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: 'LATENCY_THRESHOLD_EXCEEDED',
      },
      threshold_evaluation: {
        highlight_p95_within_budget: false,
        queue_advance_p95_within_budget: false,
      },
      process: {
        exit_code: 1,
      },
    });
  });

  test('[P1][AC3] should expose latency smoke artifact metadata endpoint in browser context', async ({
    page,
  }) => {
    const runResponse = await page.request.post('/api/v1/perf/latency-smoke/run', {
      data: {
        scenario_seed: story20aRedPhaseData.scenarioSeed,
        scenarios: story20aRedPhaseData.scenarios,
        thresholds: {
          highlight_ms_max: story20aRedPhaseData.thresholds.highlightP95MsMax,
          queue_advance_ms_max: story20aRedPhaseData.thresholds.queueAdvanceP95MsMax,
        },
      },
    });
    expect(runResponse.status()).toBe(200);
    const runBody = (await runResponse.json()) as { run_id: string };

    const artifactResponse = await page.request.get(`/api/v1/perf/latency-smoke/runs/${runBody.run_id}/artifact`);
    expect(artifactResponse.status()).toBe(200);
    await expect(artifactResponse.json()).resolves.toMatchObject({
      output_path: expect.stringContaining('_bmad-output/test-artifacts'),
      metadata: {
        run_id: runBody.run_id,
        scenario_seed: story20aRedPhaseData.scenarioSeed,
      },
    });
  });
});
