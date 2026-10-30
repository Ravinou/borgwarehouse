import type { Page } from '@playwright/test';
import { test, expect } from '../../support/fixtures';
import { USE_DOCKER } from '../../support/env';
import { uniqueName } from '../../support/ssh';
import { toast } from '../../support/ui';

// Account settings are global to the admin user: run these tests one by one.
test.describe.configure({ mode: 'serial' });

async function openTab(page: Page, tab: 'General' | 'Notifications' | 'Storage' | 'Integrations') {
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'Account', exact: true })).toBeVisible();
  await page.getByRole('button', { name: tab, exact: true }).click();
}

function settingSection(page: Page, title: string) {
  return page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
    .filter({ has: page.locator('input, [class*="control"]') })
    .last();
}

// The switch checkbox is visually hidden behind a slider.
function switchInput(page: Page, name: string) {
  return page.locator('label').filter({ hasText: name }).locator('input[type="checkbox"]');
}

test.describe('account settings', () => {
  test('email can be updated', async ({ page }) => {
    const email = `${uniqueName('e2e')}@example.com`;

    await openTab(page, 'General');
    const input = page.locator('input[name="email"]');
    await expect(input).toBeVisible();
    await input.fill('not-an-email');
    await expect(page.getByText('Your email is not valid.')).toBeVisible();
    await input.fill(email);
    await page.getByRole('button', { name: 'Update email' }).click();
    await expect(toast(page, 'Email updated!')).toBeVisible();

    await page.reload();
    await expect(page.locator('input[name="email"]')).toHaveValue(email);
  });

  test('date format is saved and applied', async ({ page, api }) => {
    const before = await (await api.get('/api/v1/account/date-format')).json();

    try {
      await openTab(page, 'General');
      const section = settingSection(page, 'Date format');
      await section.locator('[class*="control"]').first().click();
      await page.getByRole('option', { name: /^ISO/ }).click();
      await expect(toast(page, 'Date format updated!')).toBeVisible();

      await page.reload();
      await expect(settingSection(page, 'Date format').getByText(/^ISO/)).toBeVisible();
      const after = await (await api.get('/api/v1/account/date-format')).json();
      expect(after.dateFormat).not.toBe(before.dateFormat ?? undefined);
    } finally {
      if (before.dateFormat) {
        await api.put('/api/v1/account/date-format', { data: { dateFormat: before.dateFormat } });
      }
    }
  });

  test('email and Apprise alerts can be toggled', async ({ page, api }) => {
    const emailBefore = (await (await api.get('/api/v1/notif/email/alert')).json()).emailAlert;
    const appriseBefore = (await (await api.get('/api/v1/notif/apprise/alert')).json())
      .appriseAlert;

    try {
      await openTab(page, 'Notifications');

      const emailSwitch = switchInput(page, 'Alert me by email');
      await expect(emailSwitch).toBeEnabled();
      await page.getByText('Alert me by email', { exact: true }).click();
      await expect(
        toast(page, emailBefore ? 'Email notification disabled !' : 'Email notification enabled !')
      ).toBeVisible();
      await expect(emailSwitch).toBeChecked({ checked: !emailBefore });

      const appriseSwitch = switchInput(page, 'Notify my Apprise services');
      await expect(appriseSwitch).toBeEnabled();
      await page.getByText('Notify my Apprise services', { exact: true }).click();
      await expect(
        toast(
          page,
          appriseBefore ? 'Apprise notifications disabled' : 'Apprise notifications enabled'
        )
      ).toBeVisible();

      await page.reload();
      await page.getByRole('button', { name: 'Notifications', exact: true }).click();
      await expect(switchInput(page, 'Alert me by email')).toBeChecked({
        checked: !emailBefore,
      });
      await expect(switchInput(page, 'Notify my Apprise services')).toBeChecked({
        checked: !appriseBefore,
      });
    } finally {
      await api.put('/api/v1/notif/email/alert', { data: { emailAlert: !!emailBefore } });
      await api.put('/api/v1/notif/apprise/alert', { data: { appriseAlert: !!appriseBefore } });
    }
  });

  test('webhook alert can be enabled and configured', async ({ page, api }) => {
    const before = (await (await api.get('/api/v1/notif/webhook/alert')).json()).webhookAlert;
    const url = `https://${uniqueName('hook')}.example.com/hook`;

    try {
      if (before) {
        await api.put('/api/v1/notif/webhook/alert', { data: { webhookAlert: false } });
      }
      await openTab(page, 'Notifications');

      const urlInput = page.getByPlaceholder('https://your-endpoint.example.com/hook');
      await expect(urlInput).toBeHidden();
      await expect(switchInput(page, 'Enable webhook notifications')).toBeEnabled();
      await page.getByText('Enable webhook notifications', { exact: true }).click();
      await expect(toast(page, 'Webhook notifications enabled')).toBeVisible();

      await urlInput.fill('not a url');
      await urlInput.blur();
      await expect(page.getByText('Invalid URL.')).toBeVisible();

      await urlInput.fill(url);
      await urlInput.blur();
      await expect(page.getByText('✅ Webhook configuration saved.')).toBeVisible();

      await page.reload();
      await page.getByRole('button', { name: 'Notifications', exact: true }).click();
      await expect(page.getByPlaceholder('https://your-endpoint.example.com/hook')).toHaveValue(
        url
      );
    } finally {
      await api.put('/api/v1/notif/webhook/alert', { data: { webhookAlert: !!before } });
    }
  });

  test('storage targets are listed with their status', async ({ page }) => {
    test.skip(!USE_DOCKER, 'Storage targets are configured by the e2e docker stack');

    await openTab(page, 'Storage');
    await expect(page.getByRole('heading', { name: 'Storage targets' })).toBeVisible();

    await expect(page.getByText('E2E Target', { exact: true })).toBeVisible();
    await expect(page.getByText('Missing Target', { exact: true })).toBeVisible();
    await expect(page.getByText('Online', { exact: true })).toBeVisible();
    await expect(page.getByText('Unreachable', { exact: true })).toBeVisible();
  });
});
