import { test, expect } from '../../support/fixtures';
import { CRONJOB_KEY } from '../../support/env';
import { callCron } from '../../support/cron';

test.describe('cron endpoints', () => {
  for (const endpoint of ['status', 'storage'] as const) {
    test(`${endpoint} cron rejects missing or wrong keys`, async () => {
      expect((await callCron(endpoint)).status).toBe(401);
      expect((await callCron(endpoint, 'Bearer wrong-key')).status).toBe(401);
      expect((await callCron(endpoint, `Bearer ${CRONJOB_KEY}`, 'GET')).status).toBe(401);
    });

    test(`${endpoint} cron runs with the right key`, async () => {
      const res = await callCron(endpoint, `Bearer ${CRONJOB_KEY}`);
      expect(res.status, res.body).toBe(200);
    });
  }
});
