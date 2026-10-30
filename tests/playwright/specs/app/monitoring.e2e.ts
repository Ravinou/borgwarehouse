import { test, expect } from '../../support/fixtures';

test.describe('monitoring', () => {
  test('dashboard lists new repositories as needing attention', async ({ page, repos }) => {
    const repo = await repos.create({ storageSize: 7 });

    await page.goto('/');
    await page.getByRole('link', { name: 'Monitoring' }).click();
    await expect(page).toHaveURL(/\/monitoring$/);
    await expect(page.getByRole('heading', { name: 'Monitoring', level: 1 })).toBeVisible();

    const main = page
      .locator('header', { has: page.getByRole('heading', { name: 'Monitoring' }) })
      .locator('..');
    for (const label of ['Repositories', 'Healthy', 'Storage used', 'Last backup']) {
      await expect(main.getByText(label, { exact: true })).toBeVisible();
    }

    const chartPanel = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Storage used per repository' }),
    });
    await expect(chartPanel.locator('canvas')).toBeVisible();

    const attention = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Needs attention' }),
    });
    const item = attention.getByRole('listitem').filter({ hasText: repo.alias });
    await expect(item).toContainText('Status error');
  });

  test('archived repositories are optional and never need attention', async ({
    page,
    api,
    repos,
  }) => {
    const archived = await repos.create({ storageSize: 7 });
    const res = await api.post(`/api/v1/repositories/${archived.repositoryName}/archive`, {
      data: { archived: true },
    });
    expect(res.status()).toBe(200);

    await page.goto('/monitoring');
    const attention = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Needs attention' }),
    });

    const toggle = page.getByTitle('Include archived repositories');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    const hide = page.getByTitle('Hide archived repositories');
    await expect(hide).toHaveAttribute('aria-pressed', 'true');
    await expect(attention.getByText(archived.alias, { exact: true })).toHaveCount(0);

    await page.reload();
    await expect(page.getByTitle('Hide archived repositories')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.getByTitle('Hide archived repositories').click();
    await expect(page.getByTitle('Include archived repositories')).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });
});
