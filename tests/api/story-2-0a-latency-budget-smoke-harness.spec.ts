import { test, expect } from '@playwright/test';
import { story20aExpectedErrorCodes, story20aRedPhaseData } from '../support/fixtures/story-2-0a-red-phase-data';

test.describe('Story 2.0a API acceptance tests (ATDD RED)', () => {
  test.skip('[P0][AC1] should report p50/p95/p99 for highlight and queue-advance latency on seeded scenario runs', async ({
    request,
  }) => {
    const response = await request.post('/api/v1/perf/latency-smoke/run', {
      data: {
        scenario_seed: story20aRedPhaseData.scenarioSeed,
        scenarios: story20aRedPhaseData.scenarios,
        thresholds: {
          highlight_ms_max: story20aRedPhaseData.thresholds.highlightP95MsMax,
          queue_advance_ms_max: story20aRedPhaseData.thresholds.queueAdvanceP95MsMax,
        },
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
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
        highlight_p95_within_budget: expect.any(Boolean),
        queue_advance_p95_within_budget: expect.any(Boolean),
      },
    });
  });

  test.skip('[P0][AC2] should return deterministic machine-readable threshold failure output and fail the run', async ({ request }) => {
    const response = await request.post('/api/v1/perf/latency-smoke/run', {
      data: {
        scenario_seed: story20aRedPhaseData.scenarioSeed,
        scenarios: [story20aRedPhaseData.scenarios[1]],
        thresholds: {
          highlight_ms_max: 1,
          queue_advance_ms_max: 1,
        },
      },
    });

    expect(response.status()).toBe(422);
    const body = await response.json();

    expect(body).toMatchObject({
      success: false,
      error: {
        code: story20aExpectedErrorCodes.thresholdExceeded,
      },
      failures: [
        {
          scenario: expect.any(String),
          metric: expect.stringMatching(/highlight|queue_advance/),
          observed_percentile: expect.stringMatching(/p95|p99/),
          observed_ms: expect.any(Number),
          threshold_ms: expect.any(Number),
        },
      ],
      process: {
        exit_code: 1,
      },
    });
  });

  test.skip('[P1][AC3] should emit run summary metadata artifact under _bmad-output/test-artifacts for regression trend comparison', async ({
    request,
  }) => {
    const runResponse = await request.post('/api/v1/perf/latency-smoke/run', {
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
    const runBody = await runResponse.json();

    const artifactResponse = await request.get(`/api/v1/perf/latency-smoke/runs/${runBody.run_id}/artifact`);
    expect(artifactResponse.status()).toBe(200);

    const artifactBody = await artifactResponse.json();
    expect(artifactBody).toMatchObject({
      output_path: expect.stringContaining('_bmad-output/test-artifacts'),
      metadata: {
        run_id: runBody.run_id,
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

  test.skip('[P1][AC1] should reject non-deterministic scenario ordering to prevent flaky regression signals', async ({ request }) => {
    const response = await request.post('/api/v1/perf/latency-smoke/run', {
      data: {
        scenario_seed: story20aRedPhaseData.scenarioSeed,
        scenarios: [
          ...story20aRedPhaseData.scenarios,
          { id: 'dynamic-randomized-order', workflow: 'verification-evidence-highlight' },
        ],
        allow_random_order: true,
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({
      error: {
        code: story20aExpectedErrorCodes.malformedScenarioSet,
        reason: 'non_deterministic_ordering_disallowed',
      },
      mutation_applied: false,
    });
  });
});
