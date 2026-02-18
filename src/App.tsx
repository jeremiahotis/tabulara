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
};

export function App() {
  const [backendHealth, setBackendHealth] = useState('pending');
  const [apiBadge, setApiBadge] = useState('/api/v1');
  const [commandType, setCommandType] = useState('');
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

  const submitCommand = useCallback(async () => {
    const response = await fetch('/api/v1/commands/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: commandType.trim() || undefined }),
    });

    if (!response.ok) {
      const body = (await response.json()) as DispatchErrorResponse;
      setErrorCode(body.error?.code ?? '');
      setMissingFields((body.error?.missing_fields ?? []).join(', '));
      setMutationState(body.mutation_applied ? 'applied' : 'none');
      setEventAppendState(body.event_appended ? 'appended' : 'none');
      return;
    }

    const body = (await response.json()) as DispatchAcceptedResponse;
    setErrorCode('');
    setMissingFields('');
    setMutationState(body.mutation_applied ? 'applied' : 'none');
    setEventAppendState(body.event_appended ? 'appended' : 'none');
  }, [commandType]);

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
        placeholder="session.initialize"
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
