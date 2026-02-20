import { test, expect } from '../support/fixtures';
import { story20aRedPhaseData } from '../support/fixtures/story-2-0a-red-phase-data';

test.describe('Story 2.0a API automation coverage', () => {
  async function runLatencySmoke(
    apiRequest: <TResponseBody>(request: {
      method: 'POST';
      path: string;
      body: unknown;
    }) => Promise<{ status: number; body: TResponseBody }>,
    thresholds: { highlight_ms_max: number; queue_advance_ms_max: number },
  ) {
    return apiRequest<{ error: string }>({
      method: 'POST',
      path: '/api/v1/perf/latency-smoke/run',
      body: {
        scenario_seed: story20aRedPhaseData.scenarioSeed,
        scenarios: story20aRedPhaseData.scenarios,
        thresholds,
      },
    });
  }

  test('[P0][AC1] should keep latency smoke run endpoint unavailable before implementation', async ({ apiRequest }) => {
    const { status, body } = await runLatencySmoke(apiRequest, {
      highlight_ms_max: story20aRedPhaseData.thresholds.highlightP95MsMax,
      queue_advance_ms_max: story20aRedPhaseData.thresholds.queueAdvanceP95MsMax,
    });

    expect(status).toBe(404);
    expect(body).toEqual({ error: 'Not found' });
  });

  test('[P0][AC2] should return deterministic machine-readable not-found output across repeated latency smoke invocations', async ({
    apiRequest,
  }) => {
    const first = await runLatencySmoke(apiRequest, {
      highlight_ms_max: 1,
      queue_advance_ms_max: 1,
    });
    const second = await runLatencySmoke(apiRequest, {
      highlight_ms_max: 1,
      queue_advance_ms_max: 1,
    });

    expect(first.status).toBe(404);
    expect(second.status).toBe(404);
    expect(first.body).toEqual({ error: 'Not found' });
    expect(second.body).toEqual({ error: 'Not found' });
  });

  test('[P1][AC3] should keep latency smoke artifact endpoint unavailable before implementation', async ({ apiRequest }) => {
    const artifact = await apiRequest<{ error: string }>({
      method: 'GET',
      path: '/api/v1/perf/latency-smoke/runs/fake-run-id/artifact',
    });

    expect(artifact.status).toBe(404);
    expect(artifact.body).toEqual({ error: 'Not found' });
  });

  test('[P1][AC1] should keep non-deterministic scenario ordering guard unimplemented until latency endpoint exists', async ({
    apiRequest,
  }) => {
    const response = await apiRequest<{ error: string }>({
      method: 'POST',
      path: '/api/v1/perf/latency-smoke/run',
      body: {
        scenario_seed: story20aRedPhaseData.scenarioSeed,
        scenarios: [
          ...story20aRedPhaseData.scenarios,
          { id: 'dynamic-randomized-order', workflow: 'verification-evidence-highlight' },
        ],
        allow_random_order: true,
      },
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
  });
});
