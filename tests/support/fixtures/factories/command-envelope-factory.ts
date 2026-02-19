import { faker } from '@faker-js/faker';

export type CommandEnvelope = {
  command_id: string;
  type: string;
  actor: {
    id: string;
    role: 'ops-user' | 'service';
  };
  timestamp: string;
  payload: Record<string, unknown>;
};

export function createCommandEnvelope(overrides: Partial<CommandEnvelope> = {}): CommandEnvelope {
  return {
    command_id: faker.string.uuid(),
    type: 'CreateSession',
    actor: {
      id: `ops-${faker.string.alphanumeric(8)}`,
      role: 'ops-user',
    },
    timestamp: new Date().toISOString(),
    payload: {
      project_id: faker.string.uuid(),
      schema_id: faker.string.uuid(),
    },
    ...overrides,
  };
}
