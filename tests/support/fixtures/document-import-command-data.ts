export const story13RequiredTestIds = [
  'command-type-input',
  'command-submit-button',
  'import-session-id-input',
  'import-blob-ids-input',
  'import-metadata-source-input',
  'import-file-name-input',
  'document-last-imported-blob-id',
  'duplicate-session-id-input',
  'duplicate-document-id-input',
  'duplicate-of-document-id-input',
  'duplicate-source-command-id-input',
  'duplicate-state-latest',
  'duplicate-of-document-id-latest',
  'duplicate-correlation-key-latest',
  'duplicate-linked-import-command-latest',
  'audit-event-type-latest',
  'audit-event-caused-by-latest',
  'mutation-state',
  'event-append-state',
] as const;

export const story13DeterministicCorrelationShape = {
  pair_key: 'doc-duplicate::doc-original',
  deterministic_key: 'session-id:doc-duplicate:doc-original',
  source_import_command_id: 'command-id',
} as const;
