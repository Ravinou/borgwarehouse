import { request } from '@playwright/test';
import { BASE_URL, NO_SESSION } from './env';

export async function callCron(
  endpoint: 'status' | 'storage',
  authorization?: string,
  method = 'POST'
): Promise<{ status: number; body: string }> {
  const ctx = await request.newContext({ baseURL: BASE_URL, storageState: NO_SESSION });
  try {
    const res = await ctx.fetch(`/api/v1/cron/${endpoint}`, {
      method,
      headers: authorization ? { Authorization: authorization } : {},
    });
    return { status: res.status(), body: await res.text() };
  } finally {
    await ctx.dispose();
  }
}
