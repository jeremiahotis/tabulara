import type { Page, Response } from '@playwright/test';

export async function waitForApiV1Response(
  page: Page,
  path: string,
  method: string,
  expectedStatus: number,
): Promise<Response> {
  return page.waitForResponse(
    (response) =>
      response.url().includes(`/api/v1/${path}`) &&
      response.request().method().toUpperCase() === method.toUpperCase() &&
      response.status() === expectedStatus,
  );
}
