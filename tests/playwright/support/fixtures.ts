import { test as base, expect, request, type APIRequestContext } from '@playwright/test';
import { ADMIN, AUTH_FILE, BASE_URL } from './env';
import { generateSshPublicKey, uniqueName } from './ssh';

export type RepoInput = {
  alias?: string;
  sshPublicKey?: string;
  storageSize?: number;
  comment?: string;
  alert?: number;
  lanCommand?: boolean;
  appendOnlyMode?: boolean;
  storageTarget?: string;
};

export type CreatedRepo = {
  id: number;
  repositoryName: string;
  alias: string;
  sshPublicKey: string;
};

export type RepoRecord = {
  id: number;
  alias: string;
  repositoryName: string;
  status: boolean;
  lastSave: number;
  alert?: number;
  storageSize: number;
  storageUsed: number;
  sshPublicKey: string;
  comment: string;
  lanCommand?: boolean;
  appendOnlyMode?: boolean;
  storageTarget?: string;
  archived?: boolean;
};

type RepoFactory = {
  create: (input?: RepoInput) => Promise<CreatedRepo>;
  track: (repositoryName: string) => void;
  get: (repositoryName: string) => Promise<RepoRecord | undefined>;
  list: () => Promise<RepoRecord[]>;
};

type Fixtures = {
  api: APIRequestContext;
  repos: RepoFactory;
};

export async function newAdminApi(
  storageState: string | undefined = AUTH_FILE
): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: BASE_URL,
    storageState,
    extraHTTPHeaders: { Origin: BASE_URL },
  });
}

export async function signIn(
  api: APIRequestContext,
  username = ADMIN.username,
  password = ADMIN.password
) {
  // better-auth rate limits sign-in: wait and retry instead of failing.
  for (let attempt = 0; ; attempt++) {
    const res = await api.post('/api/auth/sign-in/username', { data: { username, password } });
    if (res.status() !== 429 || attempt >= 5) return res;
    const retryAfter = Number(res.headers()['x-retry-after'] ?? res.headers()['retry-after']);
    await new Promise((r) => setTimeout(r, (Number.isFinite(retryAfter) ? retryAfter : 5) * 1000));
  }
}

export const test = base.extend<Fixtures>({
  api: async ({}, provide) => {
    const api = await newAdminApi();
    await provide(api);
    await api.dispose();
  },

  repos: async ({ api }, provide) => {
    const owned = new Set<string>();

    const list = async () => {
      const res = await api.get('/api/v1/repositories');
      expect(res.status()).toBe(200);
      return ((await res.json()) as { repoList: RepoRecord[] }).repoList;
    };

    const factory: RepoFactory = {
      create: async (input = {}) => {
        const alias = input.alias ?? uniqueName('e2e-repo');
        const sshPublicKey = input.sshPublicKey ?? generateSshPublicKey();
        const res = await api.post('/api/v1/repositories', {
          data: {
            alias,
            sshPublicKey,
            storageSize: input.storageSize ?? 10,
            comment: input.comment ?? '',
            alert: input.alert ?? 0,
            lanCommand: input.lanCommand ?? false,
            appendOnlyMode: input.appendOnlyMode ?? false,
            ...(input.storageTarget ? { storageTarget: input.storageTarget } : {}),
          },
        });
        expect(res.status(), await res.text()).toBe(200);
        const body = (await res.json()) as { id: number; repositoryName: string };
        owned.add(body.repositoryName);
        return { ...body, alias, sshPublicKey };
      },
      track: (repositoryName) => {
        owned.add(repositoryName);
      },
      list,
      get: async (repositoryName) =>
        (await list()).find((r) => r.repositoryName === repositoryName),
    };

    await provide(factory);

    for (const repositoryName of owned) {
      const repo = await factory.get(repositoryName);
      if (!repo) continue;
      if (repo.archived) {
        await api.post(`/api/v1/repositories/${repositoryName}/archive`, {
          data: { archived: false },
        });
      }
      await api.delete(`/api/v1/repositories/${repositoryName}`);
    }
  },
});

export { expect };
