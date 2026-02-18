import type { Page, Response } from '@playwright/test';

export async function waitForStatus(
  page: Page,
  matcher: string,
  expectedStatus: number,
): Promise<Response> {
  const response = await page.waitForResponse(
    (res) => res.url().includes(matcher) && res.status() === expectedStatus,
  );
  return response;
}
