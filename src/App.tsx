import { useCallback, useEffect, useState } from 'react';

type HealthResponse = {
  status: string;
  services?: {
    frontend?: string;
    backend?: string;
  };
  apiVersion?: string;
};

type DispatchErrorResponse = {
  error?: {
    code?: string;
    missing_fields?: string[];
  };
  mutation_applied?: boolean;
  event_appended?: boolean;
};

type DispatchEvent = {
  type?: string;
  caused_by?: string;
};

type DispatchAcceptedResponse = {
  accepted: boolean;
  mutation_applied?: boolean;
  event_appended?: boolean;
  session?: {
    id?: string;
  };
  documents?: Array<{
    blob_id?: string;
  }>;
  duplicate?: {
    state?: string;
    duplicate_of_document_id?: string;
    linked_import_command_id?: string;
    correlation?: {
      deterministic_key?: string;
    };
  };
  events?: DispatchEvent[];
  audit_log?: DispatchEvent[];
};

type CommandEnvelope = {
  command_id: string;
  type: string;
  actor: {
    id: string;
    role: 'ops-user';
  };
  timestamp: string;
  payload: Record<string, unknown>;
};

function inferMimeType(fileName: string): string {
  const normalized = fileName.trim().toLowerCase();
  if (normalized.endsWith('.pdf')) {
    return 'application/pdf';
  }
  if (normalized.endsWith('.png')) {
    return 'image/png';
  }
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (normalized.endsWith('.tif') || normalized.endsWith('.tiff')) {
    return 'image/tiff';
  }
  return 'application/octet-stream';
}

function normalizeBlobIds(blobIdsInput: string): string[] {
  const parsed = blobIdsInput
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return parsed.length > 0 ? parsed : ['blob-default'];
}

export function App() {
  const [backendHealth, setBackendHealth] = useState('pending');
  const [apiBadge, setApiBadge] = useState('/api/v1');
  const [commandType, setCommandType] = useState('');
  const [lastSessionId, setLastSessionId] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [missingFields, setMissingFields] = useState('');
  const [mutationState, setMutationState] = useState('none');
  const [eventAppendState, setEventAppendState] = useState('none');
  const [importSessionId, setImportSessionId] = useState('');
  const [importBlobIds, setImportBlobIds] = useState('');
  const [importMetadataSource, setImportMetadataSource] = useState('import');
  const [importFileName, setImportFileName] = useState('');
  const [duplicateSessionId, setDuplicateSessionId] = useState('');
  const [duplicateDocumentId, setDuplicateDocumentId] = useState('');
  const [duplicateOfDocumentId, setDuplicateOfDocumentId] = useState('');
  const [duplicateSourceCommandId, setDuplicateSourceCommandId] = useState('');
  const [documentLastImportedBlobId, setDocumentLastImportedBlobId] = useState('');
  const [duplicateStateLatest, setDuplicateStateLatest] = useState('');
  const [duplicateOfDocumentIdLatest, setDuplicateOfDocumentIdLatest] = useState('');
  const [duplicateCorrelationKeyLatest, setDuplicateCorrelationKeyLatest] = useState('');
  const [duplicateLinkedImportCommandLatest, setDuplicateLinkedImportCommandLatest] = useState('');
  const [auditEventTypeLatest, setAuditEventTypeLatest] = useState('');
  const [auditEventCausedByLatest, setAuditEventCausedByLatest] = useState('');

  const loadHealth = useCallback(async () => {
    const response = await fetch('/api/v1/health');
    const body = (await response.json()) as HealthResponse;
    setBackendHealth(body.services?.backend ?? 'down');
    setApiBadge(`/api/${body.apiVersion ?? 'v1'}`);
  }, []);

  useEffect(() => {
    loadHealth().catch(() => {
      setBackendHealth('down');
    });
  }, [loadHealth]);

  const buildCommandEnvelope = useCallback(
    (type: string, payload: Record<string, unknown>): CommandEnvelope => ({
      command_id: crypto.randomUUID(),
      type,
      actor: {
        id: 'ops-ui-user',
        role: 'ops-user',
      },
      timestamp: new Date().toISOString(),
      payload,
    }),
    [],
  );

  const dispatchCommand = useCallback(async (body: unknown) => {
    const response = await fetch('/api/v1/commands/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const parsedBody = (await response.json()) as DispatchAcceptedResponse | DispatchErrorResponse;

    return {
      response,
      body: parsedBody,
    };
  }, []);

  const applyDispatchResult = useCallback(
    (response: Response, body: DispatchAcceptedResponse | DispatchErrorResponse) => {
      if (!response.ok) {
        const errorBody = body as DispatchErrorResponse;
        setErrorCode(errorBody.error?.code ?? '');
        setMissingFields((errorBody.error?.missing_fields ?? []).join(', '));
        setMutationState(errorBody.mutation_applied ? 'applied' : 'none');
        setEventAppendState(errorBody.event_appended ? 'appended' : 'none');
        return false;
      }

      const acceptedBody = body as DispatchAcceptedResponse;
      setErrorCode('');
      setMissingFields('');
      setMutationState(acceptedBody.mutation_applied ? 'applied' : 'none');
      setEventAppendState(acceptedBody.event_appended ? 'appended' : 'none');

      const returnedSessionId = acceptedBody.session?.id;
      if (typeof returnedSessionId === 'string' && returnedSessionId.trim().length > 0) {
        setLastSessionId(returnedSessionId);
      }

      const latestEvent =
        acceptedBody.events?.[acceptedBody.events.length - 1] ??
        acceptedBody.audit_log?.[acceptedBody.audit_log.length - 1];

      if (latestEvent) {
        setAuditEventTypeLatest(latestEvent.type ?? '');
        setAuditEventCausedByLatest(latestEvent.caused_by ?? '');
      }

      const latestImportedDocument = acceptedBody.documents?.[0];
      if (latestImportedDocument?.blob_id) {
        setDocumentLastImportedBlobId(latestImportedDocument.blob_id);
      }

      if (acceptedBody.duplicate) {
        setDuplicateStateLatest(acceptedBody.duplicate.state ?? '');
        setDuplicateOfDocumentIdLatest(acceptedBody.duplicate.duplicate_of_document_id ?? '');
        setDuplicateCorrelationKeyLatest(
          acceptedBody.duplicate.correlation?.deterministic_key ?? '',
        );
        setDuplicateLinkedImportCommandLatest(
          acceptedBody.duplicate.linked_import_command_id ?? '',
        );
      }

      return true;
    },
    [],
  );

  const submitCommand = useCallback(async () => {
    const normalizedType = commandType.trim();

    if (normalizedType.length === 0) {
      const { response, body } = await dispatchCommand({});
      applyDispatchResult(response, body);
      return;
    }

    if (normalizedType === 'PinSession') {
      let resolvedSessionId = lastSessionId;

      if (!resolvedSessionId) {
        const createBootstrapEnvelope = buildCommandEnvelope('CreateSession', {
          project_id: 'project-ui',
          schema_id: 'schema-ui',
        });
        const createBootstrapResult = await dispatchCommand(createBootstrapEnvelope);
        const bootstrapSucceeded = applyDispatchResult(
          createBootstrapResult.response,
          createBootstrapResult.body,
        );

        if (!bootstrapSucceeded) {
          return;
        }

        const bootstrapSessionId = (createBootstrapResult.body as DispatchAcceptedResponse).session?.id;
        if (!bootstrapSessionId || bootstrapSessionId.trim().length === 0) {
          setErrorCode('PRECONDITION_FAILED');
          setMissingFields('session_id');
          setMutationState('none');
          setEventAppendState('none');
          return;
        }

        resolvedSessionId = bootstrapSessionId;
      }

      const pinEnvelope = buildCommandEnvelope('PinSession', {
        session_id: resolvedSessionId,
        pinned: true,
      });
      const pinResult = await dispatchCommand(pinEnvelope);
      applyDispatchResult(pinResult.response, pinResult.body);
      return;
    }

    if (normalizedType === 'CreateSession') {
      const createEnvelope = buildCommandEnvelope('CreateSession', {
        project_id: 'project-ui',
        schema_id: 'schema-ui',
      });
      const createResult = await dispatchCommand(createEnvelope);
      applyDispatchResult(createResult.response, createResult.body);
      return;
    }

    if (normalizedType === 'ImportDocument') {
      const resolvedSessionId = importSessionId.trim() || lastSessionId || `session-${crypto.randomUUID()}`;
      const resolvedFileName = importFileName.trim() || 'document.pdf';
      const resolvedBlobIds = normalizeBlobIds(importBlobIds);
      const importEnvelope = buildCommandEnvelope('ImportDocument', {
        session_id: resolvedSessionId,
        blob_ids: resolvedBlobIds,
        metadata: {
          source: importMetadataSource.trim() || 'import',
          file_name: resolvedFileName,
          mime_type: inferMimeType(resolvedFileName),
          file_hash: '0'.repeat(64),
        },
      });
      const importResult = await dispatchCommand(importEnvelope);
      applyDispatchResult(importResult.response, importResult.body);
      return;
    }

    if (normalizedType === 'ConfirmDuplicate') {
      const resolvedSessionId = duplicateSessionId.trim() || lastSessionId || `session-${crypto.randomUUID()}`;
      const resolvedDocumentId = duplicateDocumentId.trim() || 'doc-duplicate';
      const resolvedDuplicateOfId = duplicateOfDocumentId.trim() || 'doc-original';
      const resolvedSourceCommandId = duplicateSourceCommandId.trim() || crypto.randomUUID();
      const duplicateEnvelope = buildCommandEnvelope('ConfirmDuplicate', {
        session_id: resolvedSessionId,
        document_id: resolvedDocumentId,
        duplicate_of_document_id: resolvedDuplicateOfId,
        correlation: {
          pair_key: [resolvedDocumentId, resolvedDuplicateOfId].sort().join('::'),
          deterministic_key: `${resolvedSessionId}:${resolvedDocumentId}:${resolvedDuplicateOfId}`,
          source_import_command_id: resolvedSourceCommandId,
          detector: 'hash',
        },
      });
      const duplicateResult = await dispatchCommand(duplicateEnvelope);
      applyDispatchResult(duplicateResult.response, duplicateResult.body);
      return;
    }

    const unsupportedEnvelope = buildCommandEnvelope(normalizedType, {});
    const unsupportedResult = await dispatchCommand(unsupportedEnvelope);
    applyDispatchResult(unsupportedResult.response, unsupportedResult.body);
  }, [
    applyDispatchResult,
    buildCommandEnvelope,
    commandType,
    dispatchCommand,
    duplicateDocumentId,
    duplicateOfDocumentId,
    duplicateSessionId,
    duplicateSourceCommandId,
    importBlobIds,
    importFileName,
    importMetadataSource,
    importSessionId,
    lastSessionId,
  ]);

  return (
    <main className="shell">
      <h1>Tabulara Starter Shell</h1>
      <p className="row">
        Shell: <span data-testid="app-shell-ready">ready</span>
      </p>
      <p className="row">
        Frontend: <span data-testid="frontend-health-status">up</span>
      </p>
      <p className="row">
        Backend: <span data-testid="backend-health-status">{backendHealth}</span>
      </p>
      <p className="row">
        API: <span data-testid="api-version-badge">{apiBadge}</span>
      </p>

      <hr />

      <label htmlFor="commandType">Command type</label>
      <input
        id="commandType"
        data-testid="command-type-input"
        placeholder="CreateSession"
        value={commandType}
        onChange={(event) => setCommandType(event.target.value)}
      />
      <button data-testid="command-submit-button" type="button" onClick={submitCommand}>
        Submit Command
      </button>

      <hr />

      <label htmlFor="importSessionId">Import session ID</label>
      <input
        id="importSessionId"
        data-testid="import-session-id-input"
        placeholder="session-import-001"
        value={importSessionId}
        onChange={(event) => setImportSessionId(event.target.value)}
      />

      <label htmlFor="importBlobIds">Import blob IDs (comma-separated)</label>
      <input
        id="importBlobIds"
        data-testid="import-blob-ids-input"
        placeholder="blob-import-001,blob-import-002"
        value={importBlobIds}
        onChange={(event) => setImportBlobIds(event.target.value)}
      />

      <label htmlFor="importMetadataSource">Import metadata source</label>
      <input
        id="importMetadataSource"
        data-testid="import-metadata-source-input"
        placeholder="import"
        value={importMetadataSource}
        onChange={(event) => setImportMetadataSource(event.target.value)}
      />

      <label htmlFor="importFileName">Import file name</label>
      <input
        id="importFileName"
        data-testid="import-file-name-input"
        placeholder="invoice-001.pdf"
        value={importFileName}
        onChange={(event) => setImportFileName(event.target.value)}
      />

      <label htmlFor="duplicateSessionId">Duplicate session ID</label>
      <input
        id="duplicateSessionId"
        data-testid="duplicate-session-id-input"
        placeholder="session-import-001"
        value={duplicateSessionId}
        onChange={(event) => setDuplicateSessionId(event.target.value)}
      />

      <label htmlFor="duplicateDocumentId">Duplicate document ID</label>
      <input
        id="duplicateDocumentId"
        data-testid="duplicate-document-id-input"
        placeholder="doc-duplicate-001"
        value={duplicateDocumentId}
        onChange={(event) => setDuplicateDocumentId(event.target.value)}
      />

      <label htmlFor="duplicateOfDocumentId">Duplicate-of document ID</label>
      <input
        id="duplicateOfDocumentId"
        data-testid="duplicate-of-document-id-input"
        placeholder="doc-original-001"
        value={duplicateOfDocumentId}
        onChange={(event) => setDuplicateOfDocumentId(event.target.value)}
      />

      <label htmlFor="duplicateSourceCommandId">Duplicate source import command ID</label>
      <input
        id="duplicateSourceCommandId"
        data-testid="duplicate-source-command-id-input"
        placeholder="cmd-import-001"
        value={duplicateSourceCommandId}
        onChange={(event) => setDuplicateSourceCommandId(event.target.value)}
      />

      <p className="row">
        Error code: <span data-testid="command-error-code">{errorCode}</span>
      </p>
      <p className="row">
        Missing fields: <span data-testid="command-error-missing-fields">{missingFields}</span>
      </p>
      <p className="row">
        Mutation: <span data-testid="mutation-state">{mutationState}</span>
      </p>
      <p className="row">
        Event append: <span data-testid="event-append-state">{eventAppendState}</span>
      </p>
      <p className="row">
        Last imported blob: <span data-testid="document-last-imported-blob-id">{documentLastImportedBlobId}</span>
      </p>
      <p className="row">
        Duplicate state: <span data-testid="duplicate-state-latest">{duplicateStateLatest}</span>
      </p>
      <p className="row">
        Duplicate-of document: <span data-testid="duplicate-of-document-id-latest">{duplicateOfDocumentIdLatest}</span>
      </p>
      <p className="row">
        Duplicate correlation key: <span data-testid="duplicate-correlation-key-latest">{duplicateCorrelationKeyLatest}</span>
      </p>
      <p className="row">
        Duplicate linked import command:{' '}
        <span data-testid="duplicate-linked-import-command-latest">{duplicateLinkedImportCommandLatest}</span>
      </p>
      <p className="row">
        Latest audit event: <span data-testid="audit-event-type-latest">{auditEventTypeLatest}</span>
      </p>
      <p className="row">
        Latest audit caused_by:{' '}
        <span data-testid="audit-event-caused-by-latest">{auditEventCausedByLatest}</span>
      </p>
    </main>
  );
}
