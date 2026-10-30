import { test, expect } from '../../support/fixtures';
import { uniqueName } from '../../support/ssh';
import { repoCard, searchRepos } from '../../support/ui';

test.describe('repository list', () => {
  test('search filters by alias, comment or name and persists after reload', async ({
    page,
    repos,
  }) => {
    const token = uniqueName('search');
    const byAlias = await repos.create({ alias: `${token}-alias` });
    const byComment = await repos.create({ alias: uniqueName('other'), comment: `${token} here` });
    const outsider = await repos.create({ alias: uniqueName('outsider') });

    await page.goto('/');
    await searchRepos(page, token);
    await expect(repoCard(page, byAlias.alias)).toBeVisible();
    await expect(repoCard(page, byComment.alias)).toBeVisible();
    await expect(page.getByText(outsider.alias, { exact: true })).toHaveCount(0);

    await searchRepos(page, byAlias.repositoryName);
    await expect(repoCard(page, byAlias.alias)).toBeVisible();
    await expect(page.getByText(byComment.alias, { exact: true })).toHaveCount(0);

    await page.reload();
    await expect(page.getByPlaceholder('Alias, comment, repository name...')).toHaveValue(
      byAlias.repositoryName
    );
    await expect(repoCard(page, byAlias.alias)).toBeVisible();

    await page.getByTitle('Clear search').click();
    await expect(page.getByPlaceholder('Alias, comment, repository name...')).toHaveValue('');
    await expect(repoCard(page, outsider.alias)).toBeVisible();
  });

  test('sorts by alias in both directions and remembers the choice', async ({ page, repos }) => {
    const token = uniqueName('sort');
    for (const suffix of ['bravo', 'alpha', 'charlie']) {
      await repos.create({ alias: `${token}-${suffix}` });
    }
    const aliases = page.getByText(new RegExp(`^${token}-`));

    await page.goto('/');
    await searchRepos(page, token);
    await page.getByTitle('Sort by').click();
    await page.getByRole('option', { name: 'Alias' }).click();
    if (await page.getByTitle('Z → A').isVisible()) {
      await page.getByTitle('Z → A').click();
    }
    await expect(page.getByTitle('A → Z')).toBeVisible();
    await expect(aliases).toHaveText([`${token}-alpha`, `${token}-bravo`, `${token}-charlie`]);

    await page.getByTitle('A → Z').click();
    await expect(page.getByTitle('Z → A')).toBeVisible();
    await expect(aliases).toHaveText([`${token}-charlie`, `${token}-bravo`, `${token}-alpha`]);

    await page.reload();
    await expect(page.getByTitle('Z → A')).toBeVisible();
    await expect(aliases).toHaveText([`${token}-charlie`, `${token}-bravo`, `${token}-alpha`]);
  });

  test('sorts by append-only mode (#720)', async ({ page, repos }) => {
    const token = uniqueName('append');
    await repos.create({ alias: `${token}-off` });
    await repos.create({ alias: `${token}-on`, appendOnlyMode: true });
    const aliases = page.getByText(new RegExp(`^${token}-`));

    await page.goto('/');
    await searchRepos(page, token);
    await page.getByTitle('Sort by').click();
    await page.getByRole('option', { name: 'Append-only' }).click();
    await expect(page.getByTitle('Disabled → Enabled')).toBeVisible();
    await expect(aliases).toHaveText([`${token}-off`, `${token}-on`]);

    await page.getByTitle('Disabled → Enabled').click();
    await expect(page.getByTitle('Enabled → Disabled')).toBeVisible();
    await expect(aliases).toHaveText([`${token}-on`, `${token}-off`]);
  });

  test('details can be collapsed and the state is remembered', async ({ page, repos }) => {
    const repo = await repos.create();

    await page.goto('/');
    await searchRepos(page, repo.alias);
    const card = repoCard(page, repo.alias);
    await expect(card.getByText(repo.repositoryName, { exact: true })).toBeVisible();

    await card.getByRole('button', { name: 'Collapse details' }).click();
    await expect(card.getByRole('button', { name: 'Expand details' })).toBeVisible();

    await page.reload();
    await expect(
      repoCard(page, repo.alias).getByRole('button', { name: 'Expand details' })
    ).toBeVisible();
  });

  test('archived repositories are hidden from the active list', async ({ page, api, repos }) => {
    const token = uniqueName('archived');
    const active = await repos.create({ alias: `${token}-active` });
    const archived = await repos.create({ alias: `${token}-frozen` });
    const res = await api.post(`/api/v1/repositories/${archived.repositoryName}/archive`, {
      data: { archived: true },
    });
    expect(res.status()).toBe(200);

    await page.goto('/');
    await searchRepos(page, token);
    await expect(repoCard(page, active.alias)).toBeVisible();
    await expect(page.getByText(archived.alias, { exact: true })).toHaveCount(0);

    const toggle = page.getByTitle('Show archived repositories');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();

    const back = page.getByTitle('Back to active repositories');
    await expect(back).toHaveAttribute('aria-pressed', 'true');
    const card = repoCard(page, archived.alias);
    await expect(card.getByTitle('Archived (read-only, frozen)')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Compact repository' })).toHaveCount(0);
    await expect(page.getByText(active.alias, { exact: true })).toHaveCount(0);

    await back.click();
    await expect(repoCard(page, active.alias)).toBeVisible();
  });
});
