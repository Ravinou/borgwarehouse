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
});
