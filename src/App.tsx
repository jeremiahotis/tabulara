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

type DispatchAcceptedResponse = {
  accepted: boolean;
  mutation_applied?: boolean;
  event_appended?: boolean;
  session?: {
    id?: string;
  };
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

export function App() {
  const [backendHealth, setBackendHealth] = useState('pending');
  const [apiBadge, setApiBadge] = useState('/api/v1');
  const [commandType, setCommandType] = useState('');
  const [lastSessionId, setLastSessionId] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [missingFields, setMissingFields] = useState('');
  const [mutationState, setMutationState] = useState('none');
  const [eventAppendState, setEventAppendState] = useState('none');

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

    const unsupportedEnvelope = buildCommandEnvelope(normalizedType, {});
    const unsupportedResult = await dispatchCommand(unsupportedEnvelope);
    applyDispatchResult(unsupportedResult.response, unsupportedResult.body);
  }, [applyDispatchResult, buildCommandEnvelope, commandType, dispatchCommand, lastSessionId]);

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
    </main>
  );
}
