import { test, expect } from '../../support/fixtures';

test.describe('general UI', () => {
  test('theme toggle switches and persists across reloads', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const toggle = page.getByRole('button', { name: /Switch to (light|dark) mode/ });
    await expect(toggle).toBeVisible();

    const initial = await html.getAttribute('data-theme');
    const target = initial === 'dark' ? 'light' : 'dark';
    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', target);

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', target);
  });

  test('unknown pages show the 404 page', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByAltText('404 - Page not found')).toBeVisible();
  });

  test('footer shows the version exposed by the API', async ({ page, request }) => {
    const { version } = await (await request.get('/api/v1/version')).json();
    expect(version).toBeTruthy();

    await page.goto('/');
    await expect(page.locator('footer')).toContainText(`v${version}`);
  });

  test('side navigation reaches every main page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Monitoring' }).click();
    await expect(page).toHaveURL(/\/monitoring$/);
    await page.getByRole('link', { name: 'Setup Wizard' }).click();
    await expect(page).toHaveURL(/\/setup-wizard\/1$/);
    await page.getByRole('link', { name: 'Repositories' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.locator('header button[aria-expanded]').click();
    await page.getByRole('link', { name: 'My Account' }).click();
    await expect(page).toHaveURL(/\/account/);
  });
});
