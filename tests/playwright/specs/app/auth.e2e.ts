import { test, expect } from '@playwright/test';
import { ADMIN, BASE_URL } from '../../support/env';
import { userMenu, toast, uiSignIn } from '../../support/ui';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('authentication', () => {
  for (const path of ['/', '/monitoring', '/account', '/setup-wizard/1', '/manage-repo/add']) {
    test(`anonymous visitor is redirected to /login from ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    });
  }

  test('wrong credentials are rejected', async ({ page }) => {
    test.setTimeout(90_000);
    // Retried because the sign-in rate limit can answer first.
    await expect(async () => {
      await page.goto('/login');
      await page.getByPlaceholder('Username').fill(ADMIN.username);
      await page.getByPlaceholder('Password').fill('definitely-not-the-password');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(toast(page, 'Incorrect credentials')).toBeVisible({ timeout: 5_000 });
    }).toPass({ intervals: [5_000, 10_000], timeout: 60_000 });
    await expect(page).toHaveURL(/\/login$/);
  });

  test('user signs in, is redirected away from /login, then signs out', async ({ page }) => {
    test.setTimeout(90_000);
    await uiSignIn(page, ADMIN.username, ADMIN.password);

    await page.goto('/login');
    await expect(page).toHaveURL(/\/$/);

    await userMenu(page).click();
    await expect(page.getByRole('link', { name: 'My Account' })).toBeVisible();
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('API rejects anonymous calls and invalid tokens', async ({ playwright }) => {
    const api = await playwright.request.newContext({ baseURL: BASE_URL });
    expect((await api.get('/api/v1/repositories')).status()).toBe(401);

    const invalid = await api.get('/api/v1/repositories', {
      headers: { Authorization: 'Bearer not-a-real-token' },
    });
    expect(invalid.status()).toBe(401);
    await api.dispose();
  });
});
