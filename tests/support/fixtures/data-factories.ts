import { faker } from '@faker-js/faker';

export type EnvelopeActor = {
  id: string;
  role: 'ops-user' | 'service';
};

export type EnvelopePayload = {
  document_path: string;
  correlation_id: string;
};

export function createEnvelopeActor(overrides: Partial<EnvelopeActor> = {}): EnvelopeActor {
  return {
    id: `ops-${faker.string.alphanumeric(8)}`,
    role: 'ops-user',
    ...overrides,
  };
}

export function createEnvelopePayload(overrides: Partial<EnvelopePayload> = {}): EnvelopePayload {
  return {
    document_path: '/tmp/demo.pdf',
    correlation_id: faker.string.uuid(),
    ...overrides,
  };
}
