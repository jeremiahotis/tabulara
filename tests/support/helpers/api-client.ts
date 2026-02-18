import type { APIRequestContext } from '@playwright/test';

export async function postJson<TResponse>(
  request: APIRequestContext,
  path: string,
  payload: unknown,
): Promise<TResponse> {
  const response = await request.post(path, {
    data: payload,
  });

  if (!response.ok()) {
    throw new Error(`API request failed: ${response.status()} ${response.statusText()}`);
  }

  return (await response.json()) as TResponse;
}
