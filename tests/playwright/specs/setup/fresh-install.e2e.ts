import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { ADMIN, AUTH_FILE, USE_DOCKER } from '../../support/env';
import { serverLogs } from '../../support/docker';
import { uiSignIn } from '../../support/ui';

test.describe('fresh install', () => {
  test('first admin is created through the setup page, then the setup is locked', async ({
    page,
    request,
  }) => {
    const status = await (await request.get('/api/v1/setup')).json();
    test.skip(
      !status.setupRequired && !USE_DOCKER,
      'External instance already initialized: setup flow not replayable'
    );
    expect(status.setupRequired).toBe(true);

    await page.goto('/login');
    await expect(page).toHaveURL(/\/setup$/);

    const submit = page.getByRole('button', { name: 'Create admin account' });
    await page.getByPlaceholder('Username').fill(ADMIN.username);
    await page.getByPlaceholder('Password (8 characters min.)').fill('short');
    await expect(page.getByText('Minimum 8 characters.')).toBeVisible();
    await page.getByPlaceholder('Password (8 characters min.)').fill(ADMIN.password);
    await page.getByPlaceholder('Confirm password').fill(`${ADMIN.password}-typo`);
    await expect(page.getByText('Passwords do not match.')).toBeVisible();
    await expect(submit).toBeDisabled();

    await page.getByPlaceholder('Confirm password').fill(ADMIN.password);
    await submit.click();
    await expect(page.getByText('Account created! You can now sign in.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    expect((await (await request.get('/api/v1/setup')).json()).setupRequired).toBe(false);
    const replay = await request.post('/api/v1/setup', {
      data: { username: 'intruder', password: 'intruder-password' },
    });
    expect(replay.status()).toBe(403);

    await page.goto('/setup');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('admin signs in and the session is stored for the other tests', async ({ page }) => {
    test.setTimeout(90_000);
    await uiSignIn(page, ADMIN.username, ADMIN.password);
    await expect(page.getByRole('link', { name: 'Add a repository' })).toBeVisible();

    fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
    await page.context().storageState({ path: AUTH_FILE });
  });

  test('server logs are free of database errors (#723, #729)', async () => {
    test.skip(!USE_DOCKER, 'Requires the docker stack');
    const logs = serverLogs();
    expect(logs).toContain('BorgWarehouse is ready');
    for (const pattern of [
      /SQLITE_ERROR/,
      /SqliteError/,
      /Database schema mismatch/,
      /Failed to prepare server/,
      /unhandledRejection/,
    ]) {
      expect(logs, `unexpected "${pattern.source}" in server logs`).not.toMatch(pattern);
    }
  });
});
