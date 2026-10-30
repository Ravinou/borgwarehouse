import path from 'node:path';

export const E2E_DIR = path.resolve(__dirname, '..');
export const COMPOSE_FILE = path.join(E2E_DIR, 'docker-compose.yml');
export const AUTH_FILE = path.join(E2E_DIR, '.auth', 'admin.json');

// When E2E_BASE_URL is set, the suite targets an already running instance
// and never touches docker (docker-only tests are skipped).
export const EXTERNAL_URL = process.env.E2E_BASE_URL;
export const USE_DOCKER = !EXTERNAL_URL;
export const WEB_PORT = process.env.E2E_WEB_PORT ?? '3300';
export const BASE_URL = EXTERNAL_URL ?? `http://localhost:${WEB_PORT}`;

export const ADMIN = {
  username: process.env.E2E_ADMIN_USERNAME ?? 'admin',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'e2e-Admin-Passw0rd',
};

export const CRONJOB_KEY = process.env.E2E_CRONJOB_KEY ?? 'e2e-cronjob-key';

// request.newContext() inherits the project storageState: pass this to get an
// anonymous context.
export const NO_SESSION = { cookies: [], origins: [] };
