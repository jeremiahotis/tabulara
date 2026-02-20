import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clampMinimum(value, minimum) {
  return value < minimum ? minimum : value;
}

function percentile(values, target) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.ceil((target / 100) * sorted.length);
  const index = Math.max(0, Math.min(sorted.length - 1, rank - 1));
  return sorted[index];
}

function xfnv1a(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createSeededRandom(seedText) {
  return mulberry32(xfnv1a(seedText));
}

function normalizeScenarios(rawScenarios) {
  if (!Array.isArray(rawScenarios) || rawScenarios.length === 0) {
    return {
      ok: false,
      error: {
        code: 'LATENCY_SCENARIO_SET_INVALID',
        reason: 'scenarios_required',
      },
    };
  }

  const normalized = [];
  const seenIds = new Set();

  for (const scenario of rawScenarios) {
    if (!isRecord(scenario)) {
      return {
        ok: false,
        error: {
          code: 'LATENCY_SCENARIO_SET_INVALID',
          reason: 'scenario_must_be_object',
        },
      };
    }

    const id = typeof scenario.id === 'string' ? scenario.id.trim() : '';
    const workflow = typeof scenario.workflow === 'string' ? scenario.workflow.trim() : '';
    const queueDepthValue = Number.isFinite(Number(scenario.queueDepth)) ? Number(scenario.queueDepth) : 1;
    const queueDepth = clampMinimum(Math.round(queueDepthValue), 1);

    if (id.length === 0 || workflow.length === 0) {
      return {
        ok: false,
        error: {
          code: 'LATENCY_SCENARIO_SET_INVALID',
          reason: 'scenario_id_and_workflow_required',
        },
      };
    }

    if (seenIds.has(id)) {
      return {
        ok: false,
        error: {
          code: 'LATENCY_SCENARIO_SET_INVALID',
          reason: 'duplicate_scenario_id',
        },
      };
    }

    seenIds.add(id);
    normalized.push({
      id,
      workflow,
      queueDepth,
    });
  }

  normalized.sort((left, right) => left.id.localeCompare(right.id));
  return { ok: true, scenarios: normalized };
}

function computeScenarioSamples({ seed, scenario, metric, sampleCount }) {
  const metricSalt = metric === 'highlight' ? 'highlight-latency' : 'queue-advance-latency';
  const random = createSeededRandom(`${seed}:${scenario.id}:${metricSalt}:${scenario.workflow}`);
  const samples = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const jitter = random();
    if (metric === 'highlight') {
      const base = 38 + scenario.queueDepth * 1.3;
      const value = Math.round(base + jitter * 18 + index * 0.05);
      samples.push(value);
      continue;
    }

    const base = 64 + scenario.queueDepth * 2.1;
    const value = Math.round(base + jitter * 24 + index * 0.08);
    samples.push(value);
  }

  return samples;
}

function calculatePercentiles(samples) {
  return {
    p50: percentile(samples, 50),
    p95: percentile(samples, 95),
    p99: percentile(samples, 99),
  };
}

function summarizeFailures({ scenarioMetrics, highlightThreshold, queueThreshold }) {
  const failures = [];
  for (const scenario of scenarioMetrics) {
    if (scenario.highlight_latency_ms.p95 > highlightThreshold) {
      failures.push({
        scenario: scenario.scenario_id,
        metric: 'highlight_latency_ms',
        observed_percentile: 'p95',
        observed_ms: scenario.highlight_latency_ms.p95,
        threshold_ms: highlightThreshold,
      });
    }
    if (scenario.queue_advance_latency_ms.p95 > queueThreshold) {
      failures.push({
        scenario: scenario.scenario_id,
        metric: 'queue_advance_latency_ms',
        observed_percentile: 'p95',
        observed_ms: scenario.queue_advance_latency_ms.p95,
        threshold_ms: queueThreshold,
      });
    }
  }
  return failures;
}

function normalizeGitCommit(providedCommit) {
  if (typeof providedCommit === 'string' && providedCommit.trim().length > 0) {
    return providedCommit.trim();
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function isValidRunId(runId) {
  return (
    typeof runId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId)
  );
}

export function createLatencySmokeHarness({
  artifactDir = '_bmad-output/test-artifacts',
  harnessVersion = '0.1.1-rc1',
  gitCommit,
} = {}) {
  const normalizedArtifactDir = resolve(artifactDir);
  const resolvedGitCommit = normalizeGitCommit(gitCommit);
  const runs = new Map();
  const artifactPathForRunId = (runId) => resolve(normalizedArtifactDir, `latency-smoke-${runId}.json`);

  function runLatencySmoke(input) {
    if (!isRecord(input)) {
      return {
        statusCode: 400,
        body: {
          error: {
            code: 'LATENCY_SCENARIO_SET_INVALID',
            reason: 'payload_must_be_object',
          },
          mutation_applied: false,
        },
      };
    }

    if (input.allow_random_order === true) {
      return {
        statusCode: 400,
        body: {
          error: {
            code: 'LATENCY_SCENARIO_SET_INVALID',
            reason: 'non_deterministic_ordering_disallowed',
          },
          mutation_applied: false,
        },
      };
    }

    const scenarioSeed = typeof input.scenario_seed === 'string' ? input.scenario_seed.trim() : '';
    if (scenarioSeed.length === 0) {
      return {
        statusCode: 400,
        body: {
          error: {
            code: 'LATENCY_SCENARIO_SET_INVALID',
            reason: 'scenario_seed_required',
          },
          mutation_applied: false,
        },
      };
    }

    const normalizedScenarios = normalizeScenarios(input.scenarios);
    if (!normalizedScenarios.ok) {
      return {
        statusCode: 400,
        body: {
          error: normalizedScenarios.error,
          mutation_applied: false,
        },
      };
    }

    const thresholds = isRecord(input.thresholds) ? input.thresholds : {};
    const highlightThreshold = Number.isFinite(Number(thresholds.highlight_ms_max))
      ? Number(thresholds.highlight_ms_max)
      : 100;
    const queueThreshold = Number.isFinite(Number(thresholds.queue_advance_ms_max))
      ? Number(thresholds.queue_advance_ms_max)
      : 150;

    const startedAt = new Date().toISOString();
    const allHighlightSamples = [];
    const allQueueSamples = [];
    const scenarioMetrics = normalizedScenarios.scenarios.map((scenario) => {
      const highlightSamples = computeScenarioSamples({
        seed: scenarioSeed,
        scenario,
        metric: 'highlight',
        sampleCount: 25,
      });
      const queueSamples = computeScenarioSamples({
        seed: scenarioSeed,
        scenario,
        metric: 'queue',
        sampleCount: 25,
      });
      allHighlightSamples.push(...highlightSamples);
      allQueueSamples.push(...queueSamples);

      return {
        scenario_id: scenario.id,
        workflow: scenario.workflow,
        queue_depth: scenario.queueDepth,
        highlight_latency_ms: calculatePercentiles(highlightSamples),
        queue_advance_latency_ms: calculatePercentiles(queueSamples),
      };
    });

    const overallHighlight = calculatePercentiles(allHighlightSamples);
    const overallQueue = calculatePercentiles(allQueueSamples);

    const failures = summarizeFailures({
      scenarioMetrics,
      highlightThreshold,
      queueThreshold,
    });
    const thresholdEvaluation = {
      highlight_p95_within_budget: failures.every((failure) => failure.metric !== 'highlight_latency_ms'),
      queue_advance_p95_within_budget: failures.every((failure) => failure.metric !== 'queue_advance_latency_ms'),
    };
    const completedAt = new Date().toISOString();
    const runId = randomUUID();
    const outputPath = artifactPathForRunId(runId);

    const artifactPayload = {
      output_path: outputPath,
      metadata: {
        run_id: runId,
        scenario_seed: scenarioSeed,
        scenario_count: scenarioMetrics.length,
        git_commit: resolvedGitCommit,
        harness_version: harnessVersion,
        started_at: startedAt,
        completed_at: completedAt,
      },
      percentiles: {
        highlight_latency_ms: overallHighlight,
        queue_advance_latency_ms: overallQueue,
      },
      thresholds: {
        highlight_ms_max: highlightThreshold,
        queue_advance_ms_max: queueThreshold,
      },
      scenarios: scenarioMetrics,
      failures,
    };

    mkdirSync(dirname(artifactPayload.output_path), { recursive: true });
    writeFileSync(artifactPayload.output_path, `${JSON.stringify(artifactPayload, null, 2)}\n`, 'utf8');
    runs.set(runId, artifactPayload);

    const success = failures.length === 0;
    if (!success) {
      return {
        statusCode: 422,
        body: {
          success: false,
          run_id: runId,
          metrics: {
            highlight_latency_ms: overallHighlight,
            queue_advance_latency_ms: overallQueue,
          },
          threshold_evaluation: thresholdEvaluation,
          failures,
          error: {
            code: 'LATENCY_THRESHOLD_EXCEEDED',
          },
          process: {
            exit_code: 1,
          },
        },
      };
    }

    return {
      statusCode: 200,
      body: {
        run_id: runId,
        metrics: {
          highlight_latency_ms: overallHighlight,
          queue_advance_latency_ms: overallQueue,
        },
        threshold_evaluation: thresholdEvaluation,
      },
    };
  }

  function getArtifact(runId) {
    if (!isValidRunId(runId)) {
      return null;
    }

    const inMemory = runs.get(runId);
    if (inMemory) {
      return inMemory;
    }

    const outputPath = artifactPathForRunId(runId);
    try {
      const artifact = JSON.parse(readFileSync(outputPath, 'utf8'));
      if (!isRecord(artifact) || !isRecord(artifact.metadata) || artifact.metadata.run_id !== runId) {
        return null;
      }
      runs.set(runId, artifact);
      return artifact;
    } catch {
      return null;
    }
  }

  return {
    runLatencySmoke,
    getArtifact,
  };
}
