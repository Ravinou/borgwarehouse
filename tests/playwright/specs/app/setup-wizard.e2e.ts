import { test, expect } from '../../support/fixtures';
import { USE_DOCKER } from '../../support/env';

test.describe('setup wizard', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('walks through the steps with the commands of the selected repository', async ({
    page,
    repos,
  }) => {
    test.skip(!USE_DOCKER, 'Relies on the FQDN settings of the docker stack');
    const repo = await repos.create();
    const url = `ssh://borgwarehouse@borgwarehouse:22/./${repo.repositoryName}`;

    await page.goto('/');
    await page.getByRole('link', { name: 'Setup Wizard' }).click();
    await expect(page).toHaveURL(/\/setup-wizard\/1$/);

    const select = page.locator('input[id^="react-select"]').first();
    await select.click();
    await select.fill(repo.alias);
    await page.getByRole('option', { name: `${repo.alias} - ${repo.repositoryName}` }).click();

    await page.getByRole('button', { name: 'Next step' }).click();
    await expect(page).toHaveURL(/\/setup-wizard\/2$/);
    const init = `borg init -e repokey-blake2 ${url}`;
    await expect(page.getByText(init, { exact: true })).toBeVisible();

    const copy = page.locator('code', { hasText: init }).locator('..').getByRole('button');
    await copy.click();
    await expect(copy).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(init);

    await page.getByRole('button', { name: 'Next step' }).click();
    await expect(page).toHaveURL(/\/setup-wizard\/3$/);
    await expect(page.getByText(`borg create ${url}::archive1 /your/pathToBackup`)).toBeVisible();
    await expect(page.getByText(`borg list ${url}`, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Previous step' }).click();
    await expect(page).toHaveURL(/\/setup-wizard\/2$/);

    await page.getByRole('button', { name: 'Automation' }).click();
    await expect(page).toHaveURL(/\/setup-wizard\/4$/);

    await page.getByRole('button', { name: 'Client Setup' }).click();
    await expect(page).toHaveURL(/\/setup-wizard\/1$/);
  });
});
