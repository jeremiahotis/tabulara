import type { BrowserContext } from '@playwright/test';

export async function applyLocalAuthToken(context: BrowserContext, token: string): Promise<void> {
  await context.addCookies([
    {
      name: 'tabulara_auth',
      value: token,
      domain: 'tabulara.local',
      path: '/',
      secure: false,
      httpOnly: false,
      sameSite: 'Lax',
    },
  ]);
}
