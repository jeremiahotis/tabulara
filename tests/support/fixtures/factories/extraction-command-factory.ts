import { faker } from '@faker-js/faker';

type CommandActor = {
  id: string;
  role: 'ops-user' | 'service';
};

export type RunExtractionPayload = {
  session_id: string;
  document_id: string;
  extraction_profile: string;
  source_state: string;
  force_fail_stage?: string;
};

export type ExtractionCommandEnvelope<TPayload> = {
  command_id: string;
  type: 'RunExtraction';
  actor: CommandActor;
  timestamp: string;
  payload: TPayload;
};

type RunExtractionCommandOptions = {
  commandId?: string;
  actor?: Partial<CommandActor>;
  timestamp?: string;
  payload?: Partial<RunExtractionPayload>;
};

function createActor(overrides: Partial<CommandActor> = {}): CommandActor {
  return {
    id: `ops-${faker.string.alphanumeric(8)}`,
    role: 'ops-user',
    ...overrides,
  };
}

export function createRunExtractionCommandEnvelope(
  options: RunExtractionCommandOptions = {},
): ExtractionCommandEnvelope<RunExtractionPayload> {
  const actor = createActor(options.actor);
  const sessionId = options.payload?.session_id ?? faker.string.uuid();
  const documentId = options.payload?.document_id ?? `${sessionId}:${faker.string.uuid()}`;

  return {
    command_id: options.commandId ?? faker.string.uuid(),
    type: 'RunExtraction',
    actor,
    timestamp: options.timestamp ?? new Date().toISOString(),
    payload: {
      session_id: sessionId,
      document_id: documentId,
      extraction_profile: 'operations-default',
      source_state: 'preprocess-ready',
      ...options.payload,
    },
  };
}
