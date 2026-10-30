import { test, expect } from '../../support/fixtures';
import { USE_DOCKER } from '../../support/env';
import { execIn } from '../../support/docker';

const PARALLEL = 6;

function authorizedKeys(): string {
  return execIn('borgwarehouse', 'cat /home/borgwarehouse/.ssh/authorized_keys', 'borgwarehouse');
}

test.describe('concurrent repository mutations', () => {
  test('parallel creations are all persisted with unique ids', async ({ repos }) => {
    const created = await Promise.all(Array.from({ length: PARALLEL }, () => repos.create()));

    const list = await repos.list();
    for (const repo of created) {
      const record = list.find((r) => r.repositoryName === repo.repositoryName);
      expect(record, `${repo.alias} missing from the repository list`).toBeDefined();
      expect(record?.id).toBe(repo.id);
    }
    expect(new Set(created.map((r) => r.id)).size).toBe(PARALLEL);
    expect(new Set(list.map((r) => r.id)).size).toBe(list.length);

    if (USE_DOCKER) {
      const keys = authorizedKeys();
      for (const repo of created) {
        expect(keys).toContain(repo.sshPublicKey);
      }
    }
  });

  test('parallel deletions remove every repository and SSH access', async ({ api, repos }) => {
    const created = await Promise.all(Array.from({ length: PARALLEL }, () => repos.create()));

    const responses = await Promise.all(
      created.map((repo) => api.delete(`/api/v1/repositories/${repo.repositoryName}`))
    );
    for (const res of responses) {
      expect(res.status(), await res.text()).toBe(200);
    }

    const names = new Set((await repos.list()).map((r) => r.repositoryName));
    for (const repo of created) {
      expect(names.has(repo.repositoryName)).toBe(false);
    }

    if (USE_DOCKER) {
      const keys = authorizedKeys();
      for (const repo of created) {
        expect(keys).not.toContain(repo.sshPublicKey);
      }
    }
  });
});
