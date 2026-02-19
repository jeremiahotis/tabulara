import { test, expect, type APIRequestContext } from '@playwright/test';

type DispatchResponse = {
  accepted?: boolean;
  command_id?: string;
  mutation_applied?: boolean;
  event_appended?: boolean;
  extraction_outputs?: {
    tokens?: Array<Record<string, unknown>>;
    lines?: Array<Record<string, unknown>>;
    table_candidates?: Array<Record<string, unknown>>;
    derived_values?: Array<Record<string, unknown>>;
  };
  events?: Array<{
    type?: string;
    caused_by?: string;
    data?: Record<string, unknown>;
  }>;
  error?: {
    code?: string;
    details?: Array<{
      field?: string;
      reason?: string;
    }>;
  };
};

async function dispatchCommand(request: APIRequestContext, command: Record<string, unknown>) {
  return request.post('/api/v1/commands/dispatch', { data: command });
}

function createRunExtractionCommand(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    command_id: crypto.randomUUID(),
    type: 'RunExtraction',
    actor: {
      id: 'ops-test-user',
      role: 'ops-user',
    },
    timestamp: new Date().toISOString(),
    payload: {
      session_id: 'session-extract-default',
      document_id: 'missing-document-id',
      extraction_profile: 'default-v1',
      source_state: 'preprocess-ready',
      ...overrides,
    },
  };
}

test.describe('Story 1.5 run extraction and persist derived data updates (ATDD RED)', () => {
  test.skip(
    '[P0][AC1] should persist extraction outputs and derived values transactionally when RunExtraction succeeds',
    async ({ request }) => {
      const command = createRunExtractionCommand({
        session_id: `session-extract-${crypto.randomUUID()}`,
        document_id: `document-ready-${crypto.randomUUID()}`,
        extraction_profile: 'operations-default',
      });

      const response = await dispatchCommand(request, command);

      expect(response.status()).toBe(202);
      const body = (await response.json()) as DispatchResponse;
      expect(body).toMatchObject({
        accepted: true,
        command_id: command.command_id,
        mutation_applied: true,
        event_appended: true,
        extraction_outputs: {
          tokens: expect.any(Array),
          lines: expect.any(Array),
          table_candidates: expect.any(Array),
          derived_values: expect.any(Array),
        },
      });
    },
  );

  test.skip(
    '[P0][AC1] should append ExtractionCompleted and derived-data events with command linkage',
    async ({ request }) => {
      const command = createRunExtractionCommand({
        session_id: `session-extract-${crypto.randomUUID()}`,
        document_id: `document-ready-${crypto.randomUUID()}`,
      });

      const response = await dispatchCommand(request, command);

      expect(response.status()).toBe(202);
      const body = (await response.json()) as DispatchResponse;
      expect(body.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'ExtractionCompleted',
            caused_by: command.command_id,
            data: expect.objectContaining({
              session_id: expect.any(String),
              document_id: expect.any(String),
            }),
          }),
          expect.objectContaining({
            type: 'DerivedDataUpdated',
            caused_by: command.command_id,
          }),
        ]),
      );
    },
  );

  test.skip(
    '[P0][AC2] should rollback mutation and event append when extraction fails before completion',
    async ({ request }) => {
      const command = createRunExtractionCommand({
        session_id: `session-extract-${crypto.randomUUID()}`,
        document_id: `document-ready-${crypto.randomUUID()}`,
        force_fail_stage: 'persistence-before-commit',
      });

      const response = await dispatchCommand(request, command);

      expect(response.status()).toBe(409);
      const body = (await response.json()) as DispatchResponse;
      expect(body).toMatchObject({
        mutation_applied: false,
        event_appended: false,
        error: {
          code: 'PRECONDITION_FAILED',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'run_extraction',
              reason: 'transaction_rolled_back',
            }),
          ]),
        },
      });
    },
  );

  test.skip(
    '[P0][AC2] should return deterministic failure payload for UI handling on extraction pipeline errors',
    async ({ request }) => {
      const command = createRunExtractionCommand({
        session_id: 'session-deterministic-failure',
        document_id: 'document-deterministic-failure',
        force_fail_stage: 'extractor-runtime',
      });

      const response = await dispatchCommand(request, command);

      expect(response.status()).toBe(409);
      const body = (await response.json()) as DispatchResponse;
      expect(body).toMatchObject({
        mutation_applied: false,
        event_appended: false,
        error: {
          code: 'EXTRACTION_FAILED',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'pipeline',
              reason: 'extractor_runtime_error',
            }),
          ]),
        },
      });
    },
  );

  test.skip('[P1][AC1] should persist deterministic extraction output structure for downstream verification', async ({ request }) => {
    const command = createRunExtractionCommand({
      session_id: `session-extract-${crypto.randomUUID()}`,
      document_id: `document-ready-${crypto.randomUUID()}`,
    });

    const response = await dispatchCommand(request, command);

    expect(response.status()).toBe(202);
    const body = (await response.json()) as DispatchResponse;
    expect(body.extraction_outputs).toMatchObject({
      tokens: expect.arrayContaining([expect.objectContaining({ token: expect.any(String) })]),
      lines: expect.arrayContaining([expect.objectContaining({ line_number: expect.any(Number) })]),
      table_candidates: expect.any(Array),
      derived_values: expect.arrayContaining([
        expect.objectContaining({
          field: expect.any(String),
          value: expect.anything(),
        }),
      ]),
    });
  });

  test.skip(
    '[P1][AC2] should keep failure envelope deterministic for repeated invalid extraction requests',
    async ({ request }) => {
      const command = createRunExtractionCommand({
        session_id: 'session-repeatable-error',
        document_id: 'document-missing',
      });

      const first = await dispatchCommand(request, command);
      const second = await dispatchCommand(request, command);

      expect(first.status()).toBe(409);
      expect(second.status()).toBe(409);

      const firstBody = (await first.json()) as DispatchResponse;
      const secondBody = (await second.json()) as DispatchResponse;

      expect(firstBody.error?.code).toBe('PRECONDITION_FAILED');
      expect(secondBody.error?.code).toBe('PRECONDITION_FAILED');
      expect(firstBody.error?.details?.[0]?.reason).toBe(secondBody.error?.details?.[0]?.reason);
    },
  );
});