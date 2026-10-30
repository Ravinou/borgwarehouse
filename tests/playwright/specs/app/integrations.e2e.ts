import { request, type Page } from '@playwright/test';
import { test, expect } from '../../support/fixtures';
import { BASE_URL, NO_SESSION } from '../../support/env';
import { generateSshPublicKey, uniqueName } from '../../support/ssh';
import { toast } from '../../support/ui';

function bearer(token: string) {
  return request.newContext({
    baseURL: BASE_URL,
    storageState: NO_SESSION,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
}

function tokenCard(page: Page, name: string) {
  return page
    .locator('div')
    .filter({ has: page.getByText(name, { exact: true }) })
    .filter({ has: page.locator('svg.tabler-icon-trash') })
    .last();
}

test.describe('API tokens', () => {
  test('a read-only token generated in the UI can read but not write, then is revoked', async ({
    page,
    api,
  }) => {
    const name = uniqueName('ro')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 25);

    await page.goto('/account');
    await page.getByRole('button', { name: 'Integrations', exact: true }).click();

    const form = page.locator('form').filter({ has: page.getByPlaceholder('Token name') });
    await form.getByPlaceholder('Token name').fill('bad name');
    await expect(page.getByText(/Only alphanumeric characters/)).toBeVisible();
    await form.getByPlaceholder('Token name').fill(name);
    await expect(form.getByRole('button', { name: 'Generate' })).toBeDisabled();
    await form.getByText('Read', { exact: true }).click();
    await form.getByRole('button', { name: 'Generate' }).click();
    await expect(toast(page, '🔑 Token generated !')).toBeVisible();

    const card = tokenCard(page, name);
    await expect(
      card.getByText('This token will not be shown again. Please save it.')
    ).toBeVisible();
    const token = (await card.locator('code').innerText()).trim();
    expect(token.length).toBeGreaterThan(10);

    const client = await bearer(token);
    try {
      expect((await client.get('/api/v1/repositories')).status()).toBe(200);
      const write = await client.post('/api/v1/repositories', {
        data: { alias: 'forbidden', sshPublicKey: generateSshPublicKey(), storageSize: 1 },
      });
      expect(write.status()).toBe(403);

      await card.locator('svg.tabler-icon-trash').click();
      await card.getByRole('button', { name: 'Cancel' }).click();
      await expect(card.getByRole('button', { name: 'Confirm' })).toBeHidden();
      await card.locator('svg.tabler-icon-trash').click();
      await card.getByRole('button', { name: 'Confirm' }).click();
      await expect(toast(page, '🗑️ Token deleted !')).toBeVisible();
      await expect(page.getByText(name, { exact: true })).toBeHidden();

      expect((await client.get('/api/v1/repositories')).status()).toBe(401);
    } finally {
      await client.dispose();
      await api.delete('/api/v1/integration/token-manager', { data: { name } });
    }
  });

  test('a token with every permission can manage repositories', async ({ api, repos }) => {
    const name = uniqueName('full')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 25);
    const created = await api.post('/api/v1/integration/token-manager', {
      data: { name, permissions: { create: true, read: true, update: true, delete: true } },
    });
    expect(created.status(), await created.text()).toBe(200);
    const { token } = (await created.json()) as { token: string };

    const client = await bearer(token);
    try {
      const create = await client.post('/api/v1/repositories', {
        data: {
          alias: uniqueName('token-repo'),
          sshPublicKey: generateSshPublicKey(),
          storageSize: 2,
        },
      });
      expect(create.status(), await create.text()).toBe(200);
      const { repositoryName } = (await create.json()) as { repositoryName: string };
      repos.track(repositoryName);

      const update = await client.patch(`/api/v1/repositories/${repositoryName}`, {
        data: { comment: 'updated by token' },
      });
      expect(update.status(), await update.text()).toBe(200);

      const read = await client.get(`/api/v1/repositories/${repositoryName}`);
      expect(read.status()).toBe(200);
      expect((await read.json()).repo.comment).toBe('updated by token');

      const del = await client.delete(`/api/v1/repositories/${repositoryName}`);
      expect(del.status(), await del.text()).toBe(200);
      expect((await client.get(`/api/v1/repositories/${repositoryName}`)).status()).toBe(404);
    } finally {
      await client.dispose();
      await api.delete('/api/v1/integration/token-manager', { data: { name } });
    }
  });
});
