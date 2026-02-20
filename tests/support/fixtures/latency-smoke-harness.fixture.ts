import { test as base } from '@playwright/test';
import { story20aRedPhaseData } from './story-2-0a-red-phase-data';

type LatencyHarnessFixture = {
  latencyHarnessInput: {
    seed: string;
    thresholds: {
      highlightP95MsMax: number;
      queueAdvanceP95MsMax: number;
    };
  };
};

export const test = base.extend<LatencyHarnessFixture>({
  latencyHarnessInput: async ({}, use) => {
    await use({
      seed: story20aRedPhaseData.scenarioSeed,
      thresholds: story20aRedPhaseData.thresholds,
    });
  },
});

export { expect } from '@playwright/test';
