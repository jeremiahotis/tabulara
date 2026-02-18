import { faker } from '@faker-js/faker';

type CommandActor = {
  id: string;
  role: 'ops-user' | 'service';
};

export type CreateSessionPayload = {
  project_id: string;
  schema_id: string;
  source: 'manual' | 'anchor' | 'zone';
};

export type PinSessionPayload = {
  session_id: string;
  pinned: boolean;
};

export type SessionCommandEnvelope<TPayload> = {
  command_id: string;
  type: 'CreateSession' | 'PinSession';
  actor: CommandActor;
  timestamp: string;
  payload: TPayload;
};

type CreateSessionCommandOptions = {
  commandId?: string;
  actor?: Partial<CommandActor>;
  timestamp?: string;
  payload?: Partial<CreateSessionPayload>;
};

type PinSessionCommandOptions = {
  commandId?: string;
  actor?: Partial<CommandActor>;
  timestamp?: string;
  payload?: Partial<PinSessionPayload>;
};

function createActor(overrides: Partial<CommandActor> = {}): CommandActor {
  return {
    id: `ops-${faker.string.alphanumeric(8)}`,
    role: 'ops-user',
    ...overrides,
  };
}

export function createCreateSessionCommandEnvelope(
  options: CreateSessionCommandOptions = {},
): SessionCommandEnvelope<CreateSessionPayload> {
  const actor = createActor(options.actor);

  return {
    command_id: options.commandId ?? faker.string.uuid(),
    type: 'CreateSession',
    actor,
    timestamp: options.timestamp ?? new Date().toISOString(),
    payload: {
      project_id: faker.string.uuid(),
      schema_id: faker.string.uuid(),
      source: 'manual',
      ...options.payload,
    },
  };
}

export function createPinSessionCommandEnvelope(
  options: PinSessionCommandOptions = {},
): SessionCommandEnvelope<PinSessionPayload> {
  const actor = createActor(options.actor);

  return {
    command_id: options.commandId ?? faker.string.uuid(),
    type: 'PinSession',
    actor,
    timestamp: options.timestamp ?? new Date().toISOString(),
    payload: {
      session_id: faker.string.uuid(),
      pinned: true,
      ...options.payload,
    },
  };
}
