import { test, expect } from '../../support/fixtures';
import { CRONJOB_KEY, USE_DOCKER } from '../../support/env';
import { execIn } from '../../support/docker';
import { callCron } from '../../support/cron';
import { uniqueName } from '../../support/ssh';
import { openRepoEdit, repoCard, searchRepos, toast } from '../../support/ui';

// Runs a real borg client against the server: init, backup, then checks that
// monitoring, cron jobs and maintenance actions see the result.
test.describe('real borg backup', () => {
  test.skip(!USE_DOCKER, 'Needs the borg client container of the e2e docker stack');

  test('a client can back up and the repository becomes healthy', async ({ page, repos }) => {
    test.setTimeout(180_000);
    const keyDir = `/tmp/${uniqueName('client')}`;

    try {
      execIn('client', `mkdir -p ${keyDir} && ssh-keygen -q -t ed25519 -N '' -f ${keyDir}/id`);
      const publicKey = execIn('client', `cat ${keyDir}/id.pub`).trim();

      const repo = await repos.create({ sshPublicKey: publicKey, alert: 3600, storageSize: 1 });
      const url = `ssh://borgwarehouse@borgwarehouse:22/./${repo.repositoryName}`;
      const borgEnv = [
        `BORG_RSH="ssh -i ${keyDir}/id -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"`,
        'BORG_PASSPHRASE=e2e-passphrase',
        `BORG_BASE_DIR=${keyDir}/borg`,
      ].join(' ');

      execIn('client', `${borgEnv} borg init -e repokey-blake2 ${url}`);
      execIn('client', `${borgEnv} borg create ${url}::first /etc/hostname /etc/os-release`);
      expect(execIn('client', `${borgEnv} borg list --short ${url}`).trim()).toBe('first');

      expect((await callCron('status', `Bearer ${CRONJOB_KEY}`)).status).toBe(200);
      expect((await callCron('storage', `Bearer ${CRONJOB_KEY}`)).status).toBe(200);

      const record = await repos.get(repo.repositoryName);
      expect(record?.status).toBe(true);
      expect(record?.lastSave ?? 0).toBeGreaterThan(0);
      expect(record?.storageUsed ?? 0).toBeGreaterThan(0);

      await page.goto('/');
      await searchRepos(page, repo.alias);
      const card = repoCard(page, repo.alias);
      await expect(card.locator('[title="Status OK"]')).toBeVisible();

      await card.getByRole('button', { name: 'Compact repository' }).click();
      await expect(
        toast(page, `📦 The repository ${repo.repositoryName} has been compacted.`)
      ).toBeVisible({
        timeout: 60_000,
      });

      await openRepoEdit(page, repo.alias);
      await page.getByRole('button', { name: 'Break lock' }).click();
      await page.getByRole('button', { name: 'Break the lock' }).click();
      await expect(
        toast(page, `🔓 The lock on ${repo.repositoryName} has been released.`)
      ).toBeVisible({ timeout: 60_000 });

      await page.goto('/monitoring');
      await expect(page.getByRole('heading', { name: 'Monitoring', level: 1 })).toBeVisible();
      await expect(page.locator('canvas').first()).toBeVisible();
      await expect(page.locator('li').filter({ hasText: repo.alias })).toHaveCount(0);
    } finally {
      execIn('client', `rm -rf ${keyDir}`);
    }
  });
});
