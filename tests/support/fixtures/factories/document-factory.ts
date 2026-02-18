import { faker } from '@faker-js/faker';

export type DocumentRecord = {
  id: string;
  documentId: string;
  fieldKey: string;
  rawValue: string;
  normalizedValue: string;
  confidence: number;
  state: 'open' | 'resolved' | 'locked';
};

export type SessionRecord = {
  id: string;
  status: 'created' | 'processing' | 'review' | 'validated';
  unresolvedCount: number;
};

export type CleanupEntity = {
  kind: 'document' | 'session';
  id: string;
};

export function createDocumentRecordFactory(overrides: Partial<DocumentRecord> = {}): DocumentRecord {
  return {
    id: faker.string.uuid(),
    documentId: faker.string.uuid(),
    fieldKey: 'total_amount',
    rawValue: '$42.00',
    normalizedValue: '42.00',
    confidence: 0.98,
    state: 'open',
    ...overrides,
  };
}

export function createSessionFactory(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: faker.string.uuid(),
    status: 'review',
    unresolvedCount: 1,
    ...overrides,
  };
}
