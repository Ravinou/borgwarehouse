import fs from 'node:fs';
import path from 'node:path';
import { AUTH_FILE, BASE_URL, USE_DOCKER } from './env';
import { compose } from './docker';

async function waitForServer(timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/version`);
      if (res.ok) return;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`BorgWarehouse not reachable at ${BASE_URL}: ${String(lastError)}`);
}

export default async function globalSetup() {
  fs.rmSync(path.dirname(AUTH_FILE), { recursive: true, force: true });

  if (USE_DOCKER) {
    // Fresh volumes on every run make the suite idempotent.
    compose(['down', '--volumes', '--remove-orphans']);
    const build = process.env.E2E_SKIP_BUILD === 'true' ? [] : ['--build'];
    compose(['up', '--detach', '--force-recreate', '--renew-anon-volumes', ...build]);
  }

  await waitForServer(180_000);
}
