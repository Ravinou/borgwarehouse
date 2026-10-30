import { test, expect } from '../../support/fixtures';
import { USE_DOCKER } from '../../support/env';
import { execIn } from '../../support/docker';
import { generateSshPublicKey, uniqueName } from '../../support/ssh';
import { openRepoEdit, pickSelectOption, repoCard, searchRepos, toast } from '../../support/ui';

test.describe('repositories', () => {
  test('creates a repository from the UI with all options', async ({ page, repos }) => {
    const alias = uniqueName('ui-create');
    const sshKey = generateSshPublicKey();

    await page.goto('/');
    await page.getByRole('link', { name: 'Add a repository' }).click();
    await expect(page).toHaveURL(/\/manage-repo\/add$/);
    await expect(page.getByRole('heading', { name: 'Add a repository' })).toBeVisible();

    await page.locator('[name=alias]').fill(alias);
    await page.locator('[name=sshkey]').fill(sshKey);
    await page.locator('[name=storageSize]').fill('42');
    await page.locator('[name=comment]').fill('created by playwright');
    await page.locator('[name=appendOnlyMode]').check();
    await pickSelectOption(page, page.locator('label[for=alert] + div'), 'Disabled');
    await page.getByRole('button', { name: 'Add repository' }).click();

    await expect(toast(page, 'New repository added ! 🥳')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    const created = (await repos.list()).find((r) => r.alias === alias);
    expect(created).toBeDefined();
    repos.track(created!.repositoryName);
    expect(created).toMatchObject({
      storageSize: 42,
      comment: 'created by playwright',
      appendOnlyMode: true,
      alert: 0,
      lanCommand: false,
      sshPublicKey: sshKey,
    });
    expect(created!.repositoryName).toMatch(/^[a-f0-9]{8}$/);

    await searchRepos(page, alias);
    const card = repoCard(page, alias);
    await expect(card.getByTitle('Append-only mode enabled')).toBeVisible();
    await expect(card.getByTitle('Alerts disabled')).toBeVisible();
    await expect(card.getByText(created!.repositoryName, { exact: true })).toBeVisible();
    await expect(card.getByText('42 GB', { exact: true })).toBeVisible();

    if (USE_DOCKER) {
      const keys = execIn('borgwarehouse', 'cat /home/borgwarehouse/.ssh/authorized_keys');
      const line = keys.split('\n').find((l) => l.includes(created!.repositoryName));
      expect(line).toContain('--append-only');
      expect(line).toContain('--storage-quota 42G');
    }
  });

  test('rejects an invalid SSH key', async ({ page }) => {
    await page.goto('/manage-repo/add');
    await page.locator('[name=alias]').fill(uniqueName('invalid-key'));
    await page.locator('[name=sshkey]').fill('ssh-ed25519 not-a-valid-key');
    await page.locator('[name=storageSize]').fill('10');
    await expect(
      page.getByText(
        'Invalid public key. The key needs to be in OpenSSH format (rsa, ed25519, ed25519-sk)'
      )
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add repository' })).toBeDisabled();
  });

  test('rejects an SSH key already used by another repository', async ({ page, repos }) => {
    const existing = await repos.create();

    await page.goto('/manage-repo/add');
    await page.locator('[name=alias]').fill(uniqueName('dup-key'));
    await page.locator('[name=sshkey]').fill(existing.sshPublicKey);
    await page.locator('[name=storageSize]').fill('10');
    await page.getByRole('button', { name: 'Add repository' }).click();

    await expect(
      toast(page, `The SSH key is already used in repository ${existing.repositoryName}`)
    ).toBeVisible();
    expect((await repos.list()).filter((r) => r.alias.startsWith('dup-key')).length).toBe(0);
  });

  test('edits a repository from the UI', async ({ page, repos }) => {
    const repo = await repos.create({ storageSize: 10 });
    const newAlias = uniqueName('ui-edited');

    await openRepoEdit(page, repo.alias);
    await expect(page.getByText(repo.repositoryName).first()).toBeVisible();
    await page.locator('[name=alias]').fill(newAlias);
    await page.locator('[name=storageSize]').fill('25');
    await page.locator('[name=comment]').fill('edited comment');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(
      toast(page, `The repository ${repo.repositoryName} has been successfully edited !`)
    ).toBeVisible();

    await expect.poll(async () => (await repos.get(repo.repositoryName))?.alias).toBe(newAlias);
    expect(await repos.get(repo.repositoryName)).toMatchObject({
      storageSize: 25,
      comment: 'edited comment',
    });

    await searchRepos(page, newAlias);
    await expect(repoCard(page, newAlias).getByText('25 GB', { exact: true })).toBeVisible();
  });

  test('deletes a repository after confirmation', async ({ page, repos }) => {
    const repo = await repos.create();

    await openRepoEdit(page, repo.alias);
    await page.getByRole('button', { name: 'Delete repository' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
    expect(await repos.get(repo.repositoryName)).toBeDefined();

    await page.getByRole('button', { name: 'Delete repository' }).click();
    await page.getByRole('button', { name: 'Yes, delete it !' }).click();
    await expect(
      toast(page, `The repository ${repo.repositoryName} has been successfully deleted`)
    ).toBeVisible();
    await expect.poll(async () => repos.get(repo.repositoryName)).toBeUndefined();

    if (USE_DOCKER) {
      const keys = execIn('borgwarehouse', 'cat /home/borgwarehouse/.ssh/authorized_keys');
      expect(keys).not.toContain(repo.repositoryName);
    }
  });

  test('creates a repository on an external storage target', async ({ page, repos }) => {
    test.skip(!USE_DOCKER, 'Relies on the STORAGE_TARGETS of the docker stack');
    const alias = uniqueName('ui-target');

    await page.goto('/manage-repo/add');
    await page.locator('[name=alias]').fill(alias);
    await page.locator('[name=sshkey]').fill(generateSshPublicKey());
    await page.locator('[name=storageSize]').fill('5');
    await pickSelectOption(page, page.locator('label[for=storageTarget] + div'), 'E2E Target');
    await page.getByRole('button', { name: 'Add repository' }).click();
    await expect(toast(page, 'New repository added ! 🥳')).toBeVisible();

    const created = (await repos.list()).find((r) => r.alias === alias);
    expect(created?.storageTarget).toBe('/mnt/e2e-target');
    repos.track(created!.repositoryName);

    await searchRepos(page, alias);
    await expect(repoCard(page, alias).getByTitle('Storage target: E2E Target')).toBeVisible();

    await openRepoEdit(page, alias);
    await expect(page.locator('#storageTargetReadOnly')).toHaveValue('E2E Target');
    await expect(page.locator('#storageTargetReadOnly')).toBeDisabled();

    const link = execIn(
      'borgwarehouse',
      `readlink /home/borgwarehouse/repos/${created!.repositoryName}`
    );
    expect(link.trim()).toBe(`/mnt/e2e-target/${created!.repositoryName}`);
  });

  test('shows WAN and LAN connection strings', async ({ page, repos }) => {
    test.skip(!USE_DOCKER, 'Relies on the FQDN settings of the docker stack');
    const wan = await repos.create({ alias: uniqueName('wan') });
    const lan = await repos.create({ alias: uniqueName('lan'), lanCommand: true });

    await page.goto('/');
    await searchRepos(page, wan.alias);
    await expect(repoCard(page, wan.alias).locator('code')).toHaveText(
      `ssh://borgwarehouse@borgwarehouse:22/./${wan.repositoryName}`
    );

    await searchRepos(page, lan.alias);
    const lanCard = repoCard(page, lan.alias);
    await expect(lanCard.locator('code')).toHaveText(
      `ssh://borgwarehouse@borgwarehouse.lan:2222/./${lan.repositoryName}`
    );
    await expect(lanCard.getByText('LAN', { exact: true })).toBeVisible();
  });
});
