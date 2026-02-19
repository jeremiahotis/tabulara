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
    details?: Array<{
      reason?: string;
    }>;
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
  command_id?: string;
  mutation_applied?: boolean;
  event_appended?: boolean;
  session?: {
    id?: string;
  };
  documents?: Array<{
    blob_id?: string;
    document_id?: string;
    import_command_id?: string;
  }>;
  duplicate?: {
    state?: string;
    duplicate_of_document_id?: string;
    linked_import_command_id?: string;
    correlation?: {
      deterministic_key?: string;
    };
  };
  derived_artifacts?: Array<{
    source_page_id?: string;
    source_document_id?: string;
  }>;
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
  const [errorDetailLatest, setErrorDetailLatest] = useState('');
  const [importSessionId, setImportSessionId] = useState('');
  const [importBlobIds, setImportBlobIds] = useState('');
  const [importMetadataSource, setImportMetadataSource] = useState('import');
  const [importFileName, setImportFileName] = useState('');
  const [duplicateSessionId, setDuplicateSessionId] = useState('');
  const [duplicateDocumentId, setDuplicateDocumentId] = useState('');
  const [duplicateOfDocumentId, setDuplicateOfDocumentId] = useState('');
  const [duplicateSourceCommandId, setDuplicateSourceCommandId] = useState('');
  const [documentLastImportedBlobId, setDocumentLastImportedBlobId] = useState('');
  const [lastImportedDocumentIds, setLastImportedDocumentIds] = useState<string[]>([]);
  const [lastImportCommandId, setLastImportCommandId] = useState('');
  const [duplicateStateLatest, setDuplicateStateLatest] = useState('');
  const [duplicateOfDocumentIdLatest, setDuplicateOfDocumentIdLatest] = useState('');
  const [duplicateCorrelationKeyLatest, setDuplicateCorrelationKeyLatest] = useState('');
  const [duplicateLinkedImportCommandLatest, setDuplicateLinkedImportCommandLatest] = useState('');
  const [preprocessingSessionId, setPreprocessingSessionId] = useState('');
  const [preprocessingDocumentId, setPreprocessingDocumentId] = useState('');
  const [preprocessingPageIds, setPreprocessingPageIds] = useState('');
  const [preprocessingProfile, setPreprocessingProfile] = useState('ocr-enhance');
  const [reprocessSessionId, setReprocessSessionId] = useState('');
  const [reprocessDocumentId, setReprocessDocumentId] = useState('');
  const [reprocessTargetState, setReprocessTargetState] = useState('reprocessed');
  const [reprocessReason, setReprocessReason] = useState('operator_requested_quality_upgrade');
  const [derivedArtifactSourcePageLatest, setDerivedArtifactSourcePageLatest] = useState('');
  const [derivedArtifactSourceDocumentLatest, setDerivedArtifactSourceDocumentLatest] = useState('');
  const [auditHistoryPreserved, setAuditHistoryPreserved] = useState('false');
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
        setErrorDetailLatest(errorBody.error?.details?.[0]?.reason ?? '');
        const rejectedState = response.status === 400 ? 'none' : 'not-applied';
        const rejectedEventState = response.status === 400 ? 'none' : 'not-appended';
        setMutationState(errorBody.mutation_applied ? 'applied' : rejectedState);
        setEventAppendState(errorBody.event_appended ? 'appended' : rejectedEventState);
        return false;
      }

      const acceptedBody = body as DispatchAcceptedResponse;
      setErrorCode('');
      setMissingFields('');
      setErrorDetailLatest('');
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
      const importedDocumentIds = (acceptedBody.documents ?? [])
        .map((document) => document.document_id ?? '')
        .filter((documentId) => documentId.length > 0);
      if (importedDocumentIds.length > 0) {
        setLastImportedDocumentIds(importedDocumentIds);
        if (typeof acceptedBody.command_id === 'string' && acceptedBody.command_id.trim().length > 0) {
          setLastImportCommandId(acceptedBody.command_id);
        }
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

      const latestDerivedArtifact = acceptedBody.derived_artifacts?.[0];
      if (latestDerivedArtifact) {
        setDerivedArtifactSourcePageLatest(latestDerivedArtifact.source_page_id ?? '');
        setDerivedArtifactSourceDocumentLatest(latestDerivedArtifact.source_document_id ?? '');
      }

      setAuditHistoryPreserved(
        acceptedBody.audit_log && acceptedBody.audit_log.length > 1 ? 'true' : 'false',
      );

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
      const fallbackDocumentId = lastImportedDocumentIds[0] ?? `${resolvedSessionId}:doc-duplicate`;
      const fallbackDuplicateOfId =
        lastImportedDocumentIds[1] ?? lastImportedDocumentIds[0] ?? `${resolvedSessionId}:doc-original`;
      const resolvedDocumentId = duplicateDocumentId.trim() || fallbackDocumentId;
      const resolvedDuplicateOfId = duplicateOfDocumentId.trim() || fallbackDuplicateOfId;
      const [leftDocumentId, rightDocumentId] = [resolvedDocumentId, resolvedDuplicateOfId].sort();
      const resolvedSourceCommandId =
        duplicateSourceCommandId.trim() || lastImportCommandId || crypto.randomUUID();
      const duplicateEnvelope = buildCommandEnvelope('ConfirmDuplicate', {
        session_id: resolvedSessionId,
        document_id: resolvedDocumentId,
        duplicate_of_document_id: resolvedDuplicateOfId,
        correlation: {
          pair_key: `${leftDocumentId}::${rightDocumentId}`,
          deterministic_key: `${resolvedSessionId}:${leftDocumentId}:${rightDocumentId}`,
          source_import_command_id: resolvedSourceCommandId,
          detector: 'hash',
        },
      });
      const duplicateResult = await dispatchCommand(duplicateEnvelope);
      applyDispatchResult(duplicateResult.response, duplicateResult.body);
      return;
    }

    if (normalizedType === 'ApplyPreprocessing') {
      const resolvedSessionId =
        preprocessingSessionId.trim() || importSessionId.trim() || lastSessionId || `session-${crypto.randomUUID()}`;
      const resolvedDocumentId =
        preprocessingDocumentId.trim() || lastImportedDocumentIds[0] || `${resolvedSessionId}:doc-001`;
      const resolvedPageIds = normalizeBlobIds(preprocessingPageIds);
      const preprocessingEnvelope = buildCommandEnvelope('ApplyPreprocessing', {
        session_id: resolvedSessionId,
        document_id: resolvedDocumentId,
        page_ids: resolvedPageIds,
        preprocessing_profile: preprocessingProfile.trim() || 'ocr-enhance',
      });
      const preprocessingResult = await dispatchCommand(preprocessingEnvelope);
      applyDispatchResult(preprocessingResult.response, preprocessingResult.body);
      return;
    }

    if (normalizedType === 'ReprocessDocument') {
      const resolvedSessionId =
        reprocessSessionId.trim() || preprocessingSessionId.trim() || importSessionId.trim() || lastSessionId || `session-${crypto.randomUUID()}`;
      const resolvedDocumentId =
        reprocessDocumentId.trim() ||
        preprocessingDocumentId.trim() ||
        lastImportedDocumentIds[0] ||
        `${resolvedSessionId}:doc-001`;
      const reprocessEnvelope = buildCommandEnvelope('ReprocessDocument', {
        session_id: resolvedSessionId,
        document_id: resolvedDocumentId,
        target_state: reprocessTargetState.trim() || 'reprocessed',
        reason: reprocessReason.trim() || 'operator_requested_quality_upgrade',
      });
      const reprocessResult = await dispatchCommand(reprocessEnvelope);
      applyDispatchResult(reprocessResult.response, reprocessResult.body);
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
    lastImportCommandId,
    lastImportedDocumentIds,
    lastSessionId,
    preprocessingDocumentId,
    preprocessingPageIds,
    preprocessingProfile,
    preprocessingSessionId,
    reprocessDocumentId,
    reprocessReason,
    reprocessSessionId,
    reprocessTargetState,
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

      <label htmlFor="preprocessingSessionId">Preprocessing session ID</label>
      <input
        id="preprocessingSessionId"
        data-testid="preprocessing-session-id-input"
        placeholder="session-preprocess-001"
        value={preprocessingSessionId}
        onChange={(event) => setPreprocessingSessionId(event.target.value)}
      />

      <label htmlFor="preprocessingDocumentId">Preprocessing document ID</label>
      <input
        id="preprocessingDocumentId"
        data-testid="preprocessing-document-id-input"
        placeholder="session-preprocess-001:blob-preprocess-001"
        value={preprocessingDocumentId}
        onChange={(event) => setPreprocessingDocumentId(event.target.value)}
      />

      <label htmlFor="preprocessingPageIds">Preprocessing page IDs (comma-separated)</label>
      <input
        id="preprocessingPageIds"
        data-testid="preprocessing-page-ids-input"
        placeholder="page-1,page-2"
        value={preprocessingPageIds}
        onChange={(event) => setPreprocessingPageIds(event.target.value)}
      />

      <label htmlFor="preprocessingProfile">Preprocessing profile</label>
      <input
        id="preprocessingProfile"
        data-testid="preprocessing-profile-input"
        placeholder="ocr-enhance"
        value={preprocessingProfile}
        onChange={(event) => setPreprocessingProfile(event.target.value)}
      />

      <label htmlFor="reprocessSessionId">Reprocess session ID</label>
      <input
        id="reprocessSessionId"
        data-testid="reprocess-session-id-input"
        placeholder="session-reprocess-001"
        value={reprocessSessionId}
        onChange={(event) => setReprocessSessionId(event.target.value)}
      />

      <label htmlFor="reprocessDocumentId">Reprocess document ID</label>
      <input
        id="reprocessDocumentId"
        data-testid="reprocess-document-id-input"
        placeholder="session-reprocess-001:blob-reprocess-001"
        value={reprocessDocumentId}
        onChange={(event) => setReprocessDocumentId(event.target.value)}
      />

      <label htmlFor="reprocessTargetState">Reprocess target state</label>
      <input
        id="reprocessTargetState"
        data-testid="reprocess-target-state-input"
        placeholder="reprocessed"
        value={reprocessTargetState}
        onChange={(event) => setReprocessTargetState(event.target.value)}
      />

      <label htmlFor="reprocessReason">Reprocess reason</label>
      <input
        id="reprocessReason"
        data-testid="reprocess-reason-input"
        placeholder="operator_requested_quality_upgrade"
        value={reprocessReason}
        onChange={(event) => setReprocessReason(event.target.value)}
      />

      <p className="row">
        Error code: <span data-testid="command-error-code">{errorCode}</span>
      </p>
      <p className="row">
        Error detail latest: <span data-testid="command-error-detail-latest">{errorDetailLatest}</span>
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
        Derived artifact source page:{' '}
        <span data-testid="derived-artifact-source-page-latest">{derivedArtifactSourcePageLatest}</span>
      </p>
      <p className="row">
        Derived artifact source document:{' '}
        <span data-testid="derived-artifact-source-document-latest">{derivedArtifactSourceDocumentLatest}</span>
      </p>
      <p className="row">
        Audit history preserved: <span data-testid="audit-history-preserved">{auditHistoryPreserved}</span>
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
