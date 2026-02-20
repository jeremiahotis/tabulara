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

  test('[P0][AC1] should report deterministic p50/p95/p99 metrics for highlight and queue advance', async ({ apiRequest }) => {
    const first = await runLatencySmoke(apiRequest, {
      highlight_ms_max: story20aRedPhaseData.thresholds.highlightP95MsMax,
      queue_advance_ms_max: story20aRedPhaseData.thresholds.queueAdvanceP95MsMax,
    });
    const second = await runLatencySmoke(apiRequest, {
      highlight_ms_max: story20aRedPhaseData.thresholds.highlightP95MsMax,
      queue_advance_ms_max: story20aRedPhaseData.thresholds.queueAdvanceP95MsMax,
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body).toMatchObject({
      run_id: expect.any(String),
      metrics: {
        highlight_latency_ms: {
          p50: expect.any(Number),
          p95: expect.any(Number),
          p99: expect.any(Number),
        },
        queue_advance_latency_ms: {
          p50: expect.any(Number),
          p95: expect.any(Number),
          p99: expect.any(Number),
        },
      },
      threshold_evaluation: {
        highlight_p95_within_budget: true,
        queue_advance_p95_within_budget: true,
      },
    });
    expect(first.body.metrics).toEqual(second.body.metrics);
    expect(first.body.threshold_evaluation).toEqual(second.body.threshold_evaluation);
  });

  test('[P0][AC2] should return deterministic machine-readable threshold failures with non-zero process exit code contract', async ({
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

    expect(first.status).toBe(422);
    expect(second.status).toBe(422);
    expect(first.body).toMatchObject({
      success: false,
      error: {
        code: 'LATENCY_THRESHOLD_EXCEEDED',
      },
      failures: expect.arrayContaining([
        expect.objectContaining({
          scenario: expect.any(String),
          metric: expect.stringMatching(/highlight|queue_advance/),
          observed_percentile: 'p95',
          observed_ms: expect.any(Number),
          threshold_ms: expect.any(Number),
        }),
      ]),
      process: {
        exit_code: 1,
      },
    });
    expect(second.body).toMatchObject({
      success: false,
      error: {
        code: 'LATENCY_THRESHOLD_EXCEEDED',
      },
      process: {
        exit_code: 1,
      },
    });
  });

  test('[P1][AC3] should emit latency summary artifact with run metadata for trend comparisons', async ({ apiRequest }) => {
    const run = await runLatencySmoke(apiRequest, {
      highlight_ms_max: story20aRedPhaseData.thresholds.highlightP95MsMax,
      queue_advance_ms_max: story20aRedPhaseData.thresholds.queueAdvanceP95MsMax,
    });
    expect(run.status).toBe(200);

    const artifact = await apiRequest<{
      output_path: string;
      metadata: {
        run_id: string;
        scenario_seed: string;
        scenario_count: number;
        git_commit: string;
        harness_version: string;
        started_at: string;
        completed_at: string;
      };
      percentiles: {
        highlight_latency_ms: { p50: number; p95: number; p99: number };
        queue_advance_latency_ms: { p50: number; p95: number; p99: number };
      };
    }>({
      method: 'GET',
      path: `/api/v1/perf/latency-smoke/runs/${(run.body as { run_id: string }).run_id}/artifact`,
    });

    expect(artifact.status).toBe(200);
    expect(artifact.body).toMatchObject({
      output_path: expect.stringContaining('_bmad-output/test-artifacts'),
      metadata: {
        run_id: (run.body as { run_id: string }).run_id,
        scenario_seed: story20aRedPhaseData.scenarioSeed,
        scenario_count: story20aRedPhaseData.scenarios.length,
        git_commit: expect.any(String),
        harness_version: expect.any(String),
        started_at: expect.any(String),
        completed_at: expect.any(String),
      },
      percentiles: {
        highlight_latency_ms: {
          p50: expect.any(Number),
          p95: expect.any(Number),
          p99: expect.any(Number),
        },
        queue_advance_latency_ms: {
          p50: expect.any(Number),
          p95: expect.any(Number),
          p99: expect.any(Number),
        },
      },
    });
  });

  test('[P1][AC1] should reject non-deterministic scenario ordering inputs deterministically', async ({
    apiRequest,
  }) => {
    const response = await apiRequest<{
      error: {
        code: string;
        reason: string;
      };
      mutation_applied: boolean;
    }>({
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

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'LATENCY_SCENARIO_SET_INVALID',
        reason: 'non_deterministic_ordering_disallowed',
      },
      mutation_applied: false,
    });
  });
});
