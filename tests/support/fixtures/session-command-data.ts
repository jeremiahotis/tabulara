export const sessionCommandDefaults = {
  createSessionPayload: {
    source: 'manual',
  },
  pinSessionPayload: {
    pinned: true,
  },
  unpinSessionPayload: {
    pinned: false,
  },
} as const;

export const sessionCommandRequiredTestIds = [
  'project-id-input',
  'schema-id-input',
  'session-list-item-latest',
  'session-status-latest',
  'session-pin-toggle',
  'session-pinned-indicator',
  'audit-event-type-latest',
  'audit-event-caused-by-latest',
  'transaction-status-latest',
] as const;
