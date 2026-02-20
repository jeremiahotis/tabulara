import { faker } from '@faker-js/faker';

type CommandActor = {
  id: string;
  role: 'ops-user' | 'service';
};

export type ImportDocumentPayload = {
  session_id: string;
  blob_ids: string[];
  metadata: {
    source: 'import';
    file_name: string;
    mime_type: string;
    file_hash: string;
  };
};

export type ConfirmDuplicatePayload = {
  session_id: string;
  document_id: string;
  duplicate_of_document_id: string;
  correlation: {
    pair_key: string;
    deterministic_key: string;
    source_import_command_id: string;
    detector: 'hash' | 'operator';
  };
};

export type DocumentImportCommandEnvelope<TPayload> = {
  command_id: string;
  type: 'ImportDocument' | 'ConfirmDuplicate';
  actor: CommandActor;
  timestamp: string;
  payload: TPayload;
};

type ImportDocumentCommandOptions = {
  commandId?: string;
  actor?: Partial<CommandActor>;
  timestamp?: string;
  payload?: Partial<ImportDocumentPayload>;
};

type ConfirmDuplicateCommandOptions = {
  commandId?: string;
  actor?: Partial<CommandActor>;
  timestamp?: string;
  payload?: Partial<ConfirmDuplicatePayload>;
};

function createActor(overrides: Partial<CommandActor> = {}): CommandActor {
  return {
    id: `ops-${faker.string.alphanumeric(8)}`,
    role: 'ops-user',
    ...overrides,
  };
}

export function createImportDocumentCommandEnvelope(
  options: ImportDocumentCommandOptions = {},
): DocumentImportCommandEnvelope<ImportDocumentPayload> {
  const actor = createActor(options.actor);
  const sessionId = options.payload?.session_id ?? faker.string.uuid();
  const blobIds = options.payload?.blob_ids ?? [faker.string.uuid(), faker.string.uuid()];

  return {
    command_id: options.commandId ?? faker.string.uuid(),
    type: 'ImportDocument',
    actor,
    timestamp: options.timestamp ?? new Date().toISOString(),
    payload: {
      session_id: sessionId,
      blob_ids: blobIds,
      metadata: {
        source: 'import',
        file_name: 'invoice-001.pdf',
        mime_type: 'application/pdf',
        file_hash: faker.string.hexadecimal({ length: 64, prefix: '' }),
        ...options.payload?.metadata,
      },
    },
  };
}

export function createConfirmDuplicateCommandEnvelope(
  options: ConfirmDuplicateCommandOptions = {},
): DocumentImportCommandEnvelope<ConfirmDuplicatePayload> {
  const actor = createActor(options.actor);
  const sessionId = options.payload?.session_id ?? faker.string.uuid();
  const documentId = options.payload?.document_id ?? faker.string.uuid();
  const duplicateOfDocumentId = options.payload?.duplicate_of_document_id ?? faker.string.uuid();
  const [leftDocumentId, rightDocumentId] = [documentId, duplicateOfDocumentId].sort();

  return {
    command_id: options.commandId ?? faker.string.uuid(),
    type: 'ConfirmDuplicate',
    actor,
    timestamp: options.timestamp ?? new Date().toISOString(),
    payload: {
      session_id: sessionId,
      document_id: documentId,
      duplicate_of_document_id: duplicateOfDocumentId,
      correlation: {
        pair_key: `${leftDocumentId}::${rightDocumentId}`,
        deterministic_key: `${sessionId}:${leftDocumentId}:${rightDocumentId}`,
        source_import_command_id: faker.string.uuid(),
        detector: 'hash',
        ...options.payload?.correlation,
      },
      ...options.payload,
    },
  };
}
