import { faker } from '@faker-js/faker';

type CommandActor = {
  id: string;
  role: 'ops-user' | 'service';
};

export type ApplyPreprocessingPayload = {
  session_id: string;
  document_id: string;
  page_ids: string[];
  preprocessing_profile: string;
};

export type ReprocessDocumentPayload = {
  session_id: string;
  document_id: string;
  target_state: string;
  reason: string;
};

export type PreprocessingCommandEnvelope<TPayload> = {
  command_id: string;
  type: 'ApplyPreprocessing' | 'ReprocessDocument';
  actor: CommandActor;
  timestamp: string;
  payload: TPayload;
};

type ApplyPreprocessingCommandOptions = {
  commandId?: string;
  actor?: Partial<CommandActor>;
  timestamp?: string;
  payload?: Partial<ApplyPreprocessingPayload>;
};

type ReprocessDocumentCommandOptions = {
  commandId?: string;
  actor?: Partial<CommandActor>;
  timestamp?: string;
  payload?: Partial<ReprocessDocumentPayload>;
};

function createActor(overrides: Partial<CommandActor> = {}): CommandActor {
  return {
    id: `ops-${faker.string.alphanumeric(8)}`,
    role: 'ops-user',
    ...overrides,
  };
}

export function createApplyPreprocessingCommandEnvelope(
  options: ApplyPreprocessingCommandOptions = {},
): PreprocessingCommandEnvelope<ApplyPreprocessingPayload> {
  const actor = createActor(options.actor);
  const sessionId = options.payload?.session_id ?? faker.string.uuid();
  const documentId = options.payload?.document_id ?? `${sessionId}:${faker.string.uuid()}`;

  return {
    command_id: options.commandId ?? faker.string.uuid(),
    type: 'ApplyPreprocessing',
    actor,
    timestamp: options.timestamp ?? new Date().toISOString(),
    payload: {
      session_id: sessionId,
      document_id: documentId,
      page_ids: ['page-1', 'page-2'],
      preprocessing_profile: 'ocr-enhance',
      ...options.payload,
    },
  };
}

export function createReprocessDocumentCommandEnvelope(
  options: ReprocessDocumentCommandOptions = {},
): PreprocessingCommandEnvelope<ReprocessDocumentPayload> {
  const actor = createActor(options.actor);
  const sessionId = options.payload?.session_id ?? faker.string.uuid();
  const documentId = options.payload?.document_id ?? `${sessionId}:${faker.string.uuid()}`;

  return {
    command_id: options.commandId ?? faker.string.uuid(),
    type: 'ReprocessDocument',
    actor,
    timestamp: options.timestamp ?? new Date().toISOString(),
    payload: {
      session_id: sessionId,
      document_id: documentId,
      target_state: 'reprocessed',
      reason: 'operator_requested_quality_upgrade',
      ...options.payload,
    },
  };
}
