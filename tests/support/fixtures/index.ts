import { mergeTests, test as base } from '@playwright/test';
import { test as apiRequestFixture } from '@seontechnologies/playwright-utils/api-request/fixtures';
import { test as recurseFixture } from '@seontechnologies/playwright-utils/recurse/fixtures';
import { test as logFixture } from '@seontechnologies/playwright-utils/log/fixtures';
import { test as networkErrorMonitorFixture } from '@seontechnologies/playwright-utils/network-error-monitor/fixtures';
import {
  createDocumentRecordFactory,
  createSessionFactory,
  type CleanupEntity,
  type DocumentRecord,
  type SessionRecord,
} from './factories/document-factory';

type DomainFactories = {
  createDocumentRecord: (overrides?: Partial<DocumentRecord>) => DocumentRecord;
  createSession: (overrides?: Partial<SessionRecord>) => SessionRecord;
};

type CustomFixtures = {
  cleanupEntities: CleanupEntity[];
  domainFactories: DomainFactories;
};

const customFixture = base.extend<CustomFixtures>({
  cleanupEntities: async ({}, use) => {
    const created: CleanupEntity[] = [];
    await use(created);
    created.length = 0;
  },
  domainFactories: async ({ cleanupEntities }, use) => {
    const factoryApi: DomainFactories = {
      createDocumentRecord: (overrides = {}) => {
        const record = createDocumentRecordFactory(overrides);
        cleanupEntities.push({ kind: 'document', id: record.id });
        return record;
      },
      createSession: (overrides = {}) => {
        const session = createSessionFactory(overrides);
        cleanupEntities.push({ kind: 'session', id: session.id });
        return session;
      },
    };
    await use(factoryApi);
  },
});

export const test = mergeTests(
  apiRequestFixture,
  recurseFixture,
  logFixture,
  networkErrorMonitorFixture,
  customFixture,
);

export { expect } from '@playwright/test';
