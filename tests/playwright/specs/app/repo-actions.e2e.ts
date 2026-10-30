import { test, expect } from '../../support/fixtures';
import { openRepoEdit, repoCard, searchRepos, toast } from '../../support/ui';

test.describe('repository actions', () => {
  test('archives then unarchives a repository from the edit modal', async ({ page, repos }) => {
    const repo = await repos.create();

    await openRepoEdit(page, repo.alias);
    await page.getByRole('button', { name: 'Archive', exact: true }).click();
    await page.getByRole('button', { name: 'Archive it' }).click();
    await expect(
      toast(page, `The repository ${repo.repositoryName} has been archived.`)
    ).toBeVisible();
    await expect.poll(async () => (await repos.get(repo.repositoryName))?.archived).toBe(true);

    await page.goto(`/manage-repo/edit/${repo.id}`);
    await expect(page.getByText(/This repository is\s+archived\s+and frozen/)).toBeVisible();
    await expect(page.locator('[name=alias]')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();

    await page.getByRole('button', { name: 'Unarchive' }).click();
    await expect(
      toast(page, `The repository ${repo.repositoryName} has been unarchived.`)
    ).toBeVisible();
    await expect.poll(async () => (await repos.get(repo.repositoryName))?.archived).toBeFalsy();
  });

  test('compact reports an error on a never initialized repository', async ({ page, repos }) => {
    const repo = await repos.create();

    await page.goto('/');
    await searchRepos(page, repo.alias);
    await repoCard(page, repo.alias).getByRole('button', { name: 'Compact repository' }).click();
    await expect(toast(page, /An error has occurred/)).toBeVisible();
  });

  test('break lock asks for confirmation and reports an error on a never initialized repository', async ({
    page,
    repos,
  }) => {
    const repo = await repos.create();

    await openRepoEdit(page, repo.alias);
    await page.getByRole('button', { name: 'Break lock' }).click();
    await expect(page.getByText(`Break the lock on ${repo.repositoryName} ?`)).toBeVisible();
    await page.getByRole('button', { name: 'Break the lock' }).click();
    await expect(toast(page, /An error has occurred/)).toBeVisible();
  });
});
