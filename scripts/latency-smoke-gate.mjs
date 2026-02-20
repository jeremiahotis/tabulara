#!/usr/bin/env node

import { createLatencySmokeHarness } from './latency-smoke-harness.mjs';

const harness = createLatencySmokeHarness();

const payload = {
  scenario_seed: 'latency-budget-smoke-v1',
  scenarios: [
    {
      id: 'baseline-happy-path',
      workflow: 'verification-evidence-highlight',
      queueDepth: 4,
    },
    {
      id: 'queue-pressure-path',
      workflow: 'verification-queue-advance',
      queueDepth: 20,
    },
  ],
  thresholds: {
    highlight_ms_max: 100,
    queue_advance_ms_max: 150,
  },
};

const result = harness.runLatencySmoke(payload);
process.stdout.write(`${JSON.stringify(result.body, null, 2)}\n`);
process.exit(result.statusCode === 200 ? 0 : 1);
