import { request } from '@playwright/test';
import { test, expect, signIn } from '../../support/fixtures';
import { ADMIN, BASE_URL, NO_SESSION } from '../../support/env';
import { uniqueName } from '../../support/ssh';
import { toast } from '../../support/ui';

// These tests change the admin credentials and always restore them, so they run
// last, alone, after every other project.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

async function canSignIn(username: string, password: string): Promise<boolean> {
  const ctx = await request.newContext({
    baseURL: BASE_URL,
    storageState: NO_SESSION,
    extraHTTPHeaders: { Origin: BASE_URL },
  });
  try {
    const res = await signIn(ctx, username, password);
    return res.ok();
  } finally {
    await ctx.dispose();
  }
}

test.describe('admin credentials', () => {
  test('password can be changed from the account page', async ({ page, api }) => {
    const newPassword = `${uniqueName('Pw')}-X9`;

    await page.goto('/account');
    try {
      await page.getByPlaceholder('Current password').fill('definitely-wrong');
      await page.getByPlaceholder('New password').fill(newPassword);
      await page.getByRole('button', { name: 'Update your password' }).click();
      await expect(page.locator('.Toastify .Toastify__toast--error')).toBeVisible();
      await expect(page.getByPlaceholder('Current password')).toHaveValue('');
      // After its internal reset, the form ignores programmatic fills: start over.
      await page.reload();

      await page.getByPlaceholder('Current password').fill(ADMIN.password);
      await page.getByPlaceholder('New password').fill(newPassword);
      await page.getByRole('button', { name: 'Update your password' }).click();
      await expect(toast(page, '🔑 Password edited !')).toBeVisible();

      expect(await canSignIn(ADMIN.username, ADMIN.password)).toBe(false);
      expect(await canSignIn(ADMIN.username, newPassword)).toBe(true);
    } finally {
      await api.put('/api/v1/account/password', {
        data: { oldPassword: newPassword, newPassword: ADMIN.password },
      });
    }
    expect(await canSignIn(ADMIN.username, ADMIN.password)).toBe(true);
  });

  test('username can be changed from the account page', async ({ page, api }) => {
    const newUsername = uniqueName('e2e.admin');

    await page.goto('/account');
    try {
      const input = page.locator('input[name="username"]');
      await expect(input).toHaveValue(ADMIN.username);
      await input.fill(newUsername);
      await page.getByRole('button', { name: 'Update username' }).click();
      await expect(toast(page, 'Username updated!')).toBeVisible();

      expect(await canSignIn(newUsername, ADMIN.password)).toBe(true);
      expect(await canSignIn(ADMIN.username, ADMIN.password)).toBe(false);

      await page.reload();
      await expect(page.locator('input[name="username"]')).toHaveValue(newUsername);
    } finally {
      await api.put('/api/v1/account/username', { data: { username: ADMIN.username } });
    }
    expect(await canSignIn(ADMIN.username, ADMIN.password)).toBe(true);
  });
});
