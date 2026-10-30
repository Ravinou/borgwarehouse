import fs from 'node:fs';
import path from 'node:path';
import { E2E_DIR, USE_DOCKER } from './env';
import { compose } from './docker';

export default async function globalTeardown() {
  if (!USE_DOCKER) return;

  fs.mkdirSync(path.join(E2E_DIR, 'test-results'), { recursive: true });
  try {
    fs.writeFileSync(
      path.join(E2E_DIR, 'test-results', 'borgwarehouse.log'),
      compose(['logs', '--no-color', '--timestamps'])
    );
  } catch {
    // Logs are a debugging aid only.
  }

  if (process.env.E2E_KEEP_CONTAINERS !== 'true') {
    compose(['down', '--volumes', '--remove-orphans']);
  }
}
