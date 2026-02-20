export const story20aRedPhaseData = {
  thresholds: {
    highlightP95MsMax: 100,
    queueAdvanceP95MsMax: 150,
  },
  scenarioSeed: 'latency-budget-smoke-v1',
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
};

export const story20aExpectedErrorCodes = {
  thresholdExceeded: 'LATENCY_THRESHOLD_EXCEEDED',
  malformedScenarioSet: 'LATENCY_SCENARIO_SET_INVALID',
};
