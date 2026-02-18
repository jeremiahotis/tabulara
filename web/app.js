const backendHealthStatus = document.querySelector('[data-testid="backend-health-status"]');
const commandTypeInput = document.querySelector('[data-testid="command-type-input"]');
const submitButton = document.querySelector('[data-testid="command-submit-button"]');
const errorCode = document.querySelector('[data-testid="command-error-code"]');
const missingFields = document.querySelector('[data-testid="command-error-missing-fields"]');
const mutationState = document.querySelector('[data-testid="mutation-state"]');
const eventAppendState = document.querySelector('[data-testid="event-append-state"]');

async function loadHealth() {
  const response = await fetch('/api/v1/health');
  const body = await response.json();
  backendHealthStatus.textContent = body.services?.backend ?? 'down';
}

submitButton.addEventListener('click', async () => {
  const response = await fetch('/api/v1/commands/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: commandTypeInput.value.trim() || undefined }),
  });

  const body = await response.json();

  if (!response.ok) {
    errorCode.textContent = body.error?.code ?? '';
    missingFields.textContent = (body.error?.missing_fields ?? []).join(', ');
    mutationState.textContent = body.mutation_applied ? 'applied' : 'none';
    eventAppendState.textContent = body.event_appended ? 'appended' : 'none';
    return;
  }

  errorCode.textContent = '';
  missingFields.textContent = '';
  mutationState.textContent = 'applied';
  eventAppendState.textContent = 'appended';
});

loadHealth().catch(() => {
  backendHealthStatus.textContent = 'down';
});
