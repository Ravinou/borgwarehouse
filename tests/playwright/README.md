## Playwright end-to-end tests

The suite builds the BorgWarehouse Docker image, starts it on a fresh stack
(`docker-compose.yml`), then drives the real app with Chromium: fresh install,
authentication, repositories, monitoring, setup wizard, account settings,
API tokens, cron jobs and a real `borg` backup from a client container.

Every test creates its own data and cleans it up, so the suite can be run again
and again, including against an instance that is already in use.

### Requirements

- Docker with the Compose plugin
- Dependencies installed (`pnpm install`) and Chromium for Playwright:
  `pnpm exec playwright install chromium`

### Run

From the repository root:

```bash
pnpm test:e2e          # build the image, start a fresh stack, run, tear down
pnpm test:e2e:ui       # same, with the Playwright UI
pnpm test:e2e:headed   # same, in a visible Chromium window, one test at a time
pnpm test:e2e:report   # open the last HTML report
```

Run a single file or project:

```bash
pnpm test:e2e specs/app/repositories.e2e.ts
pnpm test:e2e --project=chromium
```

### Options (environment variables)

| Variable              | Default              | Description                                                                              |
| --------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| `E2E_SKIP_BUILD`      | unset                | `true` reuses the `borgwarehouse:e2e` image instead of rebuilding it                     |
| `E2E_KEEP_CONTAINERS` | unset                | `true` leaves the stack running after the run (useful to debug)                          |
| `E2E_WEB_PORT`        | `3300`               | Port published on `127.0.0.1` for the web UI                                             |
| `E2E_BASE_URL`        | unset                | Target an already running instance; docker is not used and docker-only tests are skipped |
| `E2E_ADMIN_USERNAME`  | `admin`              | Admin username (created on a fresh install, used to sign in otherwise)                   |
| `E2E_ADMIN_PASSWORD`  | `e2e-Admin-Passw0rd` | Admin password                                                                           |
| `E2E_CRONJOB_KEY`     | `e2e-cronjob-key`    | `CRONJOB_KEY` of the target instance                                                     |
| `E2E_SLOWMO`          | `0`                  | Delay in ms added to every browser action, e.g. `500` with `test:e2e:headed`             |

Fast local loop once the image is built:

```bash
E2E_SKIP_BUILD=true E2E_KEEP_CONTAINERS=true pnpm test:e2e
docker compose -f tests/playwright/docker-compose.yml down -v   # when done
```

Watch the tests in a browser (local only):

```bash
E2E_SKIP_BUILD=true E2E_SLOWMO=500 pnpm test:e2e:headed
E2E_SKIP_BUILD=true pnpm test:e2e:headed specs/app/repositories.e2e.ts
E2E_SKIP_BUILD=true pnpm test:e2e --debug specs/app/auth.e2e.ts   # step by step with the inspector
```

### Layout

- `specs/setup`: fresh install and admin sign-in (runs first, stores the session)
- `specs/app`: feature tests, run in parallel
- `specs/serial`: cron jobs and the real backup (run alone, they touch every repository)
- `specs/credentials`: password and username changes, restored afterwards (run last)
- `support`: fixtures, helpers and global setup/teardown

### CI

The `Playwright E2E` workflow (`.github/workflows/playwright.yml`) runs the
suite on demand (Actions tab, "Run workflow"). The HTML report, traces, videos
and server logs are uploaded as the `playwright-report` artifact.
